import { VoucherType, DiscountType } from '@prisma/client';

export class VoucherResponseDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: VoucherType;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  maxUsageCount: number | null;
  currentUsageCount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
