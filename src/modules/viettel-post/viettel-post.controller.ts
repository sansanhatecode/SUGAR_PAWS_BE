// viettel-post.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ViettelPostService } from './viettel-post.service';

@Controller('viettel-post')
export class ViettelPostController {
  constructor(private readonly viettelPostService: ViettelPostService) {}

  @Post('create-order')
  async createOrder(@Body() body: any) {
    const token = await this.viettelPostService.getToken(
      process.env.VIETTEL_USERNAME || '',
      process.env.VIETTEL_PASSWORD || '',
    );

    console.log('Token:', token);

    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await this.viettelPostService.createOrder(token, body);
    //eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }
}
