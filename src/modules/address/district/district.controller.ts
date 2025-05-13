import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { DistrictService } from './district.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { District } from './district.model';

@ApiTags('districts')
@Controller('districts')
export class DistrictController {
  constructor(private readonly districtService: DistrictService) {}

  @Get()
  @ApiOperation({ summary: 'Get all districts' })
  @ApiResponse({
    status: 200,
    description: 'Returns all districts',
  })
  async findAll(): Promise<District[]> {
    return this.districtService.findAll();
  }

  @Get('city/:cityCode')
  @ApiOperation({ summary: 'Get districts by city code' })
  @ApiParam({ name: 'cityCode', description: 'City code', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Returns districts in the specified city',
  })
  async findByCityCode(
    @Param('cityCode', ParseIntPipe) cityCode: number,
  ): Promise<District[]> {
    return this.districtService.findByCityCode(cityCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a district by its code' })
  @ApiParam({ name: 'id', description: 'District code', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Returns the district with the specified code',
  })
  @ApiResponse({ status: 404, description: 'District not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<District> {
    const district = await this.districtService.findOne(id);
    if (!district) {
      throw new NotFoundException(`District with code ${id} not found`);
    }
    return district;
  }
}
