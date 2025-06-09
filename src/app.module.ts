import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { CartModule } from './modules/cart/cart.module';
import { CartItemModule } from './modules/cart/cart-item/cart-item.module';
import { ViettelPostModule } from './modules/viettel-post/viettel-post.module';
import { AddressModule as AddressFeatureModule } from './modules/address/address.module';
import { ShippingAddressModule } from './modules/address/shipping-address/shipping-address.module';
import { OrderModule } from './modules/order/order.module';
import { CloudinaryModule } from './modules/cloudinary';
import { CategoriesModule } from './modules/categories/categories.module';
import { ReviewModule } from './modules/review/review.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ProductModule,
    MailModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
          },
          ttl: 300,
        });
        return {
          store,
        };
      },
    }),
    CartModule,
    CartItemModule,
    ViettelPostModule,
    AddressFeatureModule,
    ShippingAddressModule,
    OrderModule,
    CloudinaryModule,
    CategoriesModule,
    ReviewModule,
  ],
})
export class AppModule {}
