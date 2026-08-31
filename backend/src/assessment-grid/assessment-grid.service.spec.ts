import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentGridService } from './assessment-grid.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

describe('AssessmentGridService', () => {
  let service: AssessmentGridService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentGridService,
        { provide: PrismaService, useValue: {} },
        { provide: UsersService, useValue: {} },
      ],
    }).compile();

    service = module.get<AssessmentGridService>(AssessmentGridService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
