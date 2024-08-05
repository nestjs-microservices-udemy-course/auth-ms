import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import envs from 'src/config/envs';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    JwtModule.register({
      global: true,
      secret: envs.JWT_SECRET,
      signOptions: { expiresIn: envs.JWT_EXPIRES_IN },
    }),
  ],
})
export class AuthModule {}
