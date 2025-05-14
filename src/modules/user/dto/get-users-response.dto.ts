import { ApiProperty } from '@nestjs/swagger';

export class GetUsersResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ nullable: true })
  name: string | null;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty({ nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ nullable: true })
  gender: string | null;

  @ApiProperty({ nullable: true })
  dayOfBirth: number | null;

  @ApiProperty({ nullable: true })
  monthOfBirth: number | null;

  @ApiProperty({ nullable: true })
  yearOfBirth: number | null;
}
