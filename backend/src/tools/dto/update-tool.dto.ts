import { IsOptional, IsString } from 'class-validator';

export class UpdateToolDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
