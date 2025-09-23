import { Resolver, Query, Args, Int, Context } from '@nestjs/graphql';
import { UserService } from './user.service';
import { UserType } from './user.type';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ContextUser } from 'src/common/request.types';

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => UserType, { name: 'user' })
  async getUserById(@Args('id', { type: () => Int }) id: number) {
    return this.userService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [UserType], { name: 'users' })
  async getAllUsers(@Context() context: ContextUser) {
    const user = context.req?.user;
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied: Admins only');
    }
    return this.userService.findAll();
  }
}
