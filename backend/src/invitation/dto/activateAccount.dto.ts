import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';

export class ActivateAccountDto {
  @IsString()
  token!: string

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;

  @IsString()
  surname!: string;

  @IsOptional()
  @IsString()
  firstname?: string;
}