import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateTrainingCourseDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}
