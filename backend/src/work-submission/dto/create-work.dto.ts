import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

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
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsInt()
  @Min(1)
  maxAttempts!: number;
}