import { Injectable, BadRequestException } from '@nestjs/common';
import { VerifyEmailDto } from '../../presentation/http/dto/verifyEmail.dto';
import { VerifyEmailResponseDto } from '../../presentation/http/dto/verifyEmailResponse.dto';
import { UsersService } from '../../../users/users.service';

@Injectable()
export class VerifyEmailUseCase {
  constructor(private readonly usersService: UsersService) {}

  async execute(dto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    await this.usersService.verifyEmailCode(dto.email, dto.code);
    return { message: 'Email verified successfully' };
  }
}
