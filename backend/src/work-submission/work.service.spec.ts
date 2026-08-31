import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkService } from './work.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { mockPrismaService } from '../../prisma/prisma.service.mock';
import * as fs from 'fs';
import * as path from 'path';

// ─── Mock fs et path (filesystem) ────────────────────────────────────────────

jest.mock('fs', () => ({
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
  createReadStream: jest.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockWork = {
  id: 1,
  toolId: 10,
  maxAttempts: 3,
  dueDate: null,
  tool: { id: 10, name: 'Rapport final', moduleId: 5, type: 'WORK' },
};

const mockUser = {
  id: 1,
  email: 'alice@test.com',
  firstname: 'Alice',
  surname: 'Dupont',
};

const mockProject = { id: 42, title: 'Mon TFE' };

const mockSubmission = {
  id: 1,
  fileName: 'Alice_Dupont_Rapport_final_attempt1.pdf',
  filePath:
    './storage/work-submissions/Alice_Dupont/Alice_Dupont_Rapport_final_attempt1.pdf',
  workId: 1,
  userId: 1,
  projectId: 42,
  submittedAt: new Date('2024-01-01'),
};

const mockUsersService = {
  findFirstProject: jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('WorkService', () => {
  let service: WorkService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<WorkService>(WorkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── getWork ──────────────────────────────────────────────────────────────────

  describe('getWork', () => {
    it('should return work with tool included', async () => {
      mockPrismaService.work.findUnique.mockResolvedValue(mockWork);

      const result = await service.getWork(1);

      expect(mockPrismaService.work.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { tool: true },
      });
      expect(result).toEqual(mockWork);
    });

    it('should throw NotFoundException when work does not exist', async () => {
      mockPrismaService.work.findUnique.mockResolvedValue(null);

      await expect(service.getWork(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── createWork ───────────────────────────────────────────────────────────────

  describe('createWork', () => {
    const dto = {
      name: 'Rapport final',
      description: 'Dépôt du rapport',
      moduleId: 5,
      maxAttempts: 3,
      dueDate: '2024-06-01',
    };

    it('should throw NotFoundException when module does not exist', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue(null);

      await expect(service.createWork(dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create tool and work in a transaction', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue({ id: 5 });

      const mockTool = { id: 10, name: dto.name, type: 'WORK', moduleId: 5 };
      const mockCreatedWork = {
        id: 1,
        maxAttempts: 3,
        toolId: 10,
        dueDate: new Date(dto.dueDate),
      };

      // Mock de $transaction — on exécute directement le callback
      mockPrismaService.$transaction.mockImplementation((cb: any) =>
        cb({
          tool: { create: jest.fn().mockResolvedValue(mockTool) },
          work: { create: jest.fn().mockResolvedValue(mockCreatedWork) },
        }),
      );

      const result = await service.createWork(dto);

      expect(result).toEqual({ tool: mockTool, work: mockCreatedWork });
    });

    it('should create work without dueDate when not provided', async () => {
      mockPrismaService.module.findUnique.mockResolvedValue({ id: 5 });

      const dtoWithoutDate = { ...dto, dueDate: undefined };
      const mockTool = { id: 10, name: dto.name, type: 'WORK', moduleId: 5 };
      const mockCreatedWork = {
        id: 1,
        maxAttempts: 3,
        toolId: 10,
        dueDate: null,
      };

      const txTool = { create: jest.fn().mockResolvedValue(mockTool) };
      const txWork = { create: jest.fn().mockResolvedValue(mockCreatedWork) };

      mockPrismaService.$transaction.mockImplementation((cb: any) =>
        cb({ tool: txTool, work: txWork }),
      );

      await service.createWork(dtoWithoutDate);

      // Vérifie que dueDate n'est pas dans le payload work quand absent
      const callArg = txWork.create.mock.calls[0][0];
      expect(callArg.data).toMatchObject({ maxAttempts: 3, id: 10 });
      expect(callArg.data).not.toHaveProperty('dueDate');
    });
  });

  // ── updateWork ───────────────────────────────────────────────────────────────

  describe('updateWork', () => {
    it('should throw NotFoundException when work does not exist', async () => {
      mockPrismaService.work.findUnique.mockResolvedValue(null);

      await expect(service.updateWork(999, {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when new moduleId does not exist', async () => {
      mockPrismaService.work.findUnique.mockResolvedValue(mockWork);
      mockPrismaService.module.findUnique.mockResolvedValue(null);

      await expect(
        service.updateWork(1, { moduleId: 99 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update tool and work in a transaction', async () => {
      mockPrismaService.work.findUnique.mockResolvedValue(mockWork);

      const updatedTool = { ...mockWork.tool, name: 'Nouveau nom' };
      const updatedWork = { ...mockWork, maxAttempts: 5 };

      mockPrismaService.$transaction.mockImplementation((cb: any) =>
        cb({
          tool: { update: jest.fn().mockResolvedValue(updatedTool) },
          work: { update: jest.fn().mockResolvedValue(updatedWork) },
        }),
      );

      const result = await service.updateWork(1, {
        name: 'Nouveau nom',
        maxAttempts: 5,
      });

      expect(result).toEqual({ tool: updatedTool, work: updatedWork });
    });
  });

  // ── submitWork ───────────────────────────────────────────────────────────────

  describe('submitWork', () => {
    const mockFile = {
      originalname: 'rapport.pdf',
      buffer: Buffer.from('content'),
    };
    const mockReqUser = {
      userId: 1,
      email: 'alice@test.com',
      roles: ['STUDENT'],
    };

    it('should throw NotFoundException when work does not exist', async () => {
      mockPrismaService.work.findUnique.mockResolvedValue(null);

      await expect(
        service.submitWork(999, mockFile, mockReqUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.work.findUnique.mockResolvedValue(mockWork);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.submitWork(1, mockFile, mockReqUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user has no project', async () => {
      mockPrismaService.work.findUnique.mockResolvedValue(mockWork);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockUsersService.findFirstProject.mockResolvedValue(null);

      await expect(
        service.submitWork(1, mockFile, mockReqUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should save file and create submission record', async () => {
      mockPrismaService.work.findUnique.mockResolvedValue(mockWork);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockUsersService.findFirstProject.mockResolvedValue(mockProject);
      mockPrismaService.userWorkSubmission.count.mockResolvedValue(0);
      mockPrismaService.userWorkSubmission.create.mockResolvedValue(
        mockSubmission,
      );

      const result = await service.submitWork(1, mockFile, mockReqUser);

      // Vérifie que le fichier est bien écrit sur disque
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();

      // Vérifie que la soumission est enregistrée en DB
      expect(mockPrismaService.userWorkSubmission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workId: 1,
            userId: 1,
            projectId: 42,
          }),
        }),
      );
      expect(result).toEqual(mockSubmission);
    });

    it('should increment attempt number based on existing submissions', async () => {
      mockPrismaService.work.findUnique.mockResolvedValue(mockWork);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockUsersService.findFirstProject.mockResolvedValue(mockProject);
      mockPrismaService.userWorkSubmission.count.mockResolvedValue(2); // déjà 2 soumissions
      mockPrismaService.userWorkSubmission.create.mockResolvedValue(
        mockSubmission,
      );

      await service.submitWork(1, mockFile, mockReqUser);

      const createCall =
        mockPrismaService.userWorkSubmission.create.mock.calls[0][0];
      expect(createCall.data.fileName).toContain('attempt3'); // 2 existantes + 1
    });
  });

  // ── removeSubmission ─────────────────────────────────────────────────────────

  describe('removeSubmission', () => {
    it('should throw NotFoundException when submission does not exist', async () => {
      mockPrismaService.userWorkSubmission.findUnique.mockResolvedValue(null);

      await expect(service.removeSubmission(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user does not own the submission', async () => {
      mockPrismaService.userWorkSubmission.findUnique.mockResolvedValue({
        ...mockSubmission,
        userId: 99, // appartient à un autre user
      });

      await expect(service.removeSubmission(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should delete submission from DB and file from disk', async () => {
      mockPrismaService.userWorkSubmission.findUnique.mockResolvedValue(
        mockSubmission,
      );
      mockPrismaService.userWorkSubmission.delete.mockResolvedValue(
        mockSubmission,
      );
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.removeSubmission(1, 1);

      expect(mockPrismaService.userWorkSubmission.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should not call unlinkSync when file does not exist on disk', async () => {
      mockPrismaService.userWorkSubmission.findUnique.mockResolvedValue(
        mockSubmission,
      );
      mockPrismaService.userWorkSubmission.delete.mockResolvedValue(
        mockSubmission,
      );
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await service.removeSubmission(1, 1);

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  // ── getLatestSubmission ──────────────────────────────────────────────────────

  describe('getLatestSubmission', () => {
    it('should return the most recent submission', async () => {
      mockPrismaService.userWorkSubmission.findFirst.mockResolvedValue(
        mockSubmission,
      );

      const result = await service.getLatestSubmission(1, 1);

      expect(
        mockPrismaService.userWorkSubmission.findFirst,
      ).toHaveBeenCalledWith({
        where: { workId: 1, userId: 1 },
        orderBy: { submittedAt: 'desc' },
      });
      expect(result).toEqual(mockSubmission);
    });

    it('should return null when no submission exists', async () => {
      mockPrismaService.userWorkSubmission.findFirst.mockResolvedValue(null);

      const result = await service.getLatestSubmission(1, 1);

      expect(result).toBeNull();
    });
  });

  // ── getSubmissionFile ────────────────────────────────────────────────────────

  describe('getSubmissionFile', () => {
    const owner = { userId: 1, roles: ['STUDENT'] };
    const otherStudent = { userId: 99, roles: ['STUDENT'] };
    const teacher = { userId: 42, roles: ['TEACHER'] };
    const coordinator = { userId: 43, roles: ['COORDINATOR'] };

    it('should throw NotFoundException when submission does not exist', async () => {
      mockPrismaService.userWorkSubmission.findUnique.mockResolvedValue(null);

      const mockRes = { setHeader: jest.fn() } as any;
      await expect(
        service.getSubmissionFile(999, owner, mockRes),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when a different student requests the file', async () => {
      mockPrismaService.userWorkSubmission.findUnique.mockResolvedValue(
        mockSubmission,
      );

      const mockRes = { setHeader: jest.fn() } as any;
      await expect(
        service.getSubmissionFile(1, otherStudent, mockRes),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when file does not exist on disk', async () => {
      mockPrismaService.userWorkSubmission.findUnique.mockResolvedValue(
        mockSubmission,
      );
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockRes = { setHeader: jest.fn() } as any;
      await expect(
        service.getSubmissionFile(1, owner, mockRes),
      ).rejects.toThrow(NotFoundException);
    });

    it('should set headers and pipe file to response for the owning student', async () => {
      mockPrismaService.userWorkSubmission.findUnique.mockResolvedValue(
        mockSubmission,
      );
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const mockStream = { pipe: jest.fn() };
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const mockRes = { setHeader: jest.fn() } as any;
      await service.getSubmissionFile(1, owner, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining(mockSubmission.fileName),
      );
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
    });

    it('should allow a teacher to access a submission they do not own', async () => {
      mockPrismaService.userWorkSubmission.findUnique.mockResolvedValue(
        mockSubmission,
      );
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const mockStream = { pipe: jest.fn() };
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const mockRes = { setHeader: jest.fn() } as any;
      await expect(
        service.getSubmissionFile(1, teacher, mockRes),
      ).resolves.toBeUndefined();
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
    });

    it('should allow a coordinator to access a submission they do not own', async () => {
      mockPrismaService.userWorkSubmission.findUnique.mockResolvedValue(
        mockSubmission,
      );
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const mockStream = { pipe: jest.fn() };
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const mockRes = { setHeader: jest.fn() } as any;
      await expect(
        service.getSubmissionFile(1, coordinator, mockRes),
      ).resolves.toBeUndefined();
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
    });
  });

  // ── getUserSubmissions ───────────────────────────────────────────────────────

  describe('getUserSubmissions', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserSubmissions(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return all submissions with work and tool included', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.userWorkSubmission.findMany.mockResolvedValue([
        mockSubmission,
      ]);

      const result = await service.getUserSubmissions(1);

      expect(
        mockPrismaService.userWorkSubmission.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
          orderBy: { submittedAt: 'desc' },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });
});
