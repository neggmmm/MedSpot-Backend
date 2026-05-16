import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProviderApplicationStatus } from '../enums/provider-application-status.enum';

export class ReviewProviderApplicationDto {
  @IsEnum(ProviderApplicationStatus)
  @IsIn([ProviderApplicationStatus.APPROVED, ProviderApplicationStatus.REJECTED])
  status: ProviderApplicationStatus;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  rejectionReason?: string;
}
