import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CATEGORY_REPOSITORY, Paginated, CategoryRepository } from '../../../application/ports/category.repository';
import { CategoryOrmEntity } from './category.orm-entity';

@Injectable()
export class TypeormCategoryRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repo: Repository<CategoryOrmEntity>,
  ) {}

  async create(data: Partial<CategoryOrmEntity>): Promise<CategoryOrmEntity> {
    const entity = this.repo.create(data as any);
    return this.repo.save(entity as any) as Promise<CategoryOrmEntity>;
  }

  async findById(id: number): Promise<CategoryOrmEntity | null> {
    return this.repo.findOneBy({ id } as any) ?? null;
  }

  async findAllPaginated(page: number, limit: number): Promise<Paginated<CategoryOrmEntity>> {
    const [items, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });

    return { items, total, page, limit };
  }

  async update(id: number, data: Partial<CategoryOrmEntity>): Promise<CategoryOrmEntity> {
    await this.repo.update(id, data as any);
    const found = await this.findById(id);
    if (!found) throw new Error('Category not found');
    return found;
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
