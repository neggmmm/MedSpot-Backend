import { Product } from '../entities/product';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
  findAll(ListProductQueryData): Promise<{data: Product[]; total: number}>;
  findById(id: number): Promise<Product | null>;
  findLowStockByOwner(ownerId: number): Promise<Product[]>;
  create(data: CreateProductRepositoryData): Promise<Product>;
  update(id: number, data: UpdateProductRepositoryData): Promise<Product>;
  transaction<T>(cb: (repo: ProductRepository) => Promise<T>): Promise<T>;
  delete(id: number): Promise<void>;
}
export interface ListProductQueryData{
    page: number;
    limit: number; 
    sortBy: string;
    order: 'ASC' | 'DESC';
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    categoryId?: number;
}

export interface CreateProductRepositoryData {
  name: string;
  price: number;
  userId: number;
  image?: string;
  stock: number;
  lowStockThreshold?: number;
  categoryId?: number;
}

export interface UpdateProductRepositoryData {
  name?: string;
  price?: number;
  image?: string;
  stock?: number;
  lowStockThreshold?: number;
}
