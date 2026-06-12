import { Test, TestingModule } from '@nestjs/testing';
import { ToolsService } from './tools.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../../prisma/prisma.service.mock';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockTool = {
  id: 1,
  name: 'Formulaire intro',
  description: 'Formulaire de présentation',
  type: 'FORM' as const,
  moduleId: 10,
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('ToolsService', () => {
  let service: ToolsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ToolsService>(ToolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── getToolsByModuleId ───────────────────────────────────────────────────────

  describe('getToolsByModuleId', () => {
    it('should return mapped ToolDto array for a module', async () => {
      mockPrismaService.tool.findMany.mockResolvedValue([mockTool]);

      const result = await service.getToolsByModuleId(10);

      expect(mockPrismaService.tool.findMany).toHaveBeenCalledWith({
        where: { moduleId: 10 },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual([
        {
          id: 1,
          name: 'Formulaire intro',
          description: 'Formulaire de présentation',
          type: 'FORM',
          moduleId: 10,
        },
      ]);
    });

    it('should return empty array when module has no tools', async () => {
      mockPrismaService.tool.findMany.mockResolvedValue([]);

      const result = await service.getToolsByModuleId(99);

      expect(result).toEqual([]);
    });

    it('should map all fields correctly including null description', async () => {
      mockPrismaService.tool.findMany.mockResolvedValue([
        { ...mockTool, description: null },
      ]);

      const result = await service.getToolsByModuleId(10);

      expect(result[0].description).toBeNull();
    });
  });

  // ── updateTool ───────────────────────────────────────────────────────────────

  describe('updateTool', () => {
    it('should update and return mapped ToolDto', async () => {
      const updated = { ...mockTool, name: 'Formulaire modifié' };
      mockPrismaService.tool.update.mockResolvedValue(updated);

      const result = await service.updateTool(1, { name: 'Formulaire modifié' } as any);

      expect(mockPrismaService.tool.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Formulaire modifié' },
      });
      expect(result).toMatchObject({
        id: 1,
        name: 'Formulaire modifié',
        type: 'FORM',
        moduleId: 10,
      });
    });

    it('should propagate Prisma error when tool does not exist', async () => {
      mockPrismaService.tool.update.mockRejectedValue(new Error('Record not found'));

      await expect(service.updateTool(999, {} as any)).rejects.toThrow('Record not found');
    });
  });

  // ── deleteTool ───────────────────────────────────────────────────────────────

  describe('deleteTool', () => {
    it('should call prisma.tool.delete with correct id', async () => {
      mockPrismaService.tool.delete.mockResolvedValue(mockTool);

      const result = await service.deleteTool(1);

      expect(mockPrismaService.tool.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockTool);
    });

    it('should propagate Prisma error when tool does not exist', async () => {
      mockPrismaService.tool.delete.mockRejectedValue(new Error('Record not found'));

      await expect(service.deleteTool(999)).rejects.toThrow('Record not found');
    });
  });
});