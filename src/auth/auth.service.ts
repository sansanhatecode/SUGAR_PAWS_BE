import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { MailService } from '../modules/mail/mail.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from 'src/modules/user/user.service';
import { ApiResponse } from '../common/response.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache & {
      set<T>(key: string, value: T, options?: { ttl: number }): Promise<void>;
      get<T>(key: string): Promise<T | undefined>;
      del(key: string): Promise<void>;
    },
  ) {}

  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async setVerificationCodeToCache(email: string, code: string): Promise<void> {
    const cacheKey = `verify:${email}`;
    await this.cacheManager.set(cacheKey, code, { ttl: 300 });
    console.log('Set cache key:', cacheKey, 'with code:', code);
  }

  async signup(
    signupDto: SignupDto,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    try {
      const newUser = await this.userService.create(signupDto);
      if (!newUser) {
        throw new InternalServerErrorException('Failed to sign up');
      }
      const code = this.generateVerificationCode();
      await this.mailService.sendVerificationEmail(signupDto.email, code);
      await this.setVerificationCodeToCache(signupDto.email, code);
      // Sinh JWT token cho user mới
      const payload = {
        username: newUser.username,
        sub: newUser.id,
        role: newUser.role,
      };
      const accessToken = this.jwtService.sign(payload);
      return {
        statusCode: HttpStatus.CREATED,
        message: `Verification code sent successfully to ${signupDto.email}`,
        data: { accessToken },
      };
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to sign up');
    }
  }

  async verifyRegister(
    email: string,
    inputCode: string,
  ): Promise<{ verified: boolean; access_token?: string }> {
    const storedCode = await this.cacheManager.get(`verify:${email}`);
    console.log(storedCode, inputCode);

    if (storedCode && storedCode === inputCode) {
      await this.cacheManager.del(`verify:${email}`);

      const user = await this.userService.findByEmailOrUsername(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.isVerified) {
        user.isVerified = true;
        await this.userService.update(user.id, user);
      }
      const payload = {
        username: user.username,
        sub: user.id,
        role: user.role,
      };
      const token = this.jwtService.sign(payload);
      return { verified: true, access_token: token };
    }
    throw new BadRequestException('Verification code is invalid or expired');
  }

  async validateUser(email: string, enteredPassword: string): Promise<any> {
    try {
      const user = await this.userService.findByEmailOrUsername(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(
        enteredPassword,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async signin(identifier: string, enteredPassword: string) {
    try {
      if (!identifier || !enteredPassword) {
        throw new BadRequestException(
          'Username or email and password are required',
        );
      }

      const user = await this.userService.findByEmailOrUsername(identifier);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.password) {
        throw new UnauthorizedException('wrong password');
      }

      const isPasswordValid: boolean = await bcrypt.compare(
        enteredPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = {
        username: user.username,
        sub: user.id,
        role: user.role,
      };
      return {
        data: { accessToken: this.jwtService.sign(payload) },
      };
    } catch (error: unknown) {
      console.error(error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to sign in');
    }
  }
}
