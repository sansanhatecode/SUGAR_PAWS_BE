import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';

import { MailModule } from './modules/mail/mail.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { CartModule } from './modules/cart/cart.module';
import { CartItemModule } from './modules/cart/cart-item/cart-item.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ProductModule,
    MailModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
          },
          ttl: 300,
        }),
      }),
    }),
    CartModule,
    CartItemModule,
  ],
})
export class AppModule {}
