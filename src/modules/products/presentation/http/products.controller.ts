import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product.use-case';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { Product } from '../../domain/entities/product';
import { AuthorizationGuard } from '../../../../common/guards/authorization.guard';
import { AuthGuard } from '../../../auth/presentation/http/guard/auth.guard';

interface AuthenticatedRequest {
  user: {
    sub: number;
    role: string;
  };
}

@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  @Get()
  async getAllProducts(
    @Query() query: ListProductsQueryDto = new ListProductsQueryDto(),
  ): Promise<{ data: Product[]; page: number; limit: number; total: number }> {
    query.limit = Math.min(query.limit, 50);
    const result = await this.listProductsUseCase.execute(query);

    return {
      data: result.data,
      page: query.page,
      limit: query.limit,
      total: result.total,
    };
  }

  @Get(':id')
  getProduct(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.getProductUseCase.execute(id);
  }

  @Post()
  @UseGuards(AuthGuard, AuthorizationGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(new Error('Only jpeg, png, and webp images are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  createProduct(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateProductDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Product> {
    return this.createProductUseCase.execute({
      name: dto.name,
      price: dto.price,
      userId: req.user.sub,
      file,
      categoryId: dto.categoryId,
    });
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Product> {
    return this.updateProductUseCase.execute({
      id,
      userId: req.user.sub,
      userRole: req.user.role,
      name: dto.name,
      price: dto.price,
    });
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  deleteProduct(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.deleteProductUseCase.execute({
      id,
      userId: req.user.sub,
      userRole: req.user.role,
    });
  }
}
