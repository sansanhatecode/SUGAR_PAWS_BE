export class ReviewResponseDto {
  id: number;
  orderItemId: number;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Additional fields for product reviews
  userName?: string;
  productName?: string;
  productId?: number;
  orderDate?: Date;
  orderId?: number; // Keep for backward compatibility if needed
}
