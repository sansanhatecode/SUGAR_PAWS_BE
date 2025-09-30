import { Injectable } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        role: data.role as UserRole,
      },
    });
  }

  async findAll(select?: Prisma.UserSelect) {
    return this.prisma.user.findMany({ select });
  }

  async delete(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }

  async findByEmailOrUsername(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async findById(id: number, select?: Prisma.UserSelect) {
    return this.prisma.user.findUnique({ where: { id }, select });
  }

  async createCartForUser(userId: number) {
    return this.prisma.cart.create({ data: { userId } });
  }
}
