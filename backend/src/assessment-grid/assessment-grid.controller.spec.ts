import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentGridController } from './assessment-grid.controller';
import { AssessmentGridService } from './assessment-grid.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockAssessmentGridService = {
  getProjectsWithAssessmentsId: jest.fn(),
  getAssessmentGrid: jest.fn(),
  setCriteriaNote: jest.fn(),
  setCriteriaFeedback: jest.fn(),
  getCriteriaDiscussions: jest.fn(),
  createCriteriaDiscussion: jest.fn(),
  getGridEvaluations: jest.fn(),
  getGridContext: jest.fn(),
  publishGrid: jest.fn(),
  getStudentAssessmentView: jest.fn(),
};

const mockReq = (userId: number) => ({ user: { userId } }) as any;

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AssessmentGridController', () => {
  let controller: AssessmentGridController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentGridController],
      providers: [
        { provide: AssessmentGridService, useValue: mockAssessmentGridService },
      ],
    }).compile();

    controller = module.get<AssessmentGridController>(AssessmentGridController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProjectsWithAssessmentsId', () => {
    it('should pass the parsed trainingCourseId and no rapporteur filter by default', async () => {
      mockAssessmentGridService.getProjectsWithAssessmentsId.mockResolvedValue(
        [],
      );

      await controller.getProjectsWithAssessmentsId('5', undefined, mockReq(1));

      expect(
        mockAssessmentGridService.getProjectsWithAssessmentsId,
      ).toHaveBeenCalledWith(5, undefined);
    });

    it('should pass the requesting user id as rapporteur when rapporteur=true', async () => {
      mockAssessmentGridService.getProjectsWithAssessmentsId.mockResolvedValue(
        [],
      );

      await controller.getProjectsWithAssessmentsId(
        undefined,
        'true',
        mockReq(42),
      );

      expect(
        mockAssessmentGridService.getProjectsWithAssessmentsId,
      ).toHaveBeenCalledWith(undefined, 42);
    });
  });

  describe('getAssessmentGrid', () => {
    it('should call service.getAssessmentGrid with parsed gridId', async () => {
      mockAssessmentGridService.getAssessmentGrid.mockResolvedValue([]);

      await controller.getAssessmentGrid(5);

      expect(mockAssessmentGridService.getAssessmentGrid).toHaveBeenCalledWith(
        5,
      );
    });
  });

  describe('setCriteriaNote', () => {
    it('should call service.setCriteriaNote with criteriaId, requesting user id and dto', async () => {
      const dto = { projectId: 7, note: 8 } as any;
      mockAssessmentGridService.setCriteriaNote.mockResolvedValue({ note: 8 });

      await controller.setCriteriaNote(1, dto, mockReq(42));

      expect(mockAssessmentGridService.setCriteriaNote).toHaveBeenCalledWith(
        1,
        42,
        dto,
      );
    });
  });

  describe('setCriteriaFeedback', () => {
    it('should call service.setCriteriaFeedback with criteriaId, requesting user id and dto', async () => {
      const dto = { projectId: 7, commentFeedback: 'Bien' } as any;
      mockAssessmentGridService.setCriteriaFeedback.mockResolvedValue({
        note: null,
        commentFeedback: 'Bien',
      });

      await controller.setCriteriaFeedback(1, dto, mockReq(42));

      expect(
        mockAssessmentGridService.setCriteriaFeedback,
      ).toHaveBeenCalledWith(1, 42, dto);
    });
  });

  describe('getCriteriaDiscussions', () => {
    it('should call service.getCriteriaDiscussions with criteriaId and projectId', async () => {
      mockAssessmentGridService.getCriteriaDiscussions.mockResolvedValue([]);

      await controller.getCriteriaDiscussions(1, 7);

      expect(
        mockAssessmentGridService.getCriteriaDiscussions,
      ).toHaveBeenCalledWith(1, 7);
    });
  });

  describe('createCriteriaDiscussion', () => {
    it('should call service.createCriteriaDiscussion with criteriaId, requesting user id and dto', async () => {
      const dto = { projectId: 7, comment: 'x' } as any;
      mockAssessmentGridService.createCriteriaDiscussion.mockResolvedValue({});

      await controller.createCriteriaDiscussion(1, dto, mockReq(42));

      expect(
        mockAssessmentGridService.createCriteriaDiscussion,
      ).toHaveBeenCalledWith(1, 42, dto);
    });
  });

  describe('getGridEvaluations', () => {
    it('should call service.getGridEvaluations with gridId and projectId', async () => {
      mockAssessmentGridService.getGridEvaluations.mockResolvedValue([]);

      await controller.getGridEvaluations(5, 7);

      expect(mockAssessmentGridService.getGridEvaluations).toHaveBeenCalledWith(
        5,
        7,
      );
    });
  });

  describe('getGridContext', () => {
    it('should call service.getGridContext with gridId, projectId and requesting user id', async () => {
      mockAssessmentGridService.getGridContext.mockResolvedValue({});

      await controller.getGridContext(5, 7, mockReq(42));

      expect(mockAssessmentGridService.getGridContext).toHaveBeenCalledWith(
        5,
        7,
        42,
      );
    });
  });

  describe('publishGrid', () => {
    it('should call service.publishGrid and wrap the result in a status object', async () => {
      mockAssessmentGridService.publishGrid.mockResolvedValue('PUBLISHED');

      const result = await controller.publishGrid(
        5,
        { projectId: 7 },
        mockReq(42),
      );

      expect(mockAssessmentGridService.publishGrid).toHaveBeenCalledWith(
        5,
        7,
        42,
      );
      expect(result).toEqual({ status: 'PUBLISHED' });
    });
  });

  describe('getMyAssessmentView', () => {
    it('should call service.getStudentAssessmentView with gridId and requesting user id', async () => {
      mockAssessmentGridService.getStudentAssessmentView.mockResolvedValue({});

      await controller.getMyAssessmentView(5, mockReq(1));

      expect(
        mockAssessmentGridService.getStudentAssessmentView,
      ).toHaveBeenCalledWith(5, 1);
    });
  });
});
