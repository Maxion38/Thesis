import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GridFeedbackStatus, ToolType } from '@prisma/client';
import { AssessmentGridService } from './assessment-grid.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { mockPrismaService } from '../../prisma/prisma.service.mock';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockUsersService = {
  findFirstProject: jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AssessmentGridService', () => {
  let service: AssessmentGridService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentGridService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AssessmentGridService>(AssessmentGridService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── getProjectsWithAssessmentsId ─────────────────────────────────────────────

  describe('getProjectsWithAssessmentsId', () => {
    const mockProject = {
      id: 1,
      title: 'Mon TFE',
      members: [{ user: { id: 100, firstname: 'Alice', surname: 'Dupont' } }],
      trainingCourse: {
        modules: [
          {
            tools: [
              { id: 10, name: 'Rapport final', type: ToolType.WORK },
              { id: 11, name: 'Grille finale', type: ToolType.ASSESSMENT },
              { id: 12, name: 'Suivi', type: ToolType.WORK },
            ],
          },
        ],
      },
      workSubmissions: [{ workId: 10 }, { workId: 10 }], // doublon voulu — worksSubmitted dédupliqué
    };

    it('should map projects with grids and works counts', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([mockProject]);

      const result = await service.getProjectsWithAssessmentsId();

      expect(result).toEqual([
        {
          id: 1,
          title: 'Mon TFE',
          students: [{ id: 100, firstname: 'Alice', surname: 'Dupont' }],
          grids: [{ id: 11, name: 'Grille finale' }],
          worksSubmitted: 1,
          worksTotal: 2,
        },
      ]);
    });

    it('should filter by trainingCourseId when provided', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);

      await service.getProjectsWithAssessmentsId(10);

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ trainingCourseId: 10 }),
        }),
      );
    });

    it('should filter by rapporteurId when provided', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);

      await service.getProjectsWithAssessmentsId(undefined, 42);

      const call = mockPrismaService.project.findMany.mock.calls[0][0];
      expect(call.where.members.some.userId).toBe(42);
    });

    it('should not filter by members when rapporteurId is not provided', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);

      await service.getProjectsWithAssessmentsId();

      const call = mockPrismaService.project.findMany.mock.calls[0][0];
      expect(call.where.members).toBeUndefined();
    });
  });

  // ── getAssessmentGrid ─────────────────────────────────────────────────────────

  describe('getAssessmentGrid', () => {
    it('should throw NotFoundException when grid does not exist', async () => {
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue(null);

      await expect(service.getAssessmentGrid(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should map criterias and cells, converting Decimal weight to number', async () => {
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue({
        criterias: [
          {
            id: 1,
            name: 'Qualité',
            order: 0,
            defaultWeight: 10,
            cells: [
              { description: 'Insuffisant', order: 0, weight: null },
              {
                description: 'Excellent',
                order: 1,
                weight: { toString: () => '5.5' } as any,
              },
            ],
          },
        ],
      });

      const result = await service.getAssessmentGrid(1);

      expect(result).toEqual([
        {
          id: 1,
          name: 'Qualité',
          order: 0,
          defaultWeight: 10,
          cells: [
            { description: 'Insuffisant', order: 0, weight: null },
            { description: 'Excellent', order: 1, weight: 5.5 },
          ],
        },
      ]);
    });
  });

  // ── setCriteriaNote ───────────────────────────────────────────────────────────

  describe('setCriteriaNote', () => {
    it('should throw NotFoundException when criteria does not exist', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValue(null);

      await expect(
        service.setCriteriaNote(999, 1, { projectId: 1, note: 5 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should upsert the note and mark the grid in correction when note is set', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValue({
        id: 1,
        gridId: 5,
      });
      mockPrismaService.criteriaAssessment.upsert.mockResolvedValue({
        note: 8,
      });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue(null);

      const result = await service.setCriteriaNote(1, 42, {
        projectId: 7,
        note: 8,
      });

      expect(mockPrismaService.criteriaAssessment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            criteriaId_teacherId_projectId: {
              criteriaId: 1,
              teacherId: 42,
              projectId: 7,
            },
          },
        }),
      );
      expect(mockPrismaService.gridFeedback.create).toHaveBeenCalledWith({
        data: {
          gridId: 5,
          projectId: 7,
          status: GridFeedbackStatus.CORRECTION,
        },
      });
      expect(result).toEqual({ note: 8 });
    });

    it('should not mark the grid in correction when note is null (vote cancellation)', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValue({
        id: 1,
        gridId: 5,
      });
      mockPrismaService.criteriaAssessment.upsert.mockResolvedValue({
        note: null,
      });

      const result = await service.setCriteriaNote(1, 42, {
        projectId: 7,
        note: null,
      });

      expect(mockPrismaService.gridFeedback.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual({ note: null });
    });

    it('should update existing PENDING feedback to CORRECTION', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValue({
        id: 1,
        gridId: 5,
      });
      mockPrismaService.criteriaAssessment.upsert.mockResolvedValue({
        note: 8,
      });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue({
        status: GridFeedbackStatus.PENDING,
      });

      await service.setCriteriaNote(1, 42, { projectId: 7, note: 8 });

      expect(mockPrismaService.gridFeedback.update).toHaveBeenCalledWith({
        where: { gridId_projectId: { gridId: 5, projectId: 7 } },
        data: { status: GridFeedbackStatus.CORRECTION },
      });
      expect(mockPrismaService.gridFeedback.create).not.toHaveBeenCalled();
    });

    it('should not touch feedback status when it is already past PENDING', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValue({
        id: 1,
        gridId: 5,
      });
      mockPrismaService.criteriaAssessment.upsert.mockResolvedValue({
        note: 8,
      });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue({
        status: GridFeedbackStatus.PUBLISHED,
      });

      await service.setCriteriaNote(1, 42, { projectId: 7, note: 8 });

      expect(mockPrismaService.gridFeedback.update).not.toHaveBeenCalled();
      expect(mockPrismaService.gridFeedback.create).not.toHaveBeenCalled();
    });
  });

  // ── setCriteriaFeedback ───────────────────────────────────────────────────────

  describe('setCriteriaFeedback', () => {
    it('should throw NotFoundException when criteria does not exist', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValue(null);

      await expect(
        service.setCriteriaFeedback(999, 1, {
          projectId: 1,
          commentFeedback: 'x',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should upsert the comment and always mark the grid in correction', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValue({
        id: 1,
        gridId: 5,
      });
      mockPrismaService.criteriaAssessment.upsert.mockResolvedValue({
        note: null,
        commentFeedback: 'Bon travail',
      });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue(null);

      const result = await service.setCriteriaFeedback(1, 42, {
        projectId: 7,
        commentFeedback: 'Bon travail',
      });

      expect(mockPrismaService.gridFeedback.create).toHaveBeenCalled();
      expect(result).toEqual({ note: null, commentFeedback: 'Bon travail' });
    });
  });

  // ── getCriteriaDiscussions ────────────────────────────────────────────────────

  describe('getCriteriaDiscussions', () => {
    it('should throw NotFoundException when criteria does not exist', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValue(null);

      await expect(service.getCriteriaDiscussions(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return mapped discussions', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValue({
        id: 1,
        gridId: 5,
      });
      const date = new Date();
      mockPrismaService.criteriaDiscussion.findMany.mockResolvedValue([
        {
          id: 1,
          comment: 'Attention aux sources',
          date,
          teacherId: 42,
          teacher: { firstname: 'Jean', surname: 'Martin' },
        },
      ]);

      const result = await service.getCriteriaDiscussions(1, 7);

      expect(
        mockPrismaService.criteriaDiscussion.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ where: { criteriaId: 1, projectId: 7 } }),
      );
      expect(result).toEqual([
        {
          id: 1,
          comment: 'Attention aux sources',
          teacherId: 42,
          teacherFirstname: 'Jean',
          teacherSurname: 'Martin',
          date,
        },
      ]);
    });
  });

  // ── createCriteriaDiscussion ──────────────────────────────────────────────────

  describe('createCriteriaDiscussion', () => {
    it('should throw NotFoundException when criteria does not exist', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValue(null);

      await expect(
        service.createCriteriaDiscussion(999, 1, {
          projectId: 1,
          comment: 'x',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create the discussion and mark the grid in correction', async () => {
      mockPrismaService.criteria.findUnique.mockResolvedValue({
        id: 1,
        gridId: 5,
      });
      const date = new Date();
      mockPrismaService.criteriaDiscussion.create.mockResolvedValue({
        id: 2,
        comment: 'Précisez la méthodologie',
        date,
        teacherId: 42,
        teacher: { firstname: 'Jean', surname: 'Martin' },
      });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue(null);

      const result = await service.createCriteriaDiscussion(1, 42, {
        projectId: 7,
        comment: 'Précisez la méthodologie',
      });

      expect(mockPrismaService.gridFeedback.create).toHaveBeenCalledWith({
        data: {
          gridId: 5,
          projectId: 7,
          status: GridFeedbackStatus.CORRECTION,
        },
      });
      expect(result).toEqual({
        id: 2,
        comment: 'Précisez la méthodologie',
        teacherId: 42,
        teacherFirstname: 'Jean',
        teacherSurname: 'Martin',
        date,
      });
    });
  });

  // ── getGridEvaluations ────────────────────────────────────────────────────────

  describe('getGridEvaluations', () => {
    it('should throw NotFoundException when grid has no criteria', async () => {
      mockPrismaService.criteria.findMany.mockResolvedValue([]);

      await expect(service.getGridEvaluations(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return mapped evaluations with Decimal note converted to number', async () => {
      mockPrismaService.criteria.findMany.mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ]);
      const date = new Date();
      mockPrismaService.criteriaAssessment.findMany.mockResolvedValue([
        {
          criteriaId: 1,
          teacherId: 42,
          note: { toString: () => '7.25' } as any,
          commentFeedback: 'Bien',
          date,
          teacher: { firstname: 'Jean', surname: 'Martin' },
        },
        {
          criteriaId: 2,
          teacherId: 42,
          note: null,
          commentFeedback: null,
          date: null,
          teacher: { firstname: 'Jean', surname: 'Martin' },
        },
      ]);

      const result = await service.getGridEvaluations(5, 7);

      expect(
        mockPrismaService.criteriaAssessment.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { criteriaId: { in: [1, 2] }, projectId: 7 },
        }),
      );
      expect(result).toEqual([
        {
          criteriaId: 1,
          teacherId: 42,
          teacherFirstname: 'Jean',
          teacherSurname: 'Martin',
          note: 7.25,
          commentFeedback: 'Bien',
          date,
        },
        {
          criteriaId: 2,
          teacherId: 42,
          teacherFirstname: 'Jean',
          teacherSurname: 'Martin',
          note: null,
          commentFeedback: null,
          date: null,
        },
      ]);
    });
  });

  // ── getGridContext ────────────────────────────────────────────────────────────

  describe('getGridContext', () => {
    it('should throw NotFoundException when grid does not exist', async () => {
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue(null);

      await expect(service.getGridContext(999, 1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should default status to PENDING when no feedback exists and report isSupervisor', async () => {
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue({ id: 5 });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue(null);
      mockPrismaService.projectMember.findFirst.mockResolvedValue({
        userId: 1,
      });
      mockPrismaService.toolLink.findFirst.mockResolvedValue(null);

      const result = await service.getGridContext(5, 7, 1);

      expect(result).toEqual({
        status: GridFeedbackStatus.PENDING,
        linkedSubmission: null,
        isSupervisor: true,
      });
    });

    it('should report isSupervisor as false when the user has no supervisor membership', async () => {
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue({ id: 5 });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue({
        status: GridFeedbackStatus.CORRECTION,
      });
      mockPrismaService.projectMember.findFirst.mockResolvedValue(null);
      mockPrismaService.toolLink.findFirst.mockResolvedValue(null);

      const result = await service.getGridContext(5, 7, 99);

      expect(result.isSupervisor).toBe(false);
      expect(result.status).toBe(GridFeedbackStatus.CORRECTION);
    });

    it('should resolve the linked PDF submission when the source tool is the WORK', async () => {
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue({ id: 5 });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue(null);
      mockPrismaService.projectMember.findFirst.mockResolvedValue(null);
      mockPrismaService.toolLink.findFirst.mockResolvedValue({
        sourceToolId: 10,
        targetToolId: 5,
        sourceTool: { type: ToolType.WORK },
      });
      mockPrismaService.userWorkSubmission.findFirst.mockResolvedValue({
        id: 1,
        fileName: 'rapport.pdf',
      });

      const result = await service.getGridContext(5, 7, 1);

      expect(
        mockPrismaService.userWorkSubmission.findFirst,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ where: { workId: 10, projectId: 7 } }),
      );
      expect(result.linkedSubmission).toEqual({
        workId: 10,
        submissionId: 1,
        fileName: 'rapport.pdf',
      });
    });

    it('should resolve the linked work id from the target tool when the grid is the source', async () => {
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue({ id: 5 });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue(null);
      mockPrismaService.projectMember.findFirst.mockResolvedValue(null);
      mockPrismaService.toolLink.findFirst.mockResolvedValue({
        sourceToolId: 5,
        targetToolId: 10,
        sourceTool: { type: ToolType.ASSESSMENT },
      });
      mockPrismaService.userWorkSubmission.findFirst.mockResolvedValue({
        id: 1,
        fileName: 'rapport.pdf',
      });

      const result = await service.getGridContext(5, 7, 1);

      expect(
        mockPrismaService.userWorkSubmission.findFirst,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ where: { workId: 10, projectId: 7 } }),
      );
      expect(result.linkedSubmission).toEqual({
        workId: 10,
        submissionId: 1,
        fileName: 'rapport.pdf',
      });
    });

    it('should not expose a linked submission when the latest file is not a PDF', async () => {
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue({ id: 5 });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue(null);
      mockPrismaService.projectMember.findFirst.mockResolvedValue(null);
      mockPrismaService.toolLink.findFirst.mockResolvedValue({
        sourceToolId: 10,
        targetToolId: 5,
        sourceTool: { type: ToolType.WORK },
      });
      mockPrismaService.userWorkSubmission.findFirst.mockResolvedValue({
        id: 1,
        fileName: 'rapport.docx',
      });

      const result = await service.getGridContext(5, 7, 1);

      expect(result.linkedSubmission).toBeNull();
    });

    it('should not expose a linked submission when no submission exists yet', async () => {
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue({ id: 5 });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue(null);
      mockPrismaService.projectMember.findFirst.mockResolvedValue(null);
      mockPrismaService.toolLink.findFirst.mockResolvedValue({
        sourceToolId: 10,
        targetToolId: 5,
        sourceTool: { type: ToolType.WORK },
      });
      mockPrismaService.userWorkSubmission.findFirst.mockResolvedValue(null);

      const result = await service.getGridContext(5, 7, 1);

      expect(result.linkedSubmission).toBeNull();
    });
  });

  // ── publishGrid ───────────────────────────────────────────────────────────────

  describe('publishGrid', () => {
    it('should throw NotFoundException when grid does not exist', async () => {
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue(null);

      await expect(service.publishGrid(999, 1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when the user is not the project supervisor', async () => {
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue({ id: 5 });
      mockPrismaService.projectMember.findFirst.mockResolvedValue(null);

      await expect(service.publishGrid(5, 7, 99)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrismaService.gridFeedback.upsert).not.toHaveBeenCalled();
    });

    it('should publish the grid when the user is the project supervisor', async () => {
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue({ id: 5 });
      mockPrismaService.projectMember.findFirst.mockResolvedValue({
        userId: 1,
      });
      mockPrismaService.gridFeedback.upsert.mockResolvedValue({
        status: GridFeedbackStatus.PUBLISHED,
      });

      const result = await service.publishGrid(5, 7, 1);

      expect(mockPrismaService.gridFeedback.upsert).toHaveBeenCalledWith({
        where: { gridId_projectId: { gridId: 5, projectId: 7 } },
        update: { status: GridFeedbackStatus.PUBLISHED },
        create: {
          gridId: 5,
          projectId: 7,
          status: GridFeedbackStatus.PUBLISHED,
        },
        select: { status: true },
      });
      expect(result).toBe(GridFeedbackStatus.PUBLISHED);
    });
  });

  // ── getStudentAssessmentView ──────────────────────────────────────────────────

  describe('getStudentAssessmentView', () => {
    const mockTool = {
      id: 5,
      name: 'Grille finale',
      description: 'Description',
      type: ToolType.ASSESSMENT,
      module: { trainingCourseId: 10 },
    };

    it('should throw NotFoundException when tool does not exist', async () => {
      mockPrismaService.tool.findUnique.mockResolvedValue(null);

      await expect(service.getStudentAssessmentView(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the tool is not an ASSESSMENT', async () => {
      mockPrismaService.tool.findUnique.mockResolvedValue({
        ...mockTool,
        type: ToolType.WORK,
      });

      await expect(service.getStudentAssessmentView(5, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the student has no project in that training course', async () => {
      mockPrismaService.tool.findUnique.mockResolvedValue(mockTool);
      mockUsersService.findFirstProject.mockResolvedValue(null);

      await expect(service.getStudentAssessmentView(5, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not expose evaluations while the grid is still PENDING', async () => {
      mockPrismaService.tool.findUnique.mockResolvedValue(mockTool);
      mockUsersService.findFirstProject.mockResolvedValue({ id: 7 });
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue({
        criterias: [],
      });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue(null);

      const result = await service.getStudentAssessmentView(5, 1);

      expect(result.status).toBe(GridFeedbackStatus.PENDING);
      expect(result.evaluations).toEqual([]);
      expect(
        mockPrismaService.criteriaAssessment.findMany,
      ).not.toHaveBeenCalled();
    });

    it('should not expose evaluations while the grid is in CORRECTION', async () => {
      mockPrismaService.tool.findUnique.mockResolvedValue(mockTool);
      mockUsersService.findFirstProject.mockResolvedValue({ id: 7 });
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue({
        criterias: [],
      });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue({
        status: GridFeedbackStatus.CORRECTION,
      });

      const result = await service.getStudentAssessmentView(5, 1);

      expect(result.status).toBe(GridFeedbackStatus.CORRECTION);
      expect(result.evaluations).toEqual([]);
    });

    it('should expose evaluations once the grid is PUBLISHED', async () => {
      mockPrismaService.tool.findUnique.mockResolvedValue(mockTool);
      mockUsersService.findFirstProject.mockResolvedValue({ id: 7 });
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue({
        criterias: [],
      });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue({
        status: GridFeedbackStatus.PUBLISHED,
      });
      mockPrismaService.criteria.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.criteriaAssessment.findMany.mockResolvedValue([
        {
          criteriaId: 1,
          teacherId: 42,
          note: { toString: () => '9' } as any,
          commentFeedback: 'Excellent',
          date: new Date(),
          teacher: { firstname: 'Jean', surname: 'Martin' },
        },
      ]);

      const result = await service.getStudentAssessmentView(5, 1);

      expect(result.status).toBe(GridFeedbackStatus.PUBLISHED);
      expect(result.evaluations).toHaveLength(1);
      expect(result.evaluations[0].note).toBe(9);
    });

    it('should expose evaluations once the grid has been SEEN', async () => {
      mockPrismaService.tool.findUnique.mockResolvedValue(mockTool);
      mockUsersService.findFirstProject.mockResolvedValue({ id: 7 });
      mockPrismaService.assessmentGrid.findUnique.mockResolvedValue({
        criterias: [],
      });
      mockPrismaService.gridFeedback.findUnique.mockResolvedValue({
        status: GridFeedbackStatus.SEEN,
      });
      mockPrismaService.criteria.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.criteriaAssessment.findMany.mockResolvedValue([]);

      const result = await service.getStudentAssessmentView(5, 1);

      expect(result.status).toBe(GridFeedbackStatus.SEEN);
      expect(mockPrismaService.criteriaAssessment.findMany).toHaveBeenCalled();
    });
  });
});
