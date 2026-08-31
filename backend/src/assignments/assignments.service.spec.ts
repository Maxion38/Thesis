import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { AssignmentsService } from './assignments.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../../prisma/prisma.service.mock';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockUserWithRoles = (id: number, role: RoleType) => ({
  id,
  email: `user${id}@test.com`,
  firstname: `Firstname${id}`,
  surname: `Surname${id}`,
  roles: [{ role: { role } }],
});

const mockCourseWithMembers = (members: any[]) => ({
  id: 1,
  name: 'Bachelier Info',
  projects: [
    {
      id: 10,
      trainingCourseId: 1,
      members: members.map((user) => ({ user })),
    },
  ],
});

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AssignmentsService', () => {
  let service: AssignmentsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── getAssignedUsers ─────────────────────────────────────────────────────────

  describe('getAssignedUsers', () => {
    it('should throw NotFoundException when course does not exist', async () => {
      mockPrismaService.trainingCourse.findUnique.mockResolvedValue(null);

      await expect(service.getAssignedUsers(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return mapped unique users across all projects', async () => {
      const student = mockUserWithRoles(1, RoleType.STUDENT);
      mockPrismaService.trainingCourse.findUnique.mockResolvedValue(
        mockCourseWithMembers([student]),
      );

      const result = await service.getAssignedUsers(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        email: 'user1@test.com',
        roles: [RoleType.STUDENT],
      });
    });

    it('should deduplicate users appearing in multiple projects', async () => {
      const student = mockUserWithRoles(1, RoleType.STUDENT);

      // Même user dans deux projets différents
      mockPrismaService.trainingCourse.findUnique.mockResolvedValue({
        id: 1,
        projects: [
          { id: 10, members: [{ user: student }] },
          { id: 11, members: [{ user: student }] },
        ],
      });

      const result = await service.getAssignedUsers(1);

      expect(result).toHaveLength(1);
    });

    it('should return empty array when course has no projects', async () => {
      mockPrismaService.trainingCourse.findUnique.mockResolvedValue({
        id: 1,
        projects: [],
      });

      const result = await service.getAssignedUsers(1);

      expect(result).toEqual([]);
    });
  });

  // ── getAssignableUsers ───────────────────────────────────────────────────────

  describe('getAssignableUsers', () => {
    it('should throw NotFoundException when course does not exist', async () => {
      mockPrismaService.trainingCourse.findUnique.mockResolvedValue(null);

      await expect(service.getAssignableUsers(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should exclude already assigned users', async () => {
      const assignedStudent = mockUserWithRoles(1, RoleType.STUDENT);
      const freeTeacher = mockUserWithRoles(2, RoleType.TEACHER);

      mockPrismaService.trainingCourse.findUnique.mockResolvedValue(
        mockCourseWithMembers([assignedStudent]),
      );
      mockPrismaService.user.findMany.mockResolvedValue([
        assignedStudent,
        freeTeacher,
      ]);

      const result = await service.getAssignableUsers(1);

      const ids = result.map((u) => u.id);
      expect(ids).not.toContain(1); // déjà assigné
      expect(ids).toContain(2); // libre
    });

    it('should exclude COORDINATOR role from assignable users', async () => {
      const coordinator = mockUserWithRoles(3, RoleType.COORDINATOR);

      mockPrismaService.trainingCourse.findUnique.mockResolvedValue(
        mockCourseWithMembers([]),
      );
      mockPrismaService.user.findMany.mockResolvedValue([coordinator]);

      const result = await service.getAssignableUsers(1);

      expect(result).toHaveLength(0);
    });

    it('should expand users with multiple roles into separate entries', async () => {
      // User avec STUDENT + TEACHER → 2 entrées dans le résultat
      const multiRoleUser = {
        ...mockUserWithRoles(4, RoleType.STUDENT),
        roles: [
          { role: { role: RoleType.STUDENT } },
          { role: { role: RoleType.TEACHER } },
        ],
      };

      mockPrismaService.trainingCourse.findUnique.mockResolvedValue(
        mockCourseWithMembers([]),
      );
      mockPrismaService.user.findMany.mockResolvedValue([multiRoleUser]);

      const result = await service.getAssignableUsers(1);

      expect(result).toHaveLength(2);
      expect(result[0].roles).toEqual([RoleType.STUDENT]);
      expect(result[1].roles).toEqual([RoleType.TEACHER]);
    });
  });

  // ── assignUsersToTrainingCourse ──────────────────────────────────────────────

  describe('assignUsersToTrainingCourse', () => {
    const setupTx = (overrides: Partial<Record<string, any>> = {}) => {
      const tx = {
        trainingCourse: { findUnique: jest.fn().mockResolvedValue({ id: 1 }) },
        user: {
          findMany: jest
            .fn()
            .mockResolvedValue([mockUserWithRoles(1, RoleType.STUDENT)]),
        },
        projectMember: { findMany: jest.fn().mockResolvedValue([]) },
        project: { create: jest.fn().mockResolvedValue({ id: 10 }) },
        ...overrides,
      };
      mockPrismaService.$transaction.mockImplementation((cb: any) => cb(tx));
      return tx;
    };

    it('should throw NotFoundException when course does not exist', async () => {
      mockPrismaService.$transaction.mockImplementation((cb: any) =>
        cb({
          trainingCourse: { findUnique: jest.fn().mockResolvedValue(null) },
        }),
      );

      await expect(
        service.assignUsersToTrainingCourse(999, [1]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when a user does not exist', async () => {
      mockPrismaService.$transaction.mockImplementation((cb: any) =>
        cb({
          trainingCourse: {
            findUnique: jest.fn().mockResolvedValue({ id: 1 }),
          },
          user: { findMany: jest.fn().mockResolvedValue([]) }, // 0 trouvés sur 1 demandé
        }),
      );

      await expect(
        service.assignUsersToTrainingCourse(1, [999]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a project per new user and return counts', async () => {
      const tx = setupTx();

      const result = await service.assignUsersToTrainingCourse(1, [1]);

      expect(tx.project.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ created: 1, skipped: 0 });
    });

    it('should skip already assigned users and report correct counts', async () => {
      setupTx({
        // User 1 déjà membre
        projectMember: {
          findMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
        },
        project: { create: jest.fn() },
      });

      const result = await service.assignUsersToTrainingCourse(1, [1]);

      expect(result).toEqual({ created: 0, skipped: 1 });
    });
  });

  // ── unassignUsersFromTrainingCourse ──────────────────────────────────────────

  describe('unassignUsersFromTrainingCourse', () => {
    it('should throw NotFoundException when course does not exist', async () => {
      mockPrismaService.$transaction.mockImplementation((cb: any) =>
        cb({
          trainingCourse: { findUnique: jest.fn().mockResolvedValue(null) },
        }),
      );

      await expect(
        service.unassignUsersFromTrainingCourse(999, [1]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return empty result when no matching memberships found', async () => {
      mockPrismaService.$transaction.mockImplementation((cb: any) =>
        cb({
          trainingCourse: {
            findUnique: jest.fn().mockResolvedValue({ id: 1 }),
          },
          projectMember: { findMany: jest.fn().mockResolvedValue([]) },
        }),
      );

      const result = await service.unassignUsersFromTrainingCourse(1, [99]);

      expect(result).toEqual({
        removedUserIds: [],
        message: 'No matching assignments found',
      });
    });

    it('should delete memberships and clean up empty projects', async () => {
      const tx = {
        trainingCourse: { findUnique: jest.fn().mockResolvedValue({ id: 1 }) },
        projectMember: {
          findMany: jest.fn().mockResolvedValue([{ userId: 1 }]),
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        project: {
          findMany: jest.fn().mockResolvedValue([
            { id: 10, _count: { members: 0 } }, // vide → doit être supprimé
            { id: 11, _count: { members: 2 } }, // pas vide → conservé
          ]),
          delete: jest.fn().mockResolvedValue({ id: 10 }),
        },
      };
      mockPrismaService.$transaction.mockImplementation((cb: any) => cb(tx));

      const result = await service.unassignUsersFromTrainingCourse(1, [1]);

      expect(tx.projectMember.deleteMany).toHaveBeenCalled();
      // Seul le projet vide (id: 10) doit être supprimé
      expect(tx.project.delete).toHaveBeenCalledTimes(1);
      expect(tx.project.delete).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(result).toEqual({ removedUserIds: [1] });
    });
  });
});
