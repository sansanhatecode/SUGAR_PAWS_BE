import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { CityService } from './city.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { City } from './city.model';
import { ApiResponse as CustomApiResponse } from 'src/common/response.types';

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
  async findAll(): Promise<CustomApiResponse<City[]>> {
    const cities = await this.cityService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Successfully fetched all cities',
      data: cities,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a city by its code' })
  @ApiParam({ name: 'id', description: 'City code', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Returns the city with the specified code',
  })
  @ApiResponse({ status: 404, description: 'City not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CustomApiResponse<City>> {
    const city = await this.cityService.findOne(id);
    if (!city) {
      throw new NotFoundException(`City with code ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'Successfully fetched city',
      data: city,
    };
  }
}
