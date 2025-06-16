/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { ChatContextService } from './chat-context.service';
import { OpenAI } from 'openai';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly chatContextService: ChatContextService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY is not configured');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }

  async sendMessage(
    userId: number,
    chatRequest: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    try {
      // Validate that the user exists
      this.logger.debug(`Processing chat message for userId: ${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
      });

      if (!user) {
        this.logger.error(`User with ID ${userId} not found`);
        throw new UnauthorizedException('User not found');
      }

      this.logger.debug(`User found: ${user.username} (ID: ${user.id})`);

      // Get recent chat history for the user (last 5 messages)
      const recentHistory = await this.prisma.chatHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      // Create context from chat history
      const conversationHistory = recentHistory
        .reverse()
        .map((chat) => [
          { role: 'user' as const, content: chat.message },
          { role: 'assistant' as const, content: chat.response },
        ])
        .flat();

      // Get context from database
      const keywords = this.chatContextService.extractKeywords(
        chatRequest.message,
      );
      let additionalContext = '';

      if (keywords.length > 0) {
        // Get products matching multiple keywords
        const products =
          await this.chatContextService.searchProductsByKeywords(keywords);
        if (products.length > 0) {
          const productContext = this.formatProductsForContext(products);
          additionalContext += productContext;
        }

        // Also get general product context if no specific products found
        if (products.length === 0) {
          const productContext =
            await this.chatContextService.getProductContext(keywords[0]);
          if (productContext) {
            additionalContext += productContext;
          }
        }
      }

      // System prompt for fashion store chatbot
      const systemPrompt = `You are a customer support chatbot for Sugar Paws fashion store. 
      Your tasks are:
      1. Provide advice on fashion products (clothing, accessories, shoes, bags)
      2. Help with style recommendations and fashion trends
      3. Answer questions about orders, delivery, and returns
      4. Assist with size guides and product information
      5. Support customers in a friendly and professional manner
      6. When customers ask about specific products, provide product links in format: /collections/[product-id]
        IMPORTANT INSTRUCTIONS FOR PRODUCT RECOMMENDATIONS:
      - When you find relevant products in the context, ALWAYS include the product link in your response
      - Format product links as clickable Markdown links: [Product Name](/collections/[product-id])
      - Example: [Áo sơ mi trắng](/collections/123)
      - When recommending products, provide the exact clickable link so customers can easily view them
      - If multiple products match the request, list them with their respective clickable links
      - Always be helpful and encourage customers to check out the recommended products
      
      Please respond briefly, helpfully, and always maintain a positive attitude. 
      If you're unsure about information, suggest the customer contact the support team.
      
      ${additionalContext}`;

      // Create messages for OpenAI API
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory,
        { role: 'user' as const, content: chatRequest.message },
      ];

      // Call OpenAI API
      let botResponse: string;
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 500,
          temperature: 0.7,
        });

        botResponse =
          completion.choices[0]?.message?.content ||
          'Sorry, I cannot answer this question at the moment.';
      } catch (error) {
        this.logger.error('Error calling OpenAI API:', error);
        // Fallback response when API fails
        botResponse = this.getFallbackResponse(chatRequest.message);
      }

      // Save to database
      this.logger.debug(
        `Saving chat history for userId: ${userId}, message: "${chatRequest.message}"`,
      );
      const chatHistory = await this.prisma.chatHistory.create({
        data: {
          userId,
          message: chatRequest.message,
          response: botResponse,
        },
      });

      return {
        id: chatHistory.id,
        message: chatHistory.message,
        response: chatHistory.response,
        responseFormat: 'markdown',
        createdAt: chatHistory.createdAt,
      };
    } catch (error) {
      this.logger.error('Error processing chat message:', error);
      throw new InternalServerErrorException('Unable to process message');
    }
  }

  async getChatHistory(userId: number, limit: number = 20, offset: number = 0) {
    try {
      const [chatHistory, total] = await Promise.all([
        this.prisma.chatHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.chatHistory.count({
          where: { userId },
        }),
      ]);

      return {
        data: chatHistory.map((chat) => ({
          id: chat.id,
          message: chat.message,
          response: chat.response,
          responseFormat: 'markdown',
          createdAt: chat.createdAt,
        })),
        total,
      };
    } catch (error) {
      this.logger.error('Error fetching chat history:', error);
      throw new InternalServerErrorException('Unable to fetch chat history');
    }
  }

  async clearChatHistory(userId: number): Promise<void> {
    try {
      await this.prisma.chatHistory.deleteMany({
        where: { userId },
      });
    } catch (error) {
      this.logger.error('Error clearing chat history:', error);
      throw new InternalServerErrorException('Unable to clear chat history');
    }
  }
  private formatProductsForContext(products: any[]): string {
    if (products.length === 0) {
      return '';
    }

    const productContext = products
      .map((product) => {
        const price = product.productDetails[0]?.price || 0;
        const categoryNames = product.categories
          .map((pc: { category: { name: string } }) => pc.category.name)
          .join(', ');
        return `- [${product.name}](/collections/${product.id}): ${product.description}${categoryNames ? ` | Categories: ${categoryNames}` : ''} | Price from: ${price}đ`;
      })
      .join('\n');

    return `\nFound products matching your request:\n${productContext}`;
  }
  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('product') ||
      lowerMessage.includes('clothing') ||
      lowerMessage.includes('fashion') ||
      lowerMessage.includes('sản phẩm') ||
      lowerMessage.includes('quần áo') ||
      lowerMessage.includes('thời trang')
    ) {
      return 'We have a wide variety of fashion products including clothing, accessories, shoes, and bags. You can browse our [latest collections](/collections) on our website. Try asking me about specific items like "show me dresses" or "I need a jacket" and I\'ll provide direct links to products that match your needs!';
    }

    if (
      lowerMessage.includes('order') ||
      lowerMessage.includes('delivery') ||
      lowerMessage.includes('đơn hàng') ||
      lowerMessage.includes('giao hàng')
    ) {
      return 'For order and delivery information, you can check in your [account](/account) or [contact our customer support team](/contact) for detailed assistance.';
    }

    if (
      lowerMessage.includes('size') ||
      lowerMessage.includes('fit') ||
      lowerMessage.includes('return') ||
      lowerMessage.includes('exchange') ||
      lowerMessage.includes('kích thước') ||
      lowerMessage.includes('đổi trả')
    ) {
      return 'For size guides, fitting advice, or information about returns and exchanges, please check our [size chart](/size-guide) or [contact our support team](/contact). We want to ensure you get the perfect fit!';
    }

    return 'Thank you for contacting Sugar Paws! I will try my best to support you. Could you describe your issue in more detail? You can also browse our [products](/collections) or [contact us](/contact) for assistance.';
  }
}
