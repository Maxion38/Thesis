import { Test, TestingModule } from '@nestjs/testing';
import { TrainingCoursesController } from './training-courses.controller';
import { TrainingCoursesService } from './training-courses.service';

describe('TrainingCoursesController', () => {
  let controller: TrainingCoursesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingCoursesController],
      providers: [TrainingCoursesService],
    }).compile();

    controller = module.get<TrainingCoursesController>(TrainingCoursesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
