import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApiResponse as ApiResponseType } from '../../common/response.types';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new review for an order item' })
  @ApiResponse({
    status: 201,
    description: 'The review has been successfully created',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Order item not found' })
  async create(
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ApiResponseType<ReviewResponseDto>> {
    try {
      const result = await this.reviewService.create(createReviewDto);

      if (result.statusCode !== 201) {
        throw new HttpException(
          {
            statusCode: result.statusCode,
            message: result.message,
            error: result.error,
          },
          result.statusCode,
        );
      }

      return result;
    } catch (error) {
      console.error('[ReviewController] Create error:', error);
      throw new InternalServerErrorException('Failed to create review');
    }
  }

  @Get('product/:productId/stats')
  @ApiOperation({ summary: 'Get review statistics for a specific product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Review statistics retrieved successfully',
  })
  async getReviewStatsByProductId(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<
    ApiResponseType<{
      totalReviews: number;
      averageRating: number;
      ratingDistribution: { [key: number]: number };
    }>
  > {
    try {
      return await this.reviewService.getReviewStatsByProductId(productId);
    } catch (error) {
      console.error(
        '[ReviewController] GetReviewStatsByProductId error:',
        error,
      );
      throw new InternalServerErrorException(
        'Failed to fetch review statistics',
      );
    }
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get all reviews for items in a specific order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
    type: [ReviewResponseDto],
  })
  async findAllByOrderId(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<ApiResponseType<ReviewResponseDto[]>> {
    try {
      return await this.reviewService.findAllByOrderId(orderId);
    } catch (error) {
      console.error('[ReviewController] FindAllByOrderId error:', error);
      throw new InternalServerErrorException('Failed to fetch reviews');
    }
  }

  @Get('order/:orderId/status')
  @ApiOperation({ summary: 'Check if an order can be reviewed' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order review status retrieved successfully',
  })
  async checkOrderReviewStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<
    ApiResponseType<{
      canReview: boolean;
      completedItems: number;
      reviewedItems: number;
      pendingReviewItems: {
        orderItemId: number;
        productName: string;
        productId: number;
      }[];
    }>
  > {
    try {
      return await this.reviewService.checkOrderReviewStatus(orderId);
    } catch (error) {
      console.error('[ReviewController] CheckOrderReviewStatus error:', error);
      throw new InternalServerErrorException(
        'Failed to check order review status',
      );
    }
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all reviews for a specific product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
    type: [ReviewResponseDto],
  })
  async findAllByProductId(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<ApiResponseType<ReviewResponseDto[]>> {
    try {
      return await this.reviewService.findAllByProductId(productId);
    } catch (error) {
      console.error('[ReviewController] FindAllByProductId error:', error);
      throw new InternalServerErrorException('Failed to fetch reviews');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: 200,
    description: 'Review retrieved successfully',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseType<ReviewResponseDto>> {
    try {
      const result = await this.reviewService.findOne(id);

      if (result.statusCode === 404) {
        throw new HttpException(
          {
            statusCode: 404,
            message: result.message,
            error: 'Not Found',
          },
          404,
        );
      }

      return result;
    } catch (error) {
      console.error('[ReviewController] FindOne error:', error);
      throw new InternalServerErrorException('Failed to fetch review');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: 200,
    description: 'Review updated successfully',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ApiResponseType<ReviewResponseDto>> {
    try {
      const result = await this.reviewService.update(id, updateReviewDto);

      if (result.statusCode === 404) {
        throw new HttpException(
          {
            statusCode: 404,
            message: result.message,
            error: 'Not Found',
          },
          404,
        );
      }

      return result;
    } catch (error) {
      console.error('[ReviewController] Update error:', error);
      throw new InternalServerErrorException('Failed to update review');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: 200,
    description: 'Review deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseType<null>> {
    try {
      const result = await this.reviewService.remove(id);

      if (result.statusCode === 404) {
        throw new HttpException(
          {
            statusCode: 404,
            message: result.message,
            error: 'Not Found',
          },
          404,
        );
      }

      return result;
    } catch (error) {
      console.error('[ReviewController] Remove error:', error);
      throw new InternalServerErrorException('Failed to delete review');
    }
  }
}
