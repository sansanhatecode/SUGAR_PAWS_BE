import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import {
  ChatRequestDto,
  ChatResponseDto,
  ChatHistoryResponseDto,
} from './dto/chat.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

interface ApiResponse<T> {
  message: string;
  data: T;
}

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    username: string;
    role: string;
  };
}

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @ApiOperation({ summary: 'Send message to chatbot' })
  @ApiResponse({
    status: 201,
    description: 'Message processed successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  async sendMessage(
    @Request() req: AuthenticatedRequest,
    @Body() chatRequest: ChatRequestDto,
  ): Promise<ApiResponse<ChatResponseDto>> {
    const rawUserId = req.user.userId;
    console.log(
      'Chat Controller - userId:',
      rawUserId,
      'type:',
      typeof rawUserId,
    );
    console.log('Chat Controller - full user object:', req.user);

    // Ensure userId is a valid number
    const userId =
      typeof rawUserId === 'string' ? parseInt(rawUserId, 10) : rawUserId;
    if (!userId || isNaN(userId)) {
      throw new Error(`Invalid user ID: ${rawUserId}`);
    }

    const result = await this.chatService.sendMessage(userId, chatRequest);

    return {
      message: 'Message processed successfully',
      data: result,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user chat history' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of messages to retrieve (default: 20)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Starting position for data retrieval (default: 0)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Chat history retrieved successfully',
    type: ChatHistoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  async getChatHistory(
    @Request() req: AuthenticatedRequest,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<ApiResponse<ChatHistoryResponseDto>> {
    const userId = req.user.userId;
    const result = await this.chatService.getChatHistory(userId, limit, offset);

    return {
      message: 'Chat history retrieved successfully',
      data: result,
    };
  }

  @Delete('history')
  @ApiOperation({ summary: 'Clear all user chat history' })
  @ApiResponse({
    status: 200,
    description: 'Chat history cleared successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  async clearChatHistory(
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<null>> {
    const userId = req.user.userId;
    await this.chatService.clearChatHistory(userId);

    return {
      message: 'Chat history cleared successfully',
      data: null,
    };
  }
}
