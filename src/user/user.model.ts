import { Prisma } from '@prisma/client';

export class User implements Prisma.UserCreateInput {
  id: number;
  email: string;
  name: string | null;
  password: string;
  username: string;
  role: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
