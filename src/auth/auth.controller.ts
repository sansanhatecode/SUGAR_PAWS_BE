import {
  Controller,
  Post,
  Body,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
