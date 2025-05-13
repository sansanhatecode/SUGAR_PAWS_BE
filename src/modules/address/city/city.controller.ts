import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { CityService } from './city.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { City } from './city.model';

@ApiTags('cities')
@Controller('cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cities' })
  @ApiResponse({
    status: 200,
    description: 'Returns all cities',
  })
  async findAll(): Promise<City[]> {
    return this.cityService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a city by its code' })
  @ApiParam({ name: 'id', description: 'City code', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Returns the city with the specified code',
  })
  @ApiResponse({ status: 404, description: 'City not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<City> {
    const city = await this.cityService.findOne(id);
    if (!city) {
      throw new NotFoundException(`City with code ${id} not found`);
    }
    return city;
  }
}
