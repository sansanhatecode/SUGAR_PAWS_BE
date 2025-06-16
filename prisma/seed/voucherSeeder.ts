import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedVouchers() {
  const now = new Date();
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

  const vouchers = [
    // Shipping Vouchers
    {
      code: 'FREESHIP50',
      name: 'Free Shipping for Orders Over $50',
      description: 'Get free shipping when you spend $50 or more on your order',
      type: 'SHIPPING' as const,
      discountType: 'FIXED_AMOUNT' as const,
      discountValue: 100000, // 100k VND shipping fee
      maxDiscountAmount: null,
      minOrderAmount: 500000, // 500k VND minimum order
      maxUsageCount: 1000,
      currentUsageCount: 0,
      startDate: now,
      endDate: threeMonthsFromNow,
      isActive: true,
    },
    {
      code: 'SHIP25OFF',
      name: '25% Off Shipping',
      description: 'Save 25% on shipping costs for any order',
      type: 'SHIPPING' as const,
      discountType: 'PERCENTAGE' as const,
      discountValue: 25,
      maxDiscountAmount: 50000,
      minOrderAmount: 200000,
      maxUsageCount: 500,
      currentUsageCount: 0,
      startDate: now,
      endDate: oneMonthFromNow,
      isActive: true,
    },

    {
      code: 'WELCOME10',
      name: 'Welcome 10% Discount',
      description: 'Welcome new customers with 10% off their first order',
      type: 'DISCOUNT' as const,
      discountType: 'PERCENTAGE' as const,
      discountValue: 10,
      maxDiscountAmount: 100000, // Max 100k VND discount
      minOrderAmount: 300000, // 300k VND minimum order
      maxUsageCount: null, // Unlimited usage
      currentUsageCount: 0,
      startDate: now,
      endDate: sixMonthsFromNow,
      isActive: true,
    },
    {
      code: 'SAVE50K',
      name: 'Save 50,000 VND',
      description:
        'Get 50,000 VND off your order when you spend 1,000,000 VND or more',
      type: 'DISCOUNT' as const,
      discountType: 'FIXED_AMOUNT' as const,
      discountValue: 50000,
      maxDiscountAmount: null,
      minOrderAmount: 1000000, // 1M VND minimum order
      maxUsageCount: 200,
      currentUsageCount: 0,
      startDate: now,
      endDate: threeMonthsFromNow,
      isActive: true,
    },
    {
      code: 'BIGDEAL20',
      name: 'Big Deal 20% Off',
      description: 'Huge savings with 20% off on orders over 2,000,000 VND',
      type: 'DISCOUNT' as const,
      discountType: 'PERCENTAGE' as const,
      discountValue: 20,
      maxDiscountAmount: 500000, // Max 500k VND discount
      minOrderAmount: 2000000, // 2M VND minimum order
      maxUsageCount: 100,
      currentUsageCount: 0,
      startDate: now,
      endDate: oneMonthFromNow,
      isActive: true,
    },

    // Special Event Vouchers
    {
      code: 'FLASH15',
      name: 'Flash Sale 15% Off',
      description: 'Limited time flash sale - 15% off everything',
      type: 'DISCOUNT' as const,
      discountType: 'PERCENTAGE' as const,
      discountValue: 15,
      maxDiscountAmount: 200000, // Max 200k VND discount
      minOrderAmount: 500000, // 500k VND minimum order
      maxUsageCount: 50,
      currentUsageCount: 0,
      startDate: now,
      endDate: oneMonthFromNow,
      isActive: true,
    },
    {
      code: 'LOYALTY100K',
      name: 'Loyalty Reward 100K',
      description:
        'Thank you for being a loyal customer! 100,000 VND off your next purchase',
      type: 'DISCOUNT' as const,
      discountType: 'FIXED_AMOUNT' as const,
      discountValue: 100000,
      maxDiscountAmount: null,
      minOrderAmount: 1500000, // 1.5M VND minimum order
      maxUsageCount: 25,
      currentUsageCount: 0,
      startDate: now,
      endDate: threeMonthsFromNow,
      isActive: true,
    },

    // Holiday/Seasonal Vouchers
    {
      code: 'SUMMER30',
      name: 'Summer Special 30% Off',
      description: 'Beat the heat with 30% off summer collection',
      type: 'DISCOUNT' as const,
      discountType: 'PERCENTAGE' as const,
      discountValue: 30,
      maxDiscountAmount: 300000, // Max 300k VND discount
      minOrderAmount: 800000, // 800k VND minimum order
      maxUsageCount: 150,
      currentUsageCount: 0,
      startDate: now,
      endDate: threeMonthsFromNow,
      isActive: true,
    },
    {
      code: 'NEWUSER25K',
      name: 'New User Bonus',
      description:
        'Welcome bonus for new users - 25,000 VND off your first order',
      type: 'DISCOUNT' as const,
      discountType: 'FIXED_AMOUNT' as const,
      discountValue: 25000,
      maxDiscountAmount: null,
      minOrderAmount: 250000, // 250k VND minimum order
      maxUsageCount: null, // Unlimited for new users
      currentUsageCount: 0,
      startDate: now,
      endDate: sixMonthsFromNow,
      isActive: true,
    },

    // Premium Vouchers
    {
      code: 'VIP40',
      name: 'VIP Members 40% Off',
      description: 'Exclusive VIP discount - 40% off for premium members',
      type: 'DISCOUNT' as const,
      discountType: 'PERCENTAGE' as const,
      discountValue: 40,
      maxDiscountAmount: 800000, // Max 800k VND discount
      minOrderAmount: 3000000, // 3M VND minimum order
      maxUsageCount: 20,
      currentUsageCount: 0,
      startDate: now,
      endDate: oneMonthFromNow,
      isActive: true,
    },
  ];

  await prisma.voucher.createMany({
    data: vouchers,
    skipDuplicates: true, // Skip if voucher code already exists
  });

  console.log(`✅ Seeded ${vouchers.length} vouchers successfully`);
}

if (require.main === module) {
  void (async () => {
    try {
      await prisma.voucher.deleteMany();
      await seedVouchers();
      console.log('Voucher seeding completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error seeding vouchers:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}
