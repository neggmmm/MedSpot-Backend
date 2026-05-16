import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProviderApplicationDto {
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
