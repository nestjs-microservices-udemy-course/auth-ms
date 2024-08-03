import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import envs from 'src/config/envs';
import { RegisterUserDto } from './dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interfaces';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private readonly jwtService: JwtService,
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

      const { accessToken } = this.getJwToken({ id: user.id });

      return {
        user: rest,
        token: accessToken,
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

      const { accessToken } = this.getJwToken({ id: user.id });

      return {
        user: rest,
        token: accessToken,
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async findOne(id: string) {
    const user = await this.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new RpcException({
        status: 400,
        message: 'user_not_found',
      });
    }

    return user;
  }

  async verifyToken(token: string) {
    try {
      const { id } = this.jwtService.verify(token, {
        secret: envs.JWT_SECRET,
      });

      const user = await this.findOne(id);

      const accessToken = this.jwtService.sign({ id: user.id });

      return {
        user,
        token: accessToken,
      };
    } catch (error) {
      console.debug(error);
      throw new RpcException({
        status: 400,
        message: 'invalid_token',
      });
    }
  }

  private getJwToken(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
    };
  }
}
