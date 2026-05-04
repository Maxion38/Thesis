import { Test, TestingModule } from '@nestjs/testing';
import { TrainingCoursesService } from './training-courses.service';

describe('TrainingCoursesService', () => {
  let service: TrainingCoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainingCoursesService],
    }).compile();

    service = module.get<TrainingCoursesService>(TrainingCoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
