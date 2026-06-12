import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TrainingCoursesService } from './training-courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../../prisma/prisma.service.mock';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockCourse = {
  id: 1,
  name: 'Bachelier Informatique',
  createdAt: new Date('2024-01-01'),
};

const mockCourseWithRelations = {
  ...mockCourse,
  projects: [
    {
      supervisorId: 10,
      members: [
        { userId: 100 },
        { userId: 101 },
      ],
    },
    {
      supervisorId: 11,
      members: [
        { userId: 101 }, // doublon voulu — doit être dédupliqué
        { userId: 102 },
      ],
    },
  ],
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('TrainingCoursesService', () => {
  let service: TrainingCoursesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingCoursesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TrainingCoursesService>(TrainingCoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create and return a training course', async () => {
      const dto = { name: 'Nouveau cursus' };
      mockPrismaService.trainingCourse.create.mockResolvedValue({ id: 2, ...dto });

      const result = await service.create(dto as any);

      expect(mockPrismaService.trainingCourse.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toMatchObject({ name: 'Nouveau cursus' });
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all training courses', async () => {
      mockPrismaService.trainingCourse.findMany.mockResolvedValue([mockCourse]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should return empty array when no courses exist', async () => {
      mockPrismaService.trainingCourse.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ── findAllWithRelatedInfos ──────────────────────────────────────────────────

  describe('findAllWithRelatedInfos', () => {
    it('should return courses with studentsCount and teachersCount', async () => {
      mockPrismaService.trainingCourse.findMany.mockResolvedValue([mockCourseWithRelations]);

      const result = await service.findAllWithRelatedInfos();

      expect(result[0]).toMatchObject({
        id: 1,
        studentsCount: 3, // userId 100, 101, 102 — le doublon 101 dédupliqué
        teachersCount: 2, // supervisorId 10 et 11
      });
    });

    it('should count 0 students and teachers when no projects', async () => {
      mockPrismaService.trainingCourse.findMany.mockResolvedValue([
        { ...mockCourse, projects: [] },
      ]);

      const result = await service.findAllWithRelatedInfos();

      expect(result[0].studentsCount).toBe(0);
      expect(result[0].teachersCount).toBe(0);
    });

    it('should not count null supervisorId as teacher', async () => {
      mockPrismaService.trainingCourse.findMany.mockResolvedValue([
        {
          ...mockCourse,
          projects: [{ supervisorId: null, members: [] }],
        },
      ]);

      const result = await service.findAllWithRelatedInfos();

      expect(result[0].teachersCount).toBe(0);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a course by id', async () => {
      mockPrismaService.trainingCourse.findUnique.mockResolvedValue(mockCourse);

      const result = await service.findOne(1);

      expect(mockPrismaService.trainingCourse.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockCourse);
    });

    it('should throw NotFoundException when course does not exist', async () => {
      mockPrismaService.trainingCourse.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('TrainingCourse 999 not found');
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update and return the course', async () => {
      const updated = { ...mockCourse, name: 'Cursus modifié' };
      mockPrismaService.trainingCourse.update.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'Cursus modifié' } as any);

      expect(mockPrismaService.trainingCourse.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Cursus modifié' },
      });
      expect(result.name).toBe('Cursus modifié');
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete and return the course', async () => {
      mockPrismaService.trainingCourse.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.trainingCourse.delete.mockResolvedValue(mockCourse);

      const result = await service.remove(1);

      expect(mockPrismaService.trainingCourse.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockCourse);
    });

    it('should throw NotFoundException when course does not exist', async () => {
      mockPrismaService.trainingCourse.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999)).rejects.toThrow('TrainingCourse 999 not found');
    });

    it('should not call delete when course does not exist', async () => {
      mockPrismaService.trainingCourse.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.trainingCourse.delete).not.toHaveBeenCalled();
    });
  });
});