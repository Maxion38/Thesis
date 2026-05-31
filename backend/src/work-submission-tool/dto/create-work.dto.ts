import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateWorkDto {
  // Tool fields
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsInt()
  @IsNotEmpty()
  moduleId!: number;

  // Work fields
  @IsInt()
  @Min(1)
  maxAttempts!: number;
}