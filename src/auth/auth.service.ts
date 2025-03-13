import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { MailService } from '../mail/mail.service';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly cacheService: CacheService,
  ) {}

  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async signup(signupDto: SignupDto): Promise<{ message: string }> {
    try {
      const newUser = await this.userService.create(signupDto);
      if (!newUser) {
        throw new InternalServerErrorException('Failed to sign up');
      }
      const code = this.generateVerificationCode();
      await this.mailService.sendVerificationEmail(signupDto.email, code);
      await this.cacheService.setCache(`verify:${signupDto.email}`, code, 300);
      console.log('Saved code to Redis:', code);

      return {
        message:
          'User registered successfully. Please check your email for the verification code.',
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
    const storedCode = await this.cacheService.getCache(`verify:${email}`);
    console.log(storedCode, inputCode);

    if (storedCode && storedCode === inputCode) {
      await this.cacheService.deleteCache(`verify:${email}`);

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
        access_token: this.jwtService.sign(payload),
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
