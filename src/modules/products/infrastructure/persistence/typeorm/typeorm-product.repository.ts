import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateProductRepositoryData,
  ListProductQueryData,
  ProductRepository,
  UpdateProductRepositoryData,
} from '../../../domain/repositories/product.repository';
import { Product } from '../../../domain/entities/product';
import { ProductOrmEntity } from './product.orm-entity';
import { PriceSpecifictaion } from './queries/price.spec';
import { SearchSepecification } from './queries/search.spec';
import { RedisService } from '../../../../../common/redis/redis.service';

/** How long a single product stays cached (5 minutes) */
const SINGLE_TTL = 300;

/** How long a product list page stays cached (60 seconds) */
const LIST_TTL = 60;

@Injectable()
export class TypeormProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly ormRepository: Repository<ProductOrmEntity>,
    private readonly redisService: RedisService,
  ) {}

  // ─── Cache key helpers ──────────────────────────────────────────────────────

  /**
   * Build a stable cache key for a list query.
   * Keys are sorted alphabetically so {page:1, limit:10} and {limit:10, page:1}
   * produce the exact same key.
   */
  private listKey(query: ListProductQueryData): string {
    const stable = Object.fromEntries(
      Object.entries(query).sort(([a], [b]) => a.localeCompare(b)),
    );
    return `products:list:${JSON.stringify(stable)}`;
  }

  private singleKey(id: number): string {
    return `products:single:${id}`;
  }

  /**
   * Bust every list page that was cached.
   * Called whenever a product is created, updated, or deleted so stale
   * paginated results don't linger.
   */
  private async bustListCache(): Promise<void> {
    await this.redisService.delPattern('products:list:*');
  }

  // ─── Repository methods ─────────────────────────────────────────────────────

  async findAll(query: ListProductQueryData): Promise<{ data: Product[]; total: number }> {
    const cacheKey = this.listKey(query);

    // 1. Try cache first
    const cached = await this.redisService.get<{ data: Product[]; total: number }>(cacheKey);
    if (cached) return cached;

    // 2. Cache miss → hit the DB
    const {
      page,
      limit,
      sortBy = 'id',
      order = 'ASC',
      minPrice,
      maxPrice,
      search,
      categoryId,
    } = query;

    const qb = this.ormRepository.createQueryBuilder('product')
      .select([
        'product.id',
        'product.name',
        'product.price',
        'product.userId',
        'product.image',
        'product.stock',
        'product.lowStockThreshold',
      ]);

    new SearchSepecification(search).apply(qb);
    new PriceSpecifictaion(minPrice, maxPrice).apply(qb);

    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    const allowedSortFields = ['id', 'price', 'name'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'id';

    qb.orderBy(`product.${sortField}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [products, total] = await qb.getManyAndCount();

    const result = { data: products.map(this.toDomain), total };

    // 3. Store in cache for next requests
    await this.redisService.set(cacheKey, result, LIST_TTL);

    return result;
  }

  async findById(id: number): Promise<Product | null> {
    const cacheKey = this.singleKey(id);

    // 1. Try cache first
    const cached = await this.redisService.get<Product>(cacheKey);
    if (cached) return cached;

    // 2. Cache miss → hit the DB
    const product = await this.ormRepository.findOneBy({ id });
    if (!product) return null;

    const domain = this.toDomain(product);

    // 3. Store in cache
    await this.redisService.set(cacheKey, domain, SINGLE_TTL);

    return domain;
  }

  async create(data: CreateProductRepositoryData): Promise<Product> {
    const product = this.ormRepository.create(data);
    const savedProduct = await this.ormRepository.save(product);

    // New product → all list pages are now stale
    await this.bustListCache();

    return this.toDomain(savedProduct);
  }

  async update(id: number, data: UpdateProductRepositoryData): Promise<Product> {
    await this.ormRepository.update(id, data);
    const updatedProduct = await this.ormRepository.findOneByOrFail({ id });
    const domain = this.toDomain(updatedProduct);

    // Invalidate this product's single cache + every list page
    await Promise.all([
      this.redisService.del(this.singleKey(id)),
      this.bustListCache(),
    ]);

    return domain;
  }

  async findLowStockByOwner(ownerId: number): Promise<Product[]> {
    const products = await this.ormRepository
      .createQueryBuilder('product')
      .where('product.userId = :ownerId', { ownerId })
      .andWhere('product.stock <= product.lowStockThreshold')
      .getMany();

    return products.map(this.toDomain);
  }

  async delete(id: number): Promise<void> {
    await this.ormRepository.delete(id);

    // Invalidate this product's single cache + every list page
    await Promise.all([
      this.redisService.del(this.singleKey(id)),
      this.bustListCache(),
    ]);
  }

  async transaction<T>(cb: (repo: ProductRepository) => Promise<T>): Promise<T> {
    return this.ormRepository.manager.transaction(async (manager) => {
      const repo = new TypeormProductRepository(
        manager.getRepository(ProductOrmEntity),
        this.redisService,
      );
      return cb(repo);
    });
  }

  // ─── Mapper ─────────────────────────────────────────────────────────────────

  private toDomain(product: ProductOrmEntity): Product {
    return new Product(
      product.id,
      product.name,
      Number(product.price),
      product.userId,
      product.image,
      product.stock,
      product.lowStockThreshold,
    );
  }
}
