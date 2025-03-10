import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedUsers() {
  await prisma.user.createMany({
    data: [
      {
        email: 'alice@example.com',
        name: 'Alice',
        username: 'alice123',
        role: 'user',
        isVerified: true,
        password: 'hashed_password_1',
      },
      {
        email: 'bob@example.com',
        name: 'Bob',
        username: 'bob456',
        role: 'admin',
        isVerified: true,
        password: 'hashed_password_2',
      },
    ],
  });
}
