import { Voucher } from '@prisma/client';

export type VoucherModel = Voucher;

export interface VoucherValidationResult {
  isValid: boolean;
  message?: string;
  discountAmount?: number;
}

export interface VoucherUsageResult {
  success: boolean;
  message: string;
  voucherUsage?: {
    id: number;
    userId: number;
    voucherId: number;
    usedAt: Date;
    orderId: number | null;
  };
}
