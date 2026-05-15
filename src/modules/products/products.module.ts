import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository';
import { FILE_STORAGE } from './application/ports/file-storage.port';
import { ProductOrmEntity } from './infrastructure/persistence/typeorm/product.orm-entity';
import { CategoryOrmEntity } from './infrastructure/persistence/typeorm/category.orm-entity';
import { TypeormProductRepository } from './infrastructure/persistence/typeorm/typeorm-product.repository';
import { S3FileStorageService } from './infrastructure/storage/s3-file-storage.service';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { GetProductUseCase } from './application/use-cases/get-product.use-case';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { ProductsController } from './presentation/http/products.controller';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([ProductOrmEntity, CategoryOrmEntity])],
  controllers: [ProductsController],
  providers: [
    ListProductsUseCase,
    GetProductUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    TypeormProductRepository,
    S3FileStorageService,
    {
      provide: PRODUCT_REPOSITORY,
      useExisting: TypeormProductRepository,
    },
    {
      provide: FILE_STORAGE,
      useExisting: S3FileStorageService,
    },
  ],
})
export class ProductsModule {}
