import { IsEmail, IsNotEmpty, IsPhoneNumber, MinLength } from "class-validator";

export class CreateUserDto{
    @IsNotEmpty()
    name:string;

    @IsEmail()
    email:string;

    @IsPhoneNumber('EG')
    phoneNumber:string;
    
    @MinLength(8)
    password:string;

    @IsNotEmpty()
    role:string;
}