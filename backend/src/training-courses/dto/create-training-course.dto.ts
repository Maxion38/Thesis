import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateTrainingCourseDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;
}
