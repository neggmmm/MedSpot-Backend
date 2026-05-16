import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ProviderApplicationStatus } from '../enums/provider-application-status.enum';

export class ListProviderApplicationsQueryDto {
  @IsOptional()
  @IsEnum(ProviderApplicationStatus)
  status?: ProviderApplicationStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;
}
