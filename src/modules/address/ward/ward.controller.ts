import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { WardService } from './ward.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Ward } from './ward.model';
import { ApiResponse as CustomApiResponse } from 'src/common/response.types';

@ApiTags('wards')
@Controller('wards')
export class WardController {
  constructor(private readonly wardService: WardService) {}

  @Get()
  @ApiOperation({ summary: 'Get all wards' })
  @ApiResponse({
    status: 200,
    description: 'Returns all wards',
  })
  async findAll(): Promise<CustomApiResponse<Ward[]>> {
    const wards = await this.wardService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Successfully fetched all wards',
      data: wards,
    };
  }

  @Get('district/:districtCode')
  @ApiOperation({ summary: 'Get wards by district code' })
  @ApiParam({
    name: 'districtCode',
    description: 'District code',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns wards in the specified district',
  })
  async findByDistrictCode(
    @Param('districtCode', ParseIntPipe) districtCode: number,
  ): Promise<CustomApiResponse<Ward[]>> {
    const wards = await this.wardService.findByDistrictCode(districtCode);
    return {
      statusCode: HttpStatus.OK,
      message: 'Successfully fetched wards by district code',
      data: wards,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ward by its code' })
  @ApiParam({ name: 'id', description: 'Ward code', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Returns the ward with the specified code',
  })
  @ApiResponse({ status: 404, description: 'Ward not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CustomApiResponse<Ward>> {
    const ward = await this.wardService.findOne(id);
    if (!ward) {
      throw new NotFoundException(`Ward with code ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'Successfully fetched ward',
      data: ward,
    };
  }
}
