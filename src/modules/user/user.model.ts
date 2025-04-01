import { UserRole } from '@prisma/client';

export class User {
  id: number;
  email: string;
  name: string | null;
  password: string;
  username: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
