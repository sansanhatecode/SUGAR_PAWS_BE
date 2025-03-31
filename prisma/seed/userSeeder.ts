import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedUsers() {
  const saltRounds = 10;

  const users = [
    {
      email: 'alice@example.com',
      name: 'Alice',
      username: 'alice123',
      isVerified: false,
      password: await bcrypt.hash('123456', saltRounds),
    },
    {
      email: 'bob@example.com',
      name: 'Bob',
      username: 'bob456',
      isVerified: true,
      password: await bcrypt.hash('123456', saltRounds),
    },
  ];

  await prisma.user.createMany({
    data: users,
  });
}
