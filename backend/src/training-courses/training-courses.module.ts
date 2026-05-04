import { Module } from '@nestjs/common';
import { TrainingCoursesService } from './training-courses.service';
import { TrainingCoursesController } from './training-courses.controller';
import { ModulesModule } from '../modules/modules.module';

@Module({
  imports: [ModulesModule],
  controllers: [TrainingCoursesController],
  providers: [TrainingCoursesService],
})
export class TrainingCoursesModule {}
