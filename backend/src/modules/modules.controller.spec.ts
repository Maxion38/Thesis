import { Test, TestingModule } from '@nestjs/testing';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { mockPrismaService } from '../../prisma/prisma.service.mock'

const mockModulesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findUserModulesOverview: jest.fn(),
  findModuleDetails: jest.fn(),
};

describe('ModulesController', () => {
  let controller: ModulesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModulesController],
      providers: [
        { provide: ModulesService, useValue: mockModulesService },
      ],
    }).compile();

    controller = module.get<ModulesController>(ModulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { name: 'Module' };

      mockModulesService.create.mockResolvedValue(dto);

      const result = await controller.create(dto as any);

      expect(mockModulesService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(dto);
    });
  });

  describe('findAll', () => {
    it('should return all modules', async () => {
      const data = [{ id: 1 }];
      mockModulesService.findAll.mockResolvedValue(data);

      const result = await controller.findAll();

      expect(mockModulesService.findAll).toHaveBeenCalled();
      expect(result).toEqual(data);
    });
  });

  describe('findOne', () => {
    it('should call findOne with parsed id', async () => {
      const data = { id: 1 };
      mockModulesService.findOne.mockResolvedValue(data);

      const result = await controller.findOne('1');

      expect(mockModulesService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(data);
    });
  });

  describe('findUserModulesOverview', () => {
    it('should call service with userId and projectId', async () => {
      const req = { user: { userId: 42 } };

      const data = [{ id: 1 }];
      mockModulesService.findUserModulesOverview.mockResolvedValue(data);

      const result = await controller.findUserModulesOverview(req, '10');

      expect(mockModulesService.findUserModulesOverview).toHaveBeenCalledWith(42, 10);
      expect(result).toEqual(data);
    });
  });

  describe('findModuleDetails', () => {
    it('should call service with moduleId, userId and projectId', async () => {
      const req = { user: { userId: 42 } };

      const data = { id: 1 };
      mockModulesService.findModuleDetails.mockResolvedValue(data);

      const result = await controller.findModuleDetails(req, '5', '10');

      expect(mockModulesService.findModuleDetails).toHaveBeenCalledWith(
        5,
        42,
        10,
      );

      expect(result).toEqual(data);
    });
  });

  describe('update', () => {
    it('should call update with id and dto', async () => {
      const dto = { name: 'Updated' };
      const data = { id: 1, ...dto };

      mockModulesService.update.mockResolvedValue(data);

      const result = await controller.update('1', dto as any);

      expect(mockModulesService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(data);
    });
  });

  describe('remove', () => {
    it('should call remove with id', async () => {
      const data = { id: 1 };

      mockModulesService.remove.mockResolvedValue(data);

      const result = await controller.remove('1');

      expect(mockModulesService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(data);
    });
  });
});
