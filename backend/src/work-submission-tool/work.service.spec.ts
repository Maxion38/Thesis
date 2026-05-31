import { Test, TestingModule } from '@nestjs/testing';
import { WorkSubmissionToolService } from './work.service';

describe('WorkSubmissionToolService', () => {
  let service: WorkSubmissionToolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkSubmissionToolService],
    }).compile();

    service = module.get<WorkSubmissionToolService>(WorkSubmissionToolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
