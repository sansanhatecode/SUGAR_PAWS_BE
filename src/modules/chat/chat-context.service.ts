import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ChatContextService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductContext(query: string): Promise<string> {
    try {
      // Find related products from database
      const products = await this.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        include: {
          productDetails: {
            take: 1,
            orderBy: {
              price: 'asc',
            },
          },
        },
      });

      if (products.length === 0) {
        return '';
      }

      const productContext = products
        .map((product) => {
          const price = product.productDetails[0]?.price || 0;
          return `- ${product.name}: ${product.description} (Price from: ${price}đ)`;
        })
        .join('\n');

      return `\nRelated product information:\n${productContext}`;
    } catch {
      return '';
    }
  }

  async getCategoryContext(): Promise<string> {
    try {
      const categories = await this.prisma.category.findMany({
        take: 10,
        select: {
          name: true,
        },
      });

      if (categories.length === 0) {
        return '';
      }

      const categoryContext = categories
        .map((category) => `- ${category.name}`)
        .join('\n');

      return `\nProduct categories:\n${categoryContext}`;
    } catch {
      return '';
    }
  }

  async getOrderContext(userId: number): Promise<string> {
    try {
      const recentOrders = await this.prisma.order.findMany({
        where: { userId },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      });

      if (recentOrders.length === 0) {
        return '';
      }

      const orderContext = recentOrders
        .map(
          (order) =>
            `- Order #${order.id}: ${order.status} (${new Date(order.createdAt).toLocaleDateString('en-US')})`,
        )
        .join('\n');

      return `\nRecent orders:\n${orderContext}`;
    } catch {
      return '';
    }
  }

  extractKeywords(message: string): string[] {
    const keywords: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Fashion category keywords
    const fashionCategories = [
      'shirt',
      'dress',
      'pants',
      'skirt',
      'jacket',
      'blouse',
      'áo',
      'váy',
      'quần',
      'đầm',
      'jacket',
      'áo khoác',
    ];
    fashionCategories.forEach((type) => {
      if (lowerMessage.includes(type)) {
        keywords.push(type);
      }
    });

    // Product type keywords
    const productTypes = [
      'clothing',
      'fashion',
      'accessories',
      'shoes',
      'bags',
      'jewelry',
      'quần áo',
      'thời trang',
      'phụ kiện',
      'giày',
      'túi xách',
      'trang sức',
    ];
    productTypes.forEach((type) => {
      if (lowerMessage.includes(type)) {
        keywords.push(type);
      }
    });

    return keywords;
  }
}
