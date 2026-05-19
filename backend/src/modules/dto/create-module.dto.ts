import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateModuleDto {
    @IsString()
    name!: string;

    @IsNumber()
    trainingCourseId!: number;

    @IsString()
    @IsOptional()
    description?: string;
}
