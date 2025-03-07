import { IsNotEmpty } from 'class-validator';

export class SigninDto {
  @IsNotEmpty()
  identifier: string;

  @IsNotEmpty()
  password: string;
}
