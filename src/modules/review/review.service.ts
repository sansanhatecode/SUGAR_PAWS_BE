import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ApiResponse } from '../../common/response.types';
import {
  Review,
  OrderItem,
  Order,
  User,
  ProductDetail,
  Product,
} from '@prisma/client';

type ReviewWithIncludes = Review & {
  orderItem: OrderItem & {
    order: Order & {
      user: Pick<User, 'id' | 'name' | 'username'>;
    };
    productDetail: ProductDetail & {
      product: Pick<Product, 'id' | 'name'>;
    };
  };
};

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  private mapReviewToResponse(review: ReviewWithIncludes): ReviewResponseDto {
    return {
      id: review.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      orderItemId: review.orderItemId,
      rating: review.rating,
      comment: review.comment || undefined,
      isVerified: review.isVerified,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      userName:
        review.orderItem.order.user.name ||
        review.orderItem.order.user.username,
      productName: review.orderItem.productDetail.product.name,
      productId: review.orderItem.productDetail.product.id,
      orderDate: review.orderItem.order.createdAt,
      orderId: review.orderItem.order.id,
    };
  }

  async create(
    createReviewDto: CreateReviewDto,
  ): Promise<ApiResponse<ReviewResponseDto>> {
    try {
      // Check if order item exists
      const orderItem = await this.prisma.orderItem.findUnique({
        where: { id: createReviewDto.orderItemId },
        include: {
          order: {
            include: {
              user: { select: { id: true, name: true, username: true } },
            },
          },
          productDetail: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!orderItem) {
        return {
          statusCode: 404,
          message: 'Order item not found',
          error: 'Not Found',
        };
      }

      // Check if review already exists for this order item
      const existingReview = await this.prisma.review.findUnique({
        where: { orderItemId: createReviewDto.orderItemId },
      });

      if (existingReview) {
        return {
          statusCode: 400,
          message: 'Review already exists for this order item',
          error: 'Bad Request',
        };
      }

      // Create the review
      const review = (await this.prisma.review.create({
        data: {
          orderItemId: createReviewDto.orderItemId,
          rating: createReviewDto.rating,
          comment: createReviewDto.comment,
        },
        include: {
          orderItem: {
            include: {
              order: {
                include: {
                  user: { select: { id: true, name: true, username: true } },
                },
              },
              productDetail: {
                include: {
                  product: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      })) as ReviewWithIncludes;

      const responseData = this.mapReviewToResponse(review);

      return {
        statusCode: 201,
        message: 'Review created successfully',
        data: responseData,
      };
    } catch (error) {
      console.error('[ReviewService] Create error:', error);
      return {
        statusCode: 500,
        message: 'Failed to create review',
        error: 'Internal Server Error',
      };
    }
  }

  async findAllByProductId(
    productId: number,
  ): Promise<ApiResponse<ReviewResponseDto[]>> {
    try {
      // Find all reviews for a specific product
      const reviews = (await this.prisma.review.findMany({
        where: {
          orderItem: {
            productDetail: {
              productId: productId,
            },
          },
        },
        include: {
          orderItem: {
            include: {
              order: {
                include: {
                  user: { select: { id: true, name: true, username: true } },
                },
              },
              productDetail: {
                include: {
                  product: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })) as ReviewWithIncludes[];

      const responseData: ReviewResponseDto[] = reviews.map((review) =>
        this.mapReviewToResponse(review),
      );

      return {
        statusCode: 200,
        message: 'Reviews retrieved successfully',
        data: responseData,
      };
    } catch (error) {
      console.error('[ReviewService] FindAllByProductId error:', error);
      return {
        statusCode: 500,
        message: 'Failed to retrieve reviews',
        error: 'Internal Server Error',
      };
    }
  }

  async findOne(id: number): Promise<ApiResponse<ReviewResponseDto>> {
    try {
      const review = (await this.prisma.review.findUnique({
        where: { id },
        include: {
          orderItem: {
            include: {
              order: {
                include: {
                  user: { select: { id: true, name: true, username: true } },
                },
              },
              productDetail: {
                include: {
                  product: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      })) as ReviewWithIncludes | null;

      if (!review) {
        return {
          statusCode: 404,
          message: 'Review not found',
          error: 'Not Found',
        };
      }

      const responseData = this.mapReviewToResponse(review);

      return {
        statusCode: 200,
        message: 'Review retrieved successfully',
        data: responseData,
      };
    } catch (error) {
      console.error('[ReviewService] FindOne error:', error);
      return {
        statusCode: 500,
        message: 'Failed to retrieve review',
        error: 'Internal Server Error',
      };
    }
  }

  async update(
    id: number,
    updateReviewDto: UpdateReviewDto,
  ): Promise<ApiResponse<ReviewResponseDto>> {
    try {
      // Check if review exists
      const existingReview = await this.prisma.review.findUnique({
        where: { id },
      });

      if (!existingReview) {
        return {
          statusCode: 404,
          message: 'Review not found',
          error: 'Not Found',
        };
      }

      const review = (await this.prisma.review.update({
        where: { id },
        data: updateReviewDto,
        include: {
          orderItem: {
            include: {
              order: {
                include: {
                  user: { select: { id: true, name: true, username: true } },
                },
              },
              productDetail: {
                include: {
                  product: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      })) as ReviewWithIncludes;

      const responseData = this.mapReviewToResponse(review);

      return {
        statusCode: 200,
        message: 'Review updated successfully',
        data: responseData,
      };
    } catch (error) {
      console.error('[ReviewService] Update error:', error);
      return {
        statusCode: 500,
        message: 'Failed to update review',
        error: 'Internal Server Error',
      };
    }
  }

  async remove(id: number): Promise<ApiResponse<null>> {
    try {
      const existingReview = await this.prisma.review.findUnique({
        where: { id },
      });

      if (!existingReview) {
        return {
          statusCode: 404,
          message: 'Review not found',
          error: 'Not Found',
        };
      }

      await this.prisma.review.delete({
        where: { id },
      });

      return {
        statusCode: 200,
        message: 'Review deleted successfully',
        data: null,
      };
    } catch (error) {
      console.error('[ReviewService] Remove error:', error);
      return {
        statusCode: 500,
        message: 'Failed to delete review',
        error: 'Internal Server Error',
      };
    }
  }

  async getReviewStatsByProductId(productId: number): Promise<
    ApiResponse<{
      totalReviews: number;
      averageRating: number;
      ratingDistribution: { [key: number]: number };
    }>
  > {
    try {
      const reviews = await this.prisma.review.findMany({
        where: {
          orderItem: {
            productDetail: {
              productId: productId,
            },
          },
        },
        select: {
          id: true,
          rating: true,
        },
      });

      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          : 0;

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach((review) => {
        ratingDistribution[review.rating]++;
      });

      return {
        statusCode: 200,
        message: 'Review statistics retrieved successfully',
        data: {
          totalReviews,
          averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
          ratingDistribution,
        },
      };
    } catch (error) {
      console.error('[ReviewService] GetReviewStatsByProductId error:', error);
      return {
        statusCode: 500,
        message: 'Failed to retrieve review statistics',
        error: 'Internal Server Error',
      };
    }
  }

  // New method to get reviews by order ID (to get all reviews for all items in an order)
  async findAllByOrderId(
    orderId: number,
  ): Promise<ApiResponse<ReviewResponseDto[]>> {
    try {
      const reviews = (await this.prisma.review.findMany({
        where: {
          orderItem: {
            orderId: orderId,
          },
        },
        include: {
          orderItem: {
            include: {
              order: {
                include: {
                  user: { select: { id: true, name: true, username: true } },
                },
              },
              productDetail: {
                include: {
                  product: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })) as ReviewWithIncludes[];

      const responseData: ReviewResponseDto[] = reviews.map((review) =>
        this.mapReviewToResponse(review),
      );

      return {
        statusCode: 200,
        message: 'Reviews retrieved successfully',
        data: responseData,
      };
    } catch (error) {
      console.error('[ReviewService] FindAllByOrderId error:', error);
      return {
        statusCode: 500,
        message: 'Failed to retrieve reviews',
        error: 'Internal Server Error',
      };
    }
  }
}
