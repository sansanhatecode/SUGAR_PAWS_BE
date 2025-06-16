import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({
    description: 'User message',
    example: 'I want to learn about your fashion collections',
  })
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @IsString({ message: 'Message must be a string' })
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters' })
  message: string;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'Chat conversation ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'User message',
    example: 'I want to learn about your fashion collections',
  })
  message: string;
  @ApiProperty({
    description: 'Response from chatbot',
    example:
      'Hello! I can help you explore our fashion collections. What type of clothing or accessories are you looking for?',
  })
  response: string;

  @ApiProperty({
    description: 'Response format type (markdown, plain)',
    example: 'markdown',
    default: 'markdown',
  })
  responseFormat?: string;

  @ApiProperty({
    description: 'Creation time',
    example: '2025-06-16T10:30:00.000Z',
  })
  createdAt: Date;
}

export class ChatHistoryResponseDto {
  @ApiProperty({
    description: 'Chat history list',
    type: [ChatResponseDto],
  })
  data: ChatResponseDto[];

  @ApiProperty({
    description: 'Total number of messages',
    example: 10,
  })
  total: number;
}
