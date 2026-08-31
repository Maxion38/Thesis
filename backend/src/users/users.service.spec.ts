import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../../prisma/prisma.service.mock';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockUserWithRoles = {
  id: 1,
  email: 'alice@test.com',
  surname: 'Dupont',
  firstname: 'Alice',
  roles: [{ role: { role: 'STUDENT' } }, { role: { role: 'COORDINATOR' } }],
};

const mockProject = {
  id: 42,
  title: 'Mon TFE',
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return mapped UserDto array', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUserWithRoles]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        email: 'alice@test.com',
        surname: 'Dupont',
        firstname: 'Alice',
        roles: ['STUDENT', 'COORDINATOR'],
      });
    });

    it('should return empty array when no users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should return empty roles array when user has no roles', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { ...mockUserWithRoles, roles: undefined },
      ]);

      const result = await service.findAll();

      expect(result[0].roles).toEqual([]);
    });

    it('should filter by trainingCourseId when provided', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockUserWithRoles]);

      await service.findAll(7);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          projectMemberships: { some: { project: { trainingCourseId: 7 } } },
        },
        include: expect.anything(),
      });
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a string with the user id', () => {
      // Comportement actuel — à remplacer quand findOne sera implémenté
      const result = service.findOne(1);

      expect(result).toBe('This action returns a #1 user');
    });
  });

  // ── findFirstProject ────────────────────────────────────────────────────────

  describe('findFirstProject', () => {
    it('should return the first project of the user', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);

      const result = await service.findFirstProject(1);

      expect(mockPrismaService.project.findFirst).toHaveBeenCalledWith({
        where: {
          members: { some: { userId: 1 } },
        },
        select: { id: true, title: true },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual({ id: 42, title: 'Mon TFE' });
    });

    it('should return null when user has no project', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      const result = await service.findFirstProject(999);

      expect(result).toBeNull();
    });

    it('should filter by trainingCourseId when provided', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);

      await service.findFirstProject(1, 7);

      expect(mockPrismaService.project.findFirst).toHaveBeenCalledWith({
        where: {
          members: { some: { userId: 1 } },
          trainingCourseId: 7,
        },
        select: { id: true, title: true },
        orderBy: { createdAt: 'asc' },
      });
    });
  });
});
