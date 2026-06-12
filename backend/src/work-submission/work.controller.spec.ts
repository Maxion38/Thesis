import { Test, TestingModule } from '@nestjs/testing';
import { WorkController } from './work.controller';
import { WorkService } from './work.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockWorkService = {
  getWork: jest.fn(),
  createWork: jest.fn(),
  updateWork: jest.fn(),
  submitWork: jest.fn(),
  getLatestSubmission: jest.fn(),
  getSubmissionFile: jest.fn(),
  removeSubmission: jest.fn(),
  getUserSubmissions: jest.fn(),
};

const mockReqUser = { userId: 1, email: 'alice@test.com', roles: ['STUDENT'] };
const mockFile = { originalname: 'rapport.pdf', buffer: Buffer.from('x') };

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('WorkController', () => {
  let controller: WorkController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkController],
      providers: [
        { provide: WorkService, useValue: mockWorkService },
      ],
    }).compile();

    controller = module.get<WorkController>(WorkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWork', () => {
    it('should call service.getWork with id', async () => {
      mockWorkService.getWork.mockResolvedValue({ id: 1 });
      const result = await controller.getWork(1);
      expect(mockWorkService.getWork).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('createWork', () => {
    it('should call service.createWork with dto', async () => {
      const dto = { name: 'Rapport', moduleId: 5, maxAttempts: 3 };
      mockWorkService.createWork.mockResolvedValue({ tool: {}, work: {} });
      await controller.createWork(dto as any);
      expect(mockWorkService.createWork).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateWork', () => {
    it('should call service.updateWork with workId and dto', async () => {
      const dto = { name: 'Modifié' };
      mockWorkService.updateWork.mockResolvedValue({ tool: {}, work: {} });
      await controller.updateWork(1, dto as any);
      expect(mockWorkService.updateWork).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('submitWork', () => {
    it('should call service.submitWork with workId, file and user', async () => {
      mockWorkService.submitWork.mockResolvedValue({ id: 1 });
      await controller.submitWork(1, mockFile, { user: mockReqUser } as any);
      // FileInterceptor bypassé en unit test — file arrive directement
      expect(mockWorkService.submitWork).toHaveBeenCalledWith(1, mockFile, mockReqUser);
    });
  });

  describe('getLatestSubmission', () => {
    it('should call service with workId and userId from request', async () => {
      mockWorkService.getLatestSubmission.mockResolvedValue({ id: 1 });
      await controller.getLatestSubmission(1, { user: mockReqUser } as any);
      expect(mockWorkService.getLatestSubmission).toHaveBeenCalledWith(1, mockReqUser.userId);
    });
  });

  describe('getSubmissionFile', () => {
    it('should call service with submissionId and res', async () => {
      const mockRes = { setHeader: jest.fn() } as any;
      mockWorkService.getSubmissionFile.mockResolvedValue(undefined);
      await controller.getSubmissionFile(1, mockRes);
      expect(mockWorkService.getSubmissionFile).toHaveBeenCalledWith(1, mockRes);
    });
  });

  describe('removeSubmission', () => {
    it('should call service with submissionId and userId from request', async () => {
      mockWorkService.removeSubmission.mockResolvedValue(undefined);
      await controller.removeSubmission(1, { user: mockReqUser } as any);
      expect(mockWorkService.removeSubmission).toHaveBeenCalledWith(1, mockReqUser.userId);
    });
  });

  describe('getUserSubmissions', () => {
    it('should call service with userId', async () => {
      mockWorkService.getUserSubmissions.mockResolvedValue([]);
      await controller.getUserSubmissions(1);
      expect(mockWorkService.getUserSubmissions).toHaveBeenCalledWith(1);
    });
  });
});