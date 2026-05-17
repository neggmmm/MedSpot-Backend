import { Inject, Injectable, NotAcceptableException } from "@nestjs/common";
import { RegisterUserDto } from "../../presentation/http/dto/registerUser.dto";
import { RegisterResponseDto } from "../../presentation/http/dto/registerResponse.dto";
import { AUTH_USER_READER, type AuthUserReader} from "../ports/auth-user-reader.port";


@Injectable()
export class RegisterUserUseCase {
    constructor(
        @Inject(AUTH_USER_READER)
    private readonly authUserReader: AuthUserReader
    ) {}

    async execute(dto: RegisterUserDto): Promise<RegisterResponseDto> {
        const existingUser = await this.authUserReader.findByEmail(dto.email);

        if (existingUser) {
            throw new NotAcceptableException("Email already exists");
        }

        await this.authUserReader.create({
            name: dto.name,
            email: dto.email,
            password: dto.password,
            role: "customer",
            phoneNumber: dto.phoneNumber,
        });
        return {
      message: "User registered successfully",
        };
    }
}
