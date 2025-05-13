import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CityData {
  name_with_type: string;
  code: string;
}

interface DistrictData {
  parent_code: string;
}

interface WardData {
  name_with_type?: string;
  code?: string;
  parent_code: string;
}

// Helper function to read and clean JSON files with comments
function readJSONWithComments<T>(filePath: string): T {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    // Remove single-line comments (//...)
    const withoutSingleLineComments = fileContent.replace(/\/\/.*$/gm, '');
    return JSON.parse(withoutSingleLineComments) as T;
  } catch (error) {
    console.error(`Error parsing JSON file ${filePath}:`, error);
    throw error;
  }
}

export async function seedAddressCodes() {
  console.log('🏙️ Starting address code seeding...');

  // Clean existing data first (in reverse order of dependencies)
  await prisma.ward.deleteMany();
  await prisma.district.deleteMany();
  await prisma.city.deleteMany();

  try {
    // 1. Seed Cities
    const cityFilePath = path.join(process.cwd(), 'src', 'data', 'city.json');
    const cityData =
      readJSONWithComments<Record<string, CityData>>(cityFilePath);

    console.log(`Found ${Object.keys(cityData).length} cities to seed`);

    for (const [code, data] of Object.entries(cityData)) {
      await prisma.city.create({
        data: {
          cityCode: parseInt(code),
          name: data.name_with_type,
        },
      });
    }
    console.log('✅ Seeded Cities');

    // 2. Seed Districts
    const districtFilePath = path.join(
      process.cwd(),
      'src',
      'data',
      'district.json',
    );
    const districtData =
      readJSONWithComments<Record<string, DistrictData>>(districtFilePath);

    console.log(`Found ${Object.keys(districtData).length} districts to seed`);

    for (const [code, data] of Object.entries(districtData)) {
      await prisma.district.create({
        data: {
          districtCode: parseInt(code),
          name: `District ${code}`, // You might want to add actual names if available
          cityCode: parseInt(data.parent_code),
        },
      });
    }
    console.log('✅ Seeded Districts');

    // 3. Seed Wards
    const wardFilePath = path.join(process.cwd(), 'src', 'data', 'ward.json');
    const wardData =
      readJSONWithComments<Record<string, WardData>>(wardFilePath);

    console.log(`Found ${Object.keys(wardData).length} wards to seed`);

    for (const [code, data] of Object.entries(wardData)) {
      const name = data.name_with_type || `Ward ${code}`;

      await prisma.ward.create({
        data: {
          wardCode: parseInt(code),
          name: name,
          districtCode: parseInt(data.parent_code),
        },
      });
    }
    console.log('✅ Seeded Wards');

    console.log('🎉 Address code seeding completed!');
  } catch (error) {
    console.error('Error seeding address codes:', error);
    throw error;
  }
}
