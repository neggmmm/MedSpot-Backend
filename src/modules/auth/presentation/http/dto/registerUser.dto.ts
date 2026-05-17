import { IsEmail, IsNotEmpty, IsPhoneNumber, MinLength } from "class-validator";

export class RegisterUserDto{
    @IsNotEmpty()
    name:string;

    @IsEmail()
    email:string;

    @IsPhoneNumber()
    phoneNumber: string;

    @MinLength(8)
    password:string;
}