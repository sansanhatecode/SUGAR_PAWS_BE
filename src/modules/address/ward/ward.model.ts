import { Ward as PrismaWard } from '@prisma/client';

export class Ward implements PrismaWard {
  wardCode: number;
  name: string;
  districtCode: number;
}
