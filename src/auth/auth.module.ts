import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { LogoutService } from './logout.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    UserModule,
    PassportModule,
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret_key',
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '61d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LogoutService],
  exports: [AuthService],
})
export class AuthModule {}
