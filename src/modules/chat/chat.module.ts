import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatContextService } from './chat-context.service';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [ChatController],
  providers: [ChatService, ChatContextService, PrismaService],
  exports: [ChatService, ChatContextService],
})
export class ChatModule {}
