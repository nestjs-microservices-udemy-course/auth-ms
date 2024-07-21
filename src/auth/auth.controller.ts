import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register.user')
  registerUser(@Payload() registerDto: CreateAuthDto) {
    return this.authService.create(registerDto);
  }

  @MessagePattern('auth.login.user')
  loginUser() {
    return this.authService.findAll();
  }

  @MessagePattern('auth.verify.user')
  findOne() {
    return this.authService.findOne();
  }
}
