import { Injectable, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RegisterUserDto } from './dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  onModuleInit() {
    this.$connect();
    this.logger.info('Database connected');
  }

  async registerUser(registerDto: RegisterUserDto) {
    const { email, name, password } = registerDto;

    try {
      const user = await this.user.findUnique({
        where: {
          email,
        },
      });

      if (user) {
        throw new RpcException({
          status: 400,
          message: 'user_already_exists',
        });
      }

      const newUser = await this.user.create({
        data: {
          email,
          password: bcrypt.hashSync(password, 10),
          name,
        },
      });

      const { password: _, ...rest } = newUser;

      return {
        user: rest,
        token: 'ABC',
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const user = await this.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        throw new RpcException({
          status: 400,
          message: 'invalid_credentials',
        });
      }

      const isValid = bcrypt.compareSync(password, user.password);

      if (!isValid) {
        throw new RpcException({
          status: 400,
          message: 'invalid_credentials',
        });
      }

      const { password: _, ...rest } = user;

      return {
        user: rest,
        token: 'ABC',
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  findOne() {
    return `This action validates auth`;
  }
}
