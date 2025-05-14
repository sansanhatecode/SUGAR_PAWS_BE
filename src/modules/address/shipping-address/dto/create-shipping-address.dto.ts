import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShippingAddressDto {
  @ApiProperty({
    description: 'Full name of the recipient',
    example: 'Nguyen Van A',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    description: 'Phone number of the recipient',
    example: '0123456789',
  })
  @IsNotEmpty()
  @IsString()
  @Length(10, 15)
  phoneNumber: string;

  @ApiProperty({
    description: 'Home number and street name',
    example: '123 Nguyen Hue',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  homeNumber: string;

  @ApiProperty({
    description: 'Ward code',
    example: 456,
  })
  @IsNotEmpty()
  @IsNumber()
  wardCode: number;

  @ApiProperty({
    description: 'Additional address details',
    example: 'Near the market',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  moreDetail?: string;

  @ApiProperty({
    description: 'Whether this is the default shipping address',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}
