import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    // Get current date ranges
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    // Get total users
    const totalUsers = await this.prisma.user.count();
    const usersLastMonth = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
      },
    });
    const usersTwoMonthsAgo = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: twoMonthsAgo,
          lt: lastMonth,
        },
      },
    });

    // Get total products
    const totalProducts = await this.prisma.product.count();
    const productsLastMonth = await this.prisma.product.count({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
      },
    });
    const productsTwoMonthsAgo = await this.prisma.product.count({
      where: {
        createdAt: {
          gte: twoMonthsAgo,
          lt: lastMonth,
        },
      },
    });

    // Get total orders
    const totalOrders = await this.prisma.order.count();
    const ordersLastMonth = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
      },
    });
    const ordersTwoMonthsAgo = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: twoMonthsAgo,
          lt: lastMonth,
        },
      },
    });

    // Get monthly revenue
    const revenueResult = await this.prisma.payment.aggregate({
      where: {
        status: 'PAID',
        paidAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const revenueLastMonthResult = await this.prisma.payment.aggregate({
      where: {
        status: 'PAID',
        paidAt: {
          gte: twoMonthsAgo,
          lt: lastMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const monthlyRevenue = revenueResult._sum.amount || 0;
    const revenueLastMonth = revenueLastMonthResult._sum.amount || 0;

    // Calculate percentage changes
    const usersPercentageChange = this.calculatePercentageChange(
      usersLastMonth,
      usersTwoMonthsAgo,
    );
    const productsPercentageChange = this.calculatePercentageChange(
      productsLastMonth,
      productsTwoMonthsAgo,
    );
    const ordersPercentageChange = this.calculatePercentageChange(
      ordersLastMonth,
      ordersTwoMonthsAgo,
    );
    const revenuePercentageChange = this.calculatePercentageChange(
      monthlyRevenue,
      revenueLastMonth,
    );

    return {
      totalUsers: {
        count: totalUsers,
        percentageChange: usersPercentageChange,
      },
      totalProducts: {
        count: totalProducts,
        percentageChange: productsPercentageChange,
      },
      totalOrders: {
        count: totalOrders,
        percentageChange: ordersPercentageChange,
      },
      monthlyRevenue: {
        amount: monthlyRevenue / 100, // Convert from cents to dollars
        percentageChange: revenuePercentageChange,
      },
    };
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  }
}
