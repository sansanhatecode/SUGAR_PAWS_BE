import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
  ForbiddenException,
  Req,
  Patch,
} from '@nestjs/common';
import { ShippingAddressService } from './shipping-address.service';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ShippingAddress } from '@prisma/client';
import { RequestWithUser } from './interfaces/request-with-user.interface';
import { ApiResponse as ApiResponseType } from '../../../common/response.types';

@ApiTags('shipping-addresses')
@Controller('shipping-addresses')
export class ShippingAddressController {
  constructor(
    private readonly shippingAddressService: ShippingAddressService,
  ) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all shipping addresses for a user' })
  @ApiParam({ name: 'userId', description: 'User ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Returns all shipping addresses for the specified user',
  })
  async findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ApiResponseType<ShippingAddress[]>> {
    return this.shippingAddressService.findByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-addresses')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all shipping addresses for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all shipping addresses for the authenticated user',
  })
  async findMyAddresses(
    @Req() req: RequestWithUser,
  ): Promise<ApiResponseType<ShippingAddress[]>> {
    const userId = req.user.userId;
    return this.shippingAddressService.findByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new shipping address for the authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'The shipping address has been successfully created',
  })
  async create(
    @Req() req: RequestWithUser,
    @Body() createShippingAddressDto: CreateShippingAddressDto,
  ): Promise<ApiResponseType<ShippingAddress>> {
    const userId = req.user.userId;
    return this.shippingAddressService.create(userId, createShippingAddressDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a shipping address by ID' })
  @ApiParam({ name: 'id', description: 'Shipping address ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Returns the shipping address with the specified ID',
  })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseType<ShippingAddress | null>> {
    const response = await this.shippingAddressService.findOne(id);
    if (!response.data) {
      throw new NotFoundException(`Shipping address with ID ${id} not found`);
    }
    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a shipping address' })
  @ApiParam({ name: 'id', description: 'Shipping address ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'The shipping address has been successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateShippingAddressDto: UpdateShippingAddressDto,
  ): Promise<ApiResponseType<ShippingAddress>> {
    const userId = req.user.userId;
    const response = await this.shippingAddressService.findOne(id);
    if (!response.data) {
      throw new NotFoundException(`Shipping address with ID ${id} not found`);
    }
    if (response.data.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this shipping address',
      );
    }
    return this.shippingAddressService.update(
      id,
      userId,
      updateShippingAddressDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a shipping address' })
  @ApiParam({ name: 'id', description: 'Shipping address ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'The shipping address has been successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseType<ShippingAddress>> {
    const userId = req.user.userId;
    const response = await this.shippingAddressService.findOne(id);
    if (!response.data) {
      throw new NotFoundException(`Shipping address with ID ${id} not found`);
    }
    if (response.data.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this shipping address',
      );
    }
    return this.shippingAddressService.remove(id, userId);
  }
}
