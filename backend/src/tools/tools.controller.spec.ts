import { Test, TestingModule } from '@nestjs/testing';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockToolsService = {
  getToolsByModuleId: jest.fn(),
  updateTool: jest.fn(),
  deleteTool: jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('ToolsController', () => {
  let controller: ToolsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsController],
      providers: [{ provide: ToolsService, useValue: mockToolsService }],
    }).compile();

    controller = module.get<ToolsController>(ToolsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── getToolsByModuleId ───────────────────────────────────────────────────────

  describe('getToolsByModuleId', () => {
    it('should call service with moduleId and return result', async () => {
      mockToolsService.getToolsByModuleId.mockResolvedValue([{ id: 1 }]);

      const result = await controller.getToolsByModuleId(5);

      // ParseIntPipe est bypassé en unit test — le param arrive déjà typé number
      expect(mockToolsService.getToolsByModuleId).toHaveBeenCalledWith(5);
      expect(result).toHaveLength(1);
    });
  });

  // ── updateTool ───────────────────────────────────────────────────────────────

  describe('updateTool', () => {
    it('should call service.updateTool with toolId and dto', async () => {
      const dto = { name: 'Modifié' };
      mockToolsService.updateTool.mockResolvedValue({ id: 3, ...dto });

      const result = await controller.updateTool(3, dto);

      expect(mockToolsService.updateTool).toHaveBeenCalledWith(3, dto);
      expect(result).toMatchObject({ id: 3, name: 'Modifié' });
    });
  });

  // ── deleteTool ───────────────────────────────────────────────────────────────

  describe('deleteTool', () => {
    it('should call service.deleteTool with toolId', async () => {
      mockToolsService.deleteTool.mockResolvedValue({ id: 3 });

      const result = await controller.deleteTool(3);

      expect(mockToolsService.deleteTool).toHaveBeenCalledWith(3);
      expect(result).toEqual({ id: 3 });
    });
  });
});
