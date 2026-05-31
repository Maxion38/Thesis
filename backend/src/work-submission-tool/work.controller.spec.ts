import { Test, TestingModule } from '@nestjs/testing';
import { WorkSubmissionToolController } from './work.controller';
import { WorkSubmissionToolService } from './work.service';

describe('WorkSubmissionToolController', () => {
  let controller: WorkSubmissionToolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkSubmissionToolController],
      providers: [WorkSubmissionToolService],
    }).compile();

    controller = module.get<WorkSubmissionToolController>(WorkSubmissionToolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
