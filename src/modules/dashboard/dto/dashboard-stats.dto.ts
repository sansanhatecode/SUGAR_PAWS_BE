export interface StatisticItem {
  count?: number;
  amount?: number;
  percentageChange: number;
}

export interface DashboardStatsDto {
  totalUsers: StatisticItem;
  totalProducts: StatisticItem;
  totalOrders: StatisticItem;
  monthlyRevenue: StatisticItem;
}
