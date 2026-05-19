import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CategoryOrmEntity } from './infrastructure/persistence/typeorm/category.orm-entity';
import { TypeormCategoryRepository } from './infrastructure/persistence/typeorm/typeorm-category.repository';
import { CATEGORY_REPOSITORY } from './application/ports/category.repository';
import { CategoriesController } from './presentation/http/categories.controller';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { GetCategoryUseCase } from './application/use-cases/get-category.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([CategoryOrmEntity])],
  controllers: [CategoriesController],
  providers: [
    CreateCategoryUseCase,
    ListCategoriesUseCase,
    GetCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    TypeormCategoryRepository,
    {
      provide: CATEGORY_REPOSITORY,
      useExisting: TypeormCategoryRepository,
    },
  ],
  exports: [],
})
export class CategoriesModule {}
