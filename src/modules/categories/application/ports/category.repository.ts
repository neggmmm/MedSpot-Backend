import { CategoryOrmEntity } from '../../infrastructure/persistence/typeorm/category.orm-entity';

export const CATEGORY_REPOSITORY = 'CATEGORY_REPOSITORY';

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export interface CategoryRepository {
  create(data: Partial<CategoryOrmEntity>): Promise<CategoryOrmEntity>;
  findById(id: number): Promise<CategoryOrmEntity | null>;
  findAllPaginated(page: number, limit: number): Promise<Paginated<CategoryOrmEntity>>;
  update(id: number, data: Partial<CategoryOrmEntity>): Promise<CategoryOrmEntity>;
  delete(id: number): Promise<void>;
}
