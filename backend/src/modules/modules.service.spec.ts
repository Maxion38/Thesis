// src/modules/modules.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../../prisma/prisma.service.mock'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockModule = {
  id: 1,
  name: 'Module Test',
  description: 'Description test',
  trainingCourseId: 10,
  createdAt: new Date('2024-01-01'),
  tools: [],
};

const mockProject = { trainingCourseId: 10 };

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('ModulesService', () => {
  let service: ModulesService;

  beforeEach(async () => {
    // Reset tous les mocks entre chaque test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModulesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ModulesService>(ModulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── CRUD de base ────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a module and return it', async () => {
      const dto = { name: 'Nouveau module', trainingCourseId: 10 };
      mockPrismaService.module.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto as any);

      expect(mockPrismaService.module.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toMatchObject({ name: 'Nouveau module' });
    });
  });

  describe('findAll', () => {
    it('should return all modules', async () => {
      mockPrismaService.module.findMany.mockResolvedValue([mockModule]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a module by id', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue(mockModule);

      const result = await service.findOne(1);

      expect(mockPrismaService.module.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockModule);
    });
  });

  describe('update', () => {
    it('should update and return the module', async () => {
      const updated = { ...mockModule, name: 'Modifié' };
      mockPrismaService.module.update.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'Modifié' } as any);

      expect(mockPrismaService.module.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Modifié' },
      });
      expect(result.name).toBe('Modifié');
    });
  });

  describe('remove', () => {
    it('should delete and return the module', async () => {
      mockPrismaService.module.delete.mockResolvedValue(mockModule);

      const result = await service.remove(1);

      expect(result).toEqual(mockModule);
    });

    it('should throw NotFoundException when module does not exist', async () => {
      mockPrismaService.module.delete.mockRejectedValue(new Error('Not found'));

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── findUserModulesOverview ──────────────────────────────────────────────────

  describe('findUserModulesOverview', () => {
    it('should throw NotFoundException when project does not exist', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.findUserModulesOverview(1, 999))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when training course has no dates', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        trainingCourseId: 10,
        trainingCourse: {
          startDate: null,
          endDate: null,
        },
      });

      await expect(service.findUserModulesOverview(1, 1))
        .rejects
        .toThrow('Training course is not available');
    });

    it('should throw ForbiddenException when course is not yet started', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        trainingCourseId: 10,
        trainingCourse: {
          startDate: new Date(Date.now() + 100000), // futur
          endDate: new Date(Date.now() + 200000),
        },
      });

      await expect(service.findUserModulesOverview(1, 1))
        .rejects
        .toThrow('Training course is not active');
    });

    it('should throw ForbiddenException when course is expired', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        trainingCourseId: 10,
        trainingCourse: {
          startDate: new Date(Date.now() - 200000),
          endDate: new Date(Date.now() - 100000), // passé
        },
      });

      await expect(service.findUserModulesOverview(1, 1))
        .rejects
        .toThrow('Training course is not active');
    });

    it('should return modules when course is active', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        trainingCourseId: 10,
        trainingCourse: {
          startDate: new Date(Date.now() - 100000),
          endDate: new Date(Date.now() + 100000),
        },
      });

      mockPrismaService.module.findMany.mockResolvedValue([
        mockModule,
      ]);

      const result = await service.findUserModulesOverview(1, 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'Module Test',
        status: { locked: false },
        groups: [],
      });
    });
  });

  // ── findModuleDetails ────────────────────────────────────────────────────────

  describe('findModuleDetails', () => {
    it('should throw NotFoundException when module does not exist', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue(null);

      await expect(service.findModuleDetails(999, 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should return a mapped ModuleDetailsDto', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue(mockModule);

      const result = await service.findModuleDetails(1, 1, 1);

      expect(result).toMatchObject({
        id: 1,
        name: 'Module Test',
        description: 'Description test',
        groups: [],
      });
    });
  });
});