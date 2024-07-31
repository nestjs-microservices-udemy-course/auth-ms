import { IsEmail, IsString } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  name;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
