import { Inject, Injectable, NotAcceptableException } from "@nestjs/common";
import { RegisterUserDto } from "../../presentation/http/dto/registerUser.dto";
import { RegisterResponseDto } from "../../presentation/http/dto/registerResponse.dto";
import { AUTH_USER_READER, type AuthUserReader } from "../ports/auth-user-reader.port";
import { UsersService } from "../../../users/users.service";
import { MailService } from "../../../../common/mailer.service";

@Injectable()
export class RegisterUserUseCase {
    constructor(
        @Inject(AUTH_USER_READER)
        private readonly authUserReader: AuthUserReader,
        private readonly usersService: UsersService,
        private readonly mailService: MailService,
    ) {}

    async execute(dto: RegisterUserDto): Promise<RegisterResponseDto> {
        const existingUser = await this.authUserReader.findByEmail(dto.email);

        if (existingUser) {
            throw new NotAcceptableException("Email already exists");
        }

        const user = await this.authUserReader.create({
            name: dto.name,
            email: dto.email,
            password: dto.password,
            role: "customer",
            phoneNumber: dto.phoneNumber,
        });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await this.usersService.updateEmailVerificationCode(user.id, otp, expiresAt);
        await this.mailService.sendVerificationEmail(dto.email, otp, dto.name);

        return {
            message: "User registered successfully. Check your email for the verification code.",
        };
    }
}
