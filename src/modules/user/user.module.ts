import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma.service';
import { UserResolver } from './user.resolver';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
