import { Prisma, User } from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import { GetUsersResponseDto } from './dto/get-users-response.dto';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      // Tạo user trước
      const user = await this.prisma.user.create({
        data: {
          ...data,
          role: data.role as UserRole,
          password: hashedPassword,
        },
      });
      // Sau khi tạo user, tạo cart cho user đó
      await this.prisma.cart.create({
        data: {
          userId: user.id,
        },
      });
      return user; // Trả về user sau khi tạo cart thành công
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const duplicatedField = error.meta?.target as string;
          throw new BadRequestException(
            `The ${duplicatedField} is already taken`,
          );
        }
        throw new InternalServerErrorException(
          'Database error: Unable to create user',
        );
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async findAll(): Promise<GetUsersResponseDto[]> {
    try {
      return await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          isVerified: true,
          phoneNumber: true,
          gender: true,
          dayOfBirth: true,
          monthOfBirth: true,
          yearOfBirth: true,
        },
      });
    } catch (error: unknown) {
      console.error(error);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async delete(id: number) {
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async findByEmailOrUsername(identifier: string) {
    try {
      if (!identifier) {
        throw new BadRequestException('Email or username is required');
      }

      const user = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return await this.prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
      });
    } catch (error: unknown) {
      console.error(error);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    try {
      if (data.password) {
        data.password = await bcrypt.hash(data.password as string, 10);
      }
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: updateProfileDto,
      });
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async findById(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          phoneNumber: true,
          gender: true,
          dayOfBirth: true,
          monthOfBirth: true,
          yearOfBirth: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }
}
