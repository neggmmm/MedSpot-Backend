import { IsIn, IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListProductsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 10;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  minPrice?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @IsString()
  sortBy = 'id';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'ASC';

  @IsOptional()
  @IsString()
  search?: string;
}
