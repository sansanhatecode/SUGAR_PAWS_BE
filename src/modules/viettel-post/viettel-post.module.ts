// viettel-post.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ViettelPostService } from './viettel-post.service';
import { ViettelPostController } from './viettel-post.controller';

@Module({
  imports: [HttpModule],
  providers: [ViettelPostService],
  controllers: [ViettelPostController],
})
export class ViettelPostModule {}
