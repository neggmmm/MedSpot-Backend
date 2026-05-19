import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';
import { GetCategoryUseCase } from '../../application/use-cases/get-category.use-case';
import { UpdateCategoryUseCase } from '../../application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../../application/use-cases/delete-category.use-case';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly createUseCase: CreateCategoryUseCase,
    private readonly listUseCase: ListCategoriesUseCase,
    private readonly getUseCase: GetCategoryUseCase,
    private readonly updateUseCase: UpdateCategoryUseCase,
    private readonly deleteUseCase: DeleteCategoryUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return this.createUseCase.execute(dto);
  }

  @Get()
  async list(@Query('page') page = '1', @Query('limit') limit = '10') {
    const p = Math.max(1, parseInt(page as string, 10) || 1);
    const l = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10));
    return this.listUseCase.execute(p, l);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.getUseCase.execute(Number(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.updateUseCase.execute(Number(id), dto as any);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.deleteUseCase.execute(Number(id));
  }
}
