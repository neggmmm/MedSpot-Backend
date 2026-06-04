import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CATEGORY_REPOSITORY, Paginated, CategoryRepository } from '../../../application/ports/category.repository';
import { CategoryOrmEntity } from './category.orm-entity';
import { RedisService } from '../../../../../common/redis/redis.service';

/**
 * Categories change very rarely (admin-only mutations).
 * Cache them aggressively — 1 hour TTL.
 */
const CATEGORY_TTL = 3600;

@Injectable()
export class TypeormCategoryRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repo: Repository<CategoryOrmEntity>,
    private readonly redisService: RedisService,
  ) {}

  // ─── Cache key helpers ──────────────────────────────────────────────────────

  private singleKey(id: number)              { return `categories:single:${id}`; }
  private listKey(page: number, limit: number) { return `categories:list:${page}:${limit}`; }

  private async bustAll(): Promise<void> {
    await Promise.all([
      this.redisService.delPattern('categories:list:*'),
      this.redisService.delPattern('categories:single:*'),
    ]);
  }

  // ─── Read (cache-first) ─────────────────────────────────────────────────────

  async findById(id: number): Promise<CategoryOrmEntity | null> {
    const key    = this.singleKey(id);
    const cached = await this.redisService.get<CategoryOrmEntity>(key);
    if (cached) return cached;

    const entity = await this.repo.findOneBy({ id } as any) ?? null;
    if (entity) await this.redisService.set(key, entity, CATEGORY_TTL);
    return entity;
  }

  async findAllPaginated(page: number, limit: number): Promise<Paginated<CategoryOrmEntity>> {
    const key    = this.listKey(page, limit);
    const cached = await this.redisService.get<Paginated<CategoryOrmEntity>>(key);
    if (cached) return cached;

    const [items, total] = await this.repo.findAndCount({
      skip:  (page - 1) * limit,
      take:  limit,
      order: { name: 'ASC' },
    });

    const result = { items, total, page, limit };
    await this.redisService.set(key, result, CATEGORY_TTL);
    return result;
  }

  // ─── Write (always DB, then bust cache) ────────────────────────────────────

  async create(data: Partial<CategoryOrmEntity>): Promise<CategoryOrmEntity> {
    const entity = this.repo.create(data as any);
    const saved  = await this.repo.save(entity as any) as CategoryOrmEntity;
    await this.bustAll();
    return saved;
  }

  async update(id: number, data: Partial<CategoryOrmEntity>): Promise<CategoryOrmEntity> {
    await this.repo.update(id, data as any);
    const found = await this.repo.findOneBy({ id } as any);
    if (!found) throw new Error('Category not found');
    await this.bustAll();
    return found;
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
    await this.bustAll();
  }
}
