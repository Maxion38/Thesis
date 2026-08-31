import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentGridController } from './assessment-grid.controller';
import { AssessmentGridService } from './assessment-grid.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

describe('AssessmentGridController', () => {
  let controller: AssessmentGridController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentGridController],
      providers: [
        AssessmentGridService,
        { provide: PrismaService, useValue: {} },
        { provide: UsersService, useValue: {} },
      ],
    }).compile();

    controller = module.get<AssessmentGridController>(AssessmentGridController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
