import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminSignInDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
