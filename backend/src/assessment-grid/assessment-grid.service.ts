import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GridFeedbackStatus, RoleType, SubRoleType, ToolType } from '@prisma/client';
import {
  CriteriaDto,
  ProjectWithGridsDto,
  GridSummaryDto,
  SetCriteriaNoteDto,
  SetCriteriaFeedbackDto,
  CriteriaAssessmentDto,
  EvaluationDto,
  CriteriaDiscussionDto,
  CreateCriteriaDiscussionDto,
  GridContextDto,
} from './dto/assessment-grid.dto';

@Injectable()
export class AssessmentGridService {
  constructor(private prisma: PrismaService) {}

  async getProjectsWithAssessmentsId(
    trainingCourseId?: number,
    rapporteurId?: number,
  ): Promise<ProjectWithGridsDto[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        ...(trainingCourseId ? { trainingCourseId } : {}),
        ...(rapporteurId
          ? {
              members: {
                some: {
                  userId: rapporteurId,
                  subRole: { subRole: SubRoleType.SUPERVISOR },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        members: {
          where: { user: { roles: { some: { role: { role: RoleType.STUDENT } } } } },
          select: {
            user: { select: { id: true, firstname: true, surname: true } },
          },
        },
        trainingCourse: {
          select: {
            modules: {
              select: {
                tools: {
                  where: { type: { in: [ToolType.ASSESSMENT, ToolType.WORK] } },
                  // id du Tool == id de l'AssessmentGrid/Work (PK partagée)
                  select: { id: true, name: true, type: true },
                },
              },
            },
          },
        },
        workSubmissions: {
          select: { workId: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    return projects.map((project) => {
      const grids = new Map<number, GridSummaryDto>();
      let worksTotal = 0;
      for (const m of project.trainingCourse.modules) {
        for (const t of m.tools) {
          if (t.type === ToolType.ASSESSMENT) {
            grids.set(t.id, { id: t.id, name: t.name });
          } else if (t.type === ToolType.WORK) {
            worksTotal++;
          }
        }
      }
      const worksSubmitted = new Set(project.workSubmissions.map((w) => w.workId)).size;

      return {
        id: project.id,
        title: project.title,
        students: project.members.map((m) => ({
          id: m.user.id,
          firstname: m.user.firstname,
          surname: m.user.surname,
        })),
        grids: Array.from(grids.values()),
        worksSubmitted,
        worksTotal,
      };
    });
  }

  async getAssessmentGrid(gridId: number): Promise<CriteriaDto[]> {
    const grid = await this.prisma.assessmentGrid.findUnique({
      where: { id: gridId },
      select: {
        criterias: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            order: true,
            defaultWeight: true,
            cells: {
              orderBy: { order: 'asc' },
              select: {
                description: true,
                order: true,
                weight: true,
              },
            },
          },
        },
      },
    });

    if (!grid) {
      throw new NotFoundException(`AssessmentGrid ${gridId} not found`);
    }

    return grid.criterias.map((criteria) => ({
      id: criteria.id,
      name: criteria.name,
      order: criteria.order,
      defaultWeight: criteria.defaultWeight,
      cells: criteria.cells.map((cell) => ({
        description: cell.description,
        order: cell.order,
        // weight est un Decimal Prisma -> number pour matcher CellDto
        weight: cell.weight === null ? null : Number(cell.weight),
      })),
    }));
  }

  async setCriteriaNote(
    criteriaId: number,
    teacherId: number,
    dto: SetCriteriaNoteDto,
  ): Promise<CriteriaAssessmentDto> {
    const criteria = await this.prisma.criteria.findUnique({
      where: { id: criteriaId },
    });
    if (!criteria) {
      throw new NotFoundException(`Criteria ${criteriaId} not found`);
    }

    const assessment = await this.prisma.criteriaAssessment.upsert({
      where: {
        criteriaId_teacherId_projectId: {
          criteriaId,
          teacherId,
          projectId: dto.projectId,
        },
      },
      update: {
        note: dto.note,
        date: new Date(),
      },
      create: {
        criteriaId,
        teacherId,
        projectId: dto.projectId,
        note: dto.note,
        date: new Date(),
      },
    });

    return {
      note: assessment.note === null ? null : Number(assessment.note),
    };
  }

  async setCriteriaFeedback(
    criteriaId: number,
    teacherId: number,
    dto: SetCriteriaFeedbackDto,
  ): Promise<CriteriaAssessmentDto> {
    const criteria = await this.prisma.criteria.findUnique({
      where: { id: criteriaId },
    });
    if (!criteria) {
      throw new NotFoundException(`Criteria ${criteriaId} not found`);
    }

    const assessment = await this.prisma.criteriaAssessment.upsert({
      where: {
        criteriaId_teacherId_projectId: {
          criteriaId,
          teacherId,
          projectId: dto.projectId,
        },
      },
      update: {
        commentFeedback: dto.commentFeedback,
        date: new Date(),
      },
      create: {
        criteriaId,
        teacherId,
        projectId: dto.projectId,
        commentFeedback: dto.commentFeedback,
        date: new Date(),
      },
    });

    return {
      note: assessment.note === null ? null : Number(assessment.note),
      commentFeedback: assessment.commentFeedback,
    };
  }

  async getCriteriaDiscussions(
    criteriaId: number,
    projectId: number,
  ): Promise<CriteriaDiscussionDto[]> {
    const criteria = await this.prisma.criteria.findUnique({
      where: { id: criteriaId },
    });
    if (!criteria) {
      throw new NotFoundException(`Criteria ${criteriaId} not found`);
    }

    const discussions = await this.prisma.criteriaDiscussion.findMany({
      where: { criteriaId, projectId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        comment: true,
        date: true,
        teacherId: true,
        teacher: { select: { firstname: true, surname: true } },
      },
    });

    return discussions.map((d) => ({
      id: d.id,
      comment: d.comment,
      teacherId: d.teacherId,
      teacherFirstname: d.teacher.firstname,
      teacherSurname: d.teacher.surname,
      date: d.date,
    }));
  }

  async createCriteriaDiscussion(
    criteriaId: number,
    teacherId: number,
    dto: CreateCriteriaDiscussionDto,
  ): Promise<CriteriaDiscussionDto> {
    const criteria = await this.prisma.criteria.findUnique({
      where: { id: criteriaId },
    });
    if (!criteria) {
      throw new NotFoundException(`Criteria ${criteriaId} not found`);
    }

    const created = await this.prisma.criteriaDiscussion.create({
      data: {
        criteriaId,
        teacherId,
        projectId: dto.projectId,
        comment: dto.comment,
        date: new Date(),
      },
      select: {
        id: true,
        comment: true,
        date: true,
        teacherId: true,
        teacher: { select: { firstname: true, surname: true } },
      },
    });

    return {
      id: created.id,
      comment: created.comment,
      teacherId: created.teacherId,
      teacherFirstname: created.teacher.firstname,
      teacherSurname: created.teacher.surname,
      date: created.date,
    };
  }

  async getGridEvaluations(
    gridId: number,
    projectId: number,
  ): Promise<EvaluationDto[]> {
    const criterias = await this.prisma.criteria.findMany({
      where: { gridId },
      select: { id: true },
    });

    if (criterias.length === 0) {
      throw new NotFoundException(`AssessmentGrid ${gridId} not found or has no criteria`);
    }

    const criteriaIds = criterias.map((c) => c.id);

    const evaluations = await this.prisma.criteriaAssessment.findMany({
      where: {
        criteriaId: { in: criteriaIds },
        projectId,
      },
      select: {
        criteriaId: true,
        teacherId: true,
        note: true,
        commentFeedback: true,
        date: true,
        teacher: {
          select: { firstname: true, surname: true },
        },
      },
    });

    return evaluations.map((e) => ({
      criteriaId: e.criteriaId,
      teacherId: e.teacherId,
      teacherFirstname: e.teacher.firstname,
      teacherSurname: e.teacher.surname,
      note: e.note === null ? null : Number(e.note),
      commentFeedback: e.commentFeedback,
      date: e.date,
    }));
  }

  // Statut de correction (GridFeedback.status, PENDING tant qu'aucun
  // enseignant n'a encore écrit de feedback global) + soumission PDF liée
  // via ToolLink (grid <-> work), pour affichage dans l'en-tête de la page.
  async getGridContext(gridId: number, projectId: number): Promise<GridContextDto> {
    const grid = await this.prisma.assessmentGrid.findUnique({
      where: { id: gridId },
      select: { id: true },
    });
    if (!grid) {
      throw new NotFoundException(`AssessmentGrid ${gridId} not found`);
    }

    const feedback = await this.prisma.gridFeedback.findUnique({
      where: { gridId_projectId: { gridId, projectId } },
      select: { status: true },
    });

    const link = await this.prisma.toolLink.findFirst({
      where: {
        OR: [
          { sourceToolId: gridId, targetTool: { type: ToolType.WORK } },
          { targetToolId: gridId, sourceTool: { type: ToolType.WORK } },
        ],
      },
      select: {
        sourceToolId: true,
        targetToolId: true,
        sourceTool: { select: { type: true } },
      },
    });

    let linkedSubmission: GridContextDto['linkedSubmission'] = null;
    if (link) {
      const workToolId = link.sourceTool.type === ToolType.WORK ? link.sourceToolId : link.targetToolId;
      const submission = await this.prisma.userWorkSubmission.findFirst({
        where: { workId: workToolId, projectId },
        orderBy: { submittedAt: 'desc' },
        select: { id: true, fileName: true },
      });

      if (submission && submission.fileName.toLowerCase().endsWith('.pdf')) {
        linkedSubmission = {
          workId: workToolId,
          submissionId: submission.id,
          fileName: submission.fileName,
        };
      }
    }

    return {
      status: feedback?.status ?? GridFeedbackStatus.PENDING,
      linkedSubmission,
    };
  }
}