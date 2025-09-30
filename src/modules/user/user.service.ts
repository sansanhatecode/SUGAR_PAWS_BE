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

import { UserRepository } from './user.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await this.userRepository.create({
        ...data,
        password: hashedPassword,
      });
      await this.userRepository.createCartForUser(user.id);
      return user;
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
      return await this.userRepository.findAll({
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
      });
    } catch (error: unknown) {
      console.error(error);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async delete(id: number) {
    try {
      return await this.userRepository.delete(id);
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
      const user = await this.userRepository.findByEmailOrUsername(identifier);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
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
      return await this.userRepository.update(id, data);
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
      return await this.userRepository.update(userId, updateProfileDto);
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
      const user = await this.userRepository.findById(id, {
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
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error: unknown) {
      console.error('Error in findById:', error);
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
