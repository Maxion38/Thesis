import { Test, TestingModule } from '@nestjs/testing';
import { TrainingCoursesController } from './training-courses.controller';
import { TrainingCoursesService } from './training-courses.service';
import { ModulesService } from '../modules/modules.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockTrainingCoursesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findAllWithRelatedInfos: jest.fn(),
  findMyActiveCourses: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockModulesService = {
  findAllForTrainingCourse: jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('TrainingCoursesController', () => {
  let controller: TrainingCoursesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingCoursesController],
      providers: [
        { provide: TrainingCoursesService, useValue: mockTrainingCoursesService },
        { provide: ModulesService, useValue: mockModulesService },
      ],
    }).compile();

    controller = module.get<TrainingCoursesController>(TrainingCoursesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with the dto', async () => {
      const dto = { name: 'Nouveau cursus' };
      mockTrainingCoursesService.create.mockResolvedValue({ id: 1, ...dto });

      const result = await controller.create(dto as any);

      expect(mockTrainingCoursesService.create).toHaveBeenCalledWith(dto);
      expect(result).toMatchObject({ id: 1 });
    });
  });

  describe('findAll', () => {
    it('should call service.findAll and return results', async () => {
      mockTrainingCoursesService.findAll.mockResolvedValue([{ id: 1 }]);

      const result = await controller.findAll();

      expect(mockTrainingCoursesService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('findAllWithDetails', () => {
    it('should call service.findAllWithRelatedInfos', async () => {
      mockTrainingCoursesService.findAllWithRelatedInfos.mockResolvedValue([]);

      await controller.findAllWithDetails();

      expect(mockTrainingCoursesService.findAllWithRelatedInfos).toHaveBeenCalled();
    });
  });

  describe('findMyActiveCourses', () => {
    it('should call service.findMyActiveCourses with the userId from request', async () => {
      mockTrainingCoursesService.findMyActiveCourses.mockResolvedValue([{ id: 1 }]);

      const result = await controller.findMyActiveCourses({ user: { userId: 1 } } as any);

      expect(mockTrainingCoursesService.findMyActiveCourses).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('findModules', () => {
    it('should call modulesService with the parsed trainingCourseId', async () => {
      mockModulesService.findAllForTrainingCourse.mockResolvedValue([]);

      await controller.findModules('5');

      // Vérifie que le string '5' est bien converti en number 5
      expect(mockModulesService.findAllForTrainingCourse).toHaveBeenCalledWith(5);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with parsed id', async () => {
      mockTrainingCoursesService.findOne.mockResolvedValue({ id: 1 });

      await controller.findOne('1');

      expect(mockTrainingCoursesService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should call service.update with parsed id and dto', async () => {
      const dto = { name: 'Modifié' };
      mockTrainingCoursesService.update.mockResolvedValue({ id: 1, ...dto });

      await controller.update('1', dto as any);

      expect(mockTrainingCoursesService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove with parsed id', async () => {
      mockTrainingCoursesService.remove.mockResolvedValue({ id: 1 });

      await controller.remove('1');

      expect(mockTrainingCoursesService.remove).toHaveBeenCalledWith(1);
    });
  });
});