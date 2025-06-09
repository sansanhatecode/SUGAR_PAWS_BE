export class Review {
  id: number;
  orderId: number;
  rating: number; // 1-5 stars
  comment?: string;
  isVerified: boolean; // Verified purchase
  createdAt: Date;
  updatedAt: Date;

  order?: any;
}
