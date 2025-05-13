import { District as PrismaDistrict } from '@prisma/client';

export class District implements PrismaDistrict {
  districtCode: number;
  name: string;
  cityCode: number;
}
