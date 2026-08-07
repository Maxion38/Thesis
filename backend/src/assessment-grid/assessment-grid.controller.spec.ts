import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentGridController } from './assessment-grid.controller';
import { AssessmentGridService } from './assessment-grid.service';

describe('AssessmentGridController', () => {
  let controller: AssessmentGridController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentGridController],
      providers: [AssessmentGridService],
    }).compile();

    controller = module.get<AssessmentGridController>(AssessmentGridController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
