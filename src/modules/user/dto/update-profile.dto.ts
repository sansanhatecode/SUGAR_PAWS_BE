import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsInt()
  dayOfBirth?: number;

  @IsOptional()
  @IsInt()
  monthOfBirth?: number;

  @IsOptional()
  @IsInt()
  yearOfBirth?: number;
}
