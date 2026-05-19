import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class BootStrapRegisterDto {
  @IsEmail()
  email!: string;

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