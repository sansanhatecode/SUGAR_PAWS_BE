import { City as PrismaCity } from '@prisma/client';

export class City implements PrismaCity {
  cityCode: number;
  name: string;
}
