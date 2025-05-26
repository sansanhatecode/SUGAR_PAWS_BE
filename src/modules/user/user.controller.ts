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
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { User } from './user.model';
import { GetUsersResponseDto } from './dto/get-users-response.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/common/request.types';
import { UpdateProfileDto } from './dto/update-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUserInfo(
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ) {
    try {
      const userId = request?.user?.userId;

      if (!userId) {
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const userInfo = await this.userService.findById(Number(userId));

      return response.status(HttpStatus.OK).json({
        status: 'Ok!',
        message: 'User information retrieved successfully',
        data: userInfo,
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

  @Patch('me')
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const userId = request?.user?.userId;
      if (!userId) {
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const updatedUser = await this.userService.updateProfile(
        Number(userId),
        updateProfileDto,
      );
      return response.status(HttpStatus.OK).json({
        status: 'Ok!',
        message: 'User profile updated successfully',
        data: updatedUser,
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

  @Patch(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<User>,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const updatedUser = await this.userService.update(id, updateData);
      return response.status(HttpStatus.OK).json({
        status: 'Ok!',
        message: 'User updated successfully!',
        data: updatedUser,
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
