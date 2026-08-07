import { Module } from '@nestjs/common';
import { AssessmentGridService } from './assessment-grid.service';
import { AssessmentGridController } from './assessment-grid.controller';

@Module({
  controllers: [AssessmentGridController],
  providers: [AssessmentGridService],
})
export class AssessmentGridModule {}
