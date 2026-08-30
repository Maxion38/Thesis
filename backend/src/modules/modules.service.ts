import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ToolType } from '@prisma/client';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleOverviewDto } from './dto/module-overview.dto';
import { ModuleDetailsDto } from './dto/module-details.dto';
import { ProjectOverviewModuleDto } from './dto/project-overview.dto';
import { buildToolsInclude, resolveToolGroup } from './modules.helpers';
import { isTrainingCourseActive } from '../training-courses/training-course-status.util';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // CRUD base
  // ----------------------------------------------------------------

  create(createModuleDto: CreateModuleDto) {
    return this.prisma.module.create({ data: createModuleDto });
  }

  findAll() {
    return this.prisma.module.findMany();
  }

  findAllForTrainingCourse(trainingCourseId: number) {
    return this.prisma.module.findMany({
      where: { trainingCourseId },
    });
  }

  findOne(id: number) {
    return this.prisma.module.findUnique({ where: { id } });
  }

  update(id: number, updateModuleDto: UpdateModuleDto) {
    return this.prisma.module.update({
      where: { id },
      data: updateModuleDto,
    });
  } // TODO (important) : SANATIZE texts

  async remove(id: number) {
    try {
      return await this.prisma.module.delete({ where: { id } });
    } catch {
      throw new NotFoundException(`Module ${id} not found`);
    }
  }

  // ----------------------------------------------------------------
  // Overview  (modules list of a user project)
  // ----------------------------------------------------------------

  async findUserModulesOverview(
    userId: number,
    projectId: number,
  ): Promise<ModuleOverviewDto[]> {

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        trainingCourseId: true,
        trainingCourse: {
          select: {
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const course = project.trainingCourse;

    if (!course?.startDate || !course?.endDate) {
      throw new ForbiddenException(
        `Training course is not available (missing schedule configuration)`,
      );
    }

    if (!isTrainingCourseActive(course)) {
      throw new ForbiddenException(
        `Training course is not active (accessible only between ${course.startDate} and ${course.endDate})`,
      );
    }

    const modules = await this.prisma.module.findMany({
      where: { trainingCourseId: project.trainingCourseId },
      include: buildToolsInclude(userId, projectId),
      orderBy: { createdAt: 'asc' },
    });

    return modules.map((module): ModuleOverviewDto => ({
      id: module.id,
      name: module.name,
      status: { locked: false },
      groups: module.tools.map(tool => resolveToolGroup(tool)),
    }));
  }

  // ----------------------------------------------------------------
  // Project overview  (modules + WORK/ASSESSMENT tools of a project,
  // scoped to the whole project rather than a single member - used by
  // the teacher-facing project overview page)
  // ----------------------------------------------------------------

  async findProjectOverview(projectId: number): Promise<ProjectOverviewModuleDto[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { trainingCourseId: true },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const modules = await this.prisma.module.findMany({
      where: { trainingCourseId: project.trainingCourseId },
      orderBy: { createdAt: 'asc' },
      include: {
        tools: {
          where: { type: { in: [ToolType.WORK, ToolType.ASSESSMENT] } },
          orderBy: { id: 'asc' },
          include: {
            work: {
              include: {
                submissions: {
                  where: { projectId },
                  orderBy: { submittedAt: 'desc' },
                  take: 1,
                  select: {
                    id: true,
                    fileName: true,
                    submittedAt: true,
                    user: { select: { firstname: true, surname: true } },
                  },
                },
              },
            },
            assessmentGrid: {
              include: {
                feedbacks: {
                  where: { projectId },
                  select: { id: true },
                  take: 1,
                },
              },
            },
            linksAsSource: { select: { targetToolId: true } },
            linksAsTarget: { select: { sourceToolId: true } },
          },
        },
      },
    });

    return modules.map((module) => ({
      id: module.id,
      name: module.name,
      tools: module.tools.map((tool) => {
        const linkedToolId =
          tool.linksAsSource[0]?.targetToolId ?? tool.linksAsTarget[0]?.sourceToolId ?? null;

        if (tool.type === ToolType.WORK) {
          const submission = tool.work?.submissions[0];
          return {
            id: tool.id,
            name: tool.name,
            type: 'WORK' as const,
            dueDate: tool.work?.dueDate ?? null,
            submission: submission
              ? {
                  id: submission.id,
                  fileName: submission.fileName,
                  submittedAt: submission.submittedAt,
                  submittedByFirstname: submission.user.firstname,
                  submittedBySurname: submission.user.surname,
                }
              : null,
            linkedToolId,
          };
        }

        return {
          id: tool.id,
          name: tool.name,
          type: 'ASSESSMENT' as const,
          corrected: (tool.assessmentGrid?.feedbacks.length ?? 0) > 0,
          linkedToolId,
        };
      }),
    }));
  }

  // ----------------------------------------------------------------
  // Details  (1 module)
  // ----------------------------------------------------------------

  async findModuleDetails(
    moduleId: number,
    userId: number,
    projectId: number,
  ): Promise<ModuleDetailsDto> {

    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: buildToolsInclude(userId, projectId),
    });

    if (!module) {
      throw new NotFoundException(`Module ${moduleId} not found`);
    }

    return {
      id: module.id,
      name: module.name,
      description: module.description ?? '',
      groups: module.tools.map(tool => resolveToolGroup(tool)),
    };
  }
}