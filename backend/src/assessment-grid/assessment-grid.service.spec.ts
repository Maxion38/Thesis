import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentGridService } from './assessment-grid.service';

describe('AssessmentGridService', () => {
  let service: AssessmentGridService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssessmentGridService],
    }).compile();

    service = module.get<AssessmentGridService>(AssessmentGridService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
