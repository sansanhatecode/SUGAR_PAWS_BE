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
            { tags: { hasSome: [query] } },
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
          categories: {
            include: {
              category: true,
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
          const categoryNames = product.categories
            .map((pc) => pc.category.name)
            .join(', ');
          return `- ${product.name} (ID: ${product.id}): ${product.description}${categoryNames ? ` | Categories: ${categoryNames}` : ''} | Price from: ${price}đ | Link: /collections/${product.id}`;
        })
        .join('\n');

      return `\nRelated product information:\n${productContext}`;
    } catch {
      return '';
    }
  }

  async searchProductsByKeywords(keywords: string[]): Promise<any[]> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          OR: keywords.flatMap((keyword) => [
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
            { tags: { hasSome: [keyword] } },
          ]),
        },
        take: 10,
        include: {
          productDetails: {
            take: 1,
            orderBy: {
              price: 'asc',
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      return products;
    } catch {
      return [];
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
      'jeans',
      'sweater',
      'hoodie',
      't-shirt',
      'polo',
      'shorts',
      'leggings',
      'blazer',
      'coat',
      'áo',
      'váy',
      'quần',
      'đầm',
      'jacket',
      'áo khoác',
      'áo thun',
      'áo sơ mi',
      'quần jean',
      'đầm dự tiệc',
      'áo len',
    ];

    // Product type keywords
    const productTypes = [
      'clothing',
      'fashion',
      'accessories',
      'shoes',
      'bags',
      'jewelry',
      'handbag',
      'backpack',
      'sneakers',
      'boots',
      'sandals',
      'heels',
      'necklace',
      'earrings',
      'bracelet',
      'watch',
      'sunglasses',
      'belt',
      'hat',
      'scarf',
      'quần áo',
      'thời trang',
      'phụ kiện',
      'giày',
      'túi xách',
      'trang sức',
      'ba lô',
      'giày thể thao',
      'sandal',
      'giày cao gót',
      'vòng cổ',
      'khuyên tai',
      'đồng hồ',
      'kính mát',
      'thắt lưng',
      'nón',
      'khăn',
    ];

    // Color keywords
    const colors = [
      'red',
      'blue',
      'green',
      'yellow',
      'black',
      'white',
      'pink',
      'purple',
      'orange',
      'brown',
      'đỏ',
      'xanh',
      'vàng',
      'đen',
      'trắng',
      'hồng',
      'tím',
      'cam',
      'nâu',
    ];

    // Size keywords
    const sizes = [
      'xs',
      's',
      'm',
      'l',
      'xl',
      'xxl',
      'small',
      'medium',
      'large',
    ];

    // Search for all keyword types
    [...fashionCategories, ...productTypes, ...colors, ...sizes].forEach(
      (keyword) => {
        if (lowerMessage.includes(keyword)) {
          keywords.push(keyword);
        }
      },
    );

    // Extract potential product names (words that might be product names)
    const words = lowerMessage.split(/\s+/);
    const potentialProductWords = words.filter(
      (word) =>
        word.length > 2 &&
        ![
          'the',
          'and',
          'or',
          'but',
          'for',
          'with',
          'without',
          'của',
          'và',
          'hoặc',
          'nhưng',
          'cho',
          'với',
        ].includes(word),
    );

    keywords.push(...potentialProductWords.slice(0, 5)); // Limit to 5 potential words

    return [...new Set(keywords)]; // Remove duplicates
  }
}
