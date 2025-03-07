import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { User } from './user.model';
import { GetUsersResponseDto } from './dto/get-users-response.dto';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(
    @Body() user: User,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const result: User = await this.userService.create(user);
      return response.status(HttpStatus.CREATED).json({
        status: 'Ok!',
        message: 'User created successfully!',
        data: result,
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
            : 'Internal Server Error!',
      });
    }
  }

  @Get()
  async getAllUsers(@Res() response: Response): Promise<Response> {
    try {
      const result: GetUsersResponseDto[] = await this.userService.findAll();
      return response.status(HttpStatus.OK).json({
        status: 'Ok!',
        message: 'Successfully fetched data!',
        data: result,
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
            : 'Internal Server Error!',
      });
    }
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    try {
      const deletedUser = await this.userService.delete(id);
      return response.status(HttpStatus.OK).json({
        status: 'Ok!',
        message: 'User deleted successfully!',
        data: deletedUser,
      });
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        return response.status(error.getStatus()).json({
          status: 'Error',
          message: error.message,
        });
      }
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'Error',
        message: 'Internal Server Error',
      });
    }
  }
}
