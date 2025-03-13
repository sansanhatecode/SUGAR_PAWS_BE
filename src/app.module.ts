import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { MailModule } from './mail/mail.module';
import { CacheManagerModule } from './cache/cache.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ProductModule,
    MailModule,
    CacheManagerModule,
  ],
})
export class AppModule {}
