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

@Injectable()
export class TypeormProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly ormRepository: Repository<ProductOrmEntity>,
  ) { }

  async findAll(query: ListProductQueryData): Promise<{ data: Product[]; total: number }> {
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

    new SearchSepecification(search).apply(qb)
    new PriceSpecifictaion(minPrice, maxPrice).apply(qb)

    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    const allowedSortFields = ['id', 'price', 'name'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'id';

    qb.orderBy(`product.${sortField}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [products, total] = await qb.getManyAndCount();

    return {
      data: products.map(this.toDomain),
      total,
    };
  }

  async transaction<T>(cb: (repo: ProductRepository) => Promise<T>): Promise<T> {
    return this.ormRepository.manager.transaction(async (manager) => {
      const repo = new TypeormProductRepository(manager.getRepository(ProductOrmEntity));
      return cb(repo);
    });
  }

  async findById(id: number): Promise<Product | null> {
    const product = await this.ormRepository.findOneBy({ id });
    return product ? this.toDomain(product) : null;
  }

  async create(data: CreateProductRepositoryData): Promise<Product> {
    const product = this.ormRepository.create(data);
    const savedProduct = await this.ormRepository.save(product);
    return this.toDomain(savedProduct);
  }

  async update(id: number, data: UpdateProductRepositoryData): Promise<Product> {
    await this.ormRepository.update(id, data);
    const updatedProduct = await this.ormRepository.findOneByOrFail({ id });
    return this.toDomain(updatedProduct);
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
  }

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
