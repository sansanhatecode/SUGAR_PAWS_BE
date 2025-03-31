export enum OrderStatus {
  PENDING = 'PENDING', // Đã đặt hàng nhưng chưa thanh toán
  PAID = 'PAID', // Đã thanh toán thành công
  PROCESSING = 'PROCESSING', // Đang chuẩn bị hàng
  SHIPPED = 'SHIPPED', // Đã gửi hàng
  DELIVERED = 'DELIVERED', // Đã giao hàng thành công
  CANCELLED = 'CANCELLED', // Đã hủy
  REFUNDED = 'REFUNDED', // Đã hoàn tiền
}
