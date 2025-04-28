// viettel-post.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ViettelPostService {
  constructor(private httpService: HttpService) {}

  private readonly BASE_URL = 'https://partner.viettelpost.vn/v2';

  async getToken(username: string, password: string): Promise<string> {
    const res = await firstValueFrom(
      this.httpService.post(`${this.BASE_URL}/user/Login`, {
        USERNAME: username,
        PASSWORD: password,
      }),
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return res.data.data.token;
  }

  async createOrder(token: string, orderData: any) {
    const res = await firstValueFrom(
      this.httpService.post(`${this.BASE_URL}/order/createOrder`, orderData, {
        headers: {
          Token: token,
        },
      }),
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return res.data;
  }

  async getTrackingInfo(token: string, orderNumber: string) {
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${this.BASE_URL}/order/getOrderTracking`, {
          headers: {
            Token: token,
          },
          params: {
            ORDER_NUMBER: orderNumber,
          },
        }),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return res.data;
    } catch (err) {
      console.error(
        'Lỗi lấy tracking từ Viettel Post:',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        err?.response?.data || err.message,
      );
      throw err;
    }
  }

  async getOrderList(token: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data } = await firstValueFrom(
      this.httpService.post(
        'https://partner.viettelpost.vn/v2/order/getOrderList',
        {
          PAGE_INDEX: 1,
          PAGE_SIZE: 20,
          STATUS: -1, // -1: tất cả trạng thái
        },
        {
          headers: {
            Token: token,
          },
        },
      ),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data;
  }
}
