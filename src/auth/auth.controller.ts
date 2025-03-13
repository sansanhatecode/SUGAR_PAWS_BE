import {
  Controller,
  Post,
  Body,
  HttpException,
  InternalServerErrorException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LogoutService } from './logout.service';
import { Request } from 'express';
import { MailService } from '../mail/mail.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logoutService: LogoutService,
    private readonly mailService: MailService,
  ) {}

  @Post('signin')
  async signin(@Body() signinDto: SigninDto) {
    try {
      return await this.authService.signin(
        signinDto.identifier,
        signinDto.password,
      );
    } catch (error: unknown) {
      console.error('[AuthController] Signin error:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to sign in');
    }
  }

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    try {
      return await this.authService.signup(signupDto);
    } catch (error: unknown) {
      console.error('[AuthController] Signup error:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to sign up');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  logout(@Req() req: Request): { message: string } {
    const token: string = req.headers.authorization?.split(' ')[1] ?? '';
    if (token) {
      this.logoutService.invalidateToken(token);
    }
    return { message: 'Logged out successfully' };
  }

  @Post('verify-code')
  async verifyCode(@Body('email') email: string, @Body('code') code: string) {
    const result = await this.authService.verifyRegister(email, code);
    return result;
  }

  // @Post('send-code')
  // async sendCode(@Body('email') email: string) {
  //   const code = this.authService.generateVerificationCode();
  //   await this.mailService.sendVerificationEmail(email, code);
  //   return { message: 'Validate code sent', data: { code } };
  // }
}
