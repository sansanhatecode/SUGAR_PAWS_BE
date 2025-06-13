import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Res,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats(@Res() response: Response): Promise<Response> {
    try {
      const stats = await this.dashboardService.getDashboardStats();
      return response.status(HttpStatus.OK).json({
        status: 'Ok!',
        message: 'Dashboard statistics retrieved successfully!',
        data: stats,
      });
    } catch (error: unknown) {
      console.error(error);
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      return response.status(status).json({
        status: 'Error',
        message:
          error instanceof HttpException
            ? error.message
            : 'Something went wrong',
      });
    }
  }
}
