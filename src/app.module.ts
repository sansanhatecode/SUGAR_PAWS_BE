import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { MailModule } from './mail/mail.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { CartModule } from './cart/cart.module';
import { CartItemModule } from './cart/cart-item/cart-item.module';

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
