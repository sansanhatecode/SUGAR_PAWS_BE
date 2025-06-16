# Voucher Module

This module provides comprehensive voucher management functionality for the Sugar Paws e-commerce platform.

## Features

- Create and manage vouchers (Admin only)
- Apply discount and shipping vouchers
- Validate vouchers before applying
- Track voucher usage
- Support for different voucher types (DISCOUNT, SHIPPING)
- Support for different discount types (PERCENTAGE, FIXED_AMOUNT)

## API Endpoints

### Admin Endpoints (Require ADMIN role)

#### Create Voucher
```
POST /vouchers
```

**Request Body:**
```json
{
  "code": "WELCOME10",
  "name": "Welcome 10% Discount",
  "description": "Welcome new customers with 10% off their first order",
  "type": "DISCOUNT",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "maxDiscountAmount": 100000,
  "minOrderAmount": 200000,
  "maxUsageCount": 1000,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "isActive": true
}
```

#### Get All Vouchers
```
GET /vouchers/all
```

#### Get Voucher by ID
```
GET /vouchers/:id
```

#### Update Voucher
```
PUT /vouchers/:id
```

#### Delete Voucher
```
DELETE /vouchers/:id
```

### User Endpoints

#### Get Active Vouchers
```
GET /vouchers/active
```

#### Get User's Used Vouchers
```
GET /vouchers/my-vouchers
```

#### Validate Voucher
```
POST /vouchers/validate
```

**Request Body:**
```json
{
  "voucherCode": "WELCOME10",
  "orderAmount": 500000
}
```

**Response:**
```json
{
  "isValid": true,
  "message": "Voucher is valid",
  "discountAmount": 50000
}
```

#### Apply Voucher to Order
```
POST /vouchers/apply
```

**Request Body:**
```json
{
  "voucherCode": "WELCOME10",
  "orderId": 123
}
```

## Voucher Types

### DISCOUNT
- Reduces the order total amount
- Can be PERCENTAGE or FIXED_AMOUNT

### SHIPPING
- Reduces shipping costs
- Can be PERCENTAGE or FIXED_AMOUNT

## Discount Types

### PERCENTAGE
- Reduces by a percentage (e.g., 10%)
- Can have `maxDiscountAmount` to cap the discount

### FIXED_AMOUNT
- Reduces by a fixed amount (e.g., 50000 VND)

## Validation Rules

1. **Voucher must exist and be active**
2. **Current date must be between startDate and endDate**
3. **User cannot use the same voucher twice**
4. **Order amount must meet minimum requirement** (if specified)
5. **Voucher usage count must not exceed limit** (if specified)

## Usage Flow

1. **User browses active vouchers**: `GET /vouchers/active`
2. **User validates voucher**: `POST /vouchers/validate`
3. **User applies voucher during checkout**: `POST /vouchers/apply`

## Database Schema

The module uses two main tables:
- `Voucher`: Stores voucher details
- `UserVoucher`: Tracks voucher usage by users

## Integration with Order System

The voucher module is designed to integrate with the order system. When applying a voucher:
1. Validate the voucher
2. Calculate discount amount
3. Create UserVoucher record
4. Update voucher usage count
5. Apply discount to order total

## Examples

### Creating a Shipping Voucher
```json
{
  "code": "FREESHIP50",
  "name": "Free Shipping",
  "description": "Free shipping for orders over 500k",
  "type": "SHIPPING",
  "discountType": "FIXED_AMOUNT",
  "discountValue": 30000,
  "minOrderAmount": 500000,
  "maxUsageCount": 100,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

### Creating a Percentage Discount Voucher
```json
{
  "code": "SAVE20",
  "name": "Save 20%",
  "description": "Get 20% off your order",
  "type": "DISCOUNT",
  "discountType": "PERCENTAGE",
  "discountValue": 20,
  "maxDiscountAmount": 200000,
  "minOrderAmount": 300000,
  "maxUsageCount": 50,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-06-30T23:59:59Z"
}
```
