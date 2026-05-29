import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleOverviewDto, ModuleToolGroupDto } from './dto/module-overview.dto';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}
  
  create(createModuleDto: CreateModuleDto) {
    return this.prisma.module.create({
      data: createModuleDto
    });
  }

  findAll() {
    return this.prisma.module.findMany();
  }

  findAllForTrainingCourse(trainingCourseId: number) {
    return this.prisma.module.findMany({
      where: {
        trainingCourseId: trainingCourseId
      }
    })
  }

  findOne(id: number) {
    return this.prisma.module.findUnique({
      where: {
        id: id
      }
    });
  }

  update(id: number, updateModuleDto: UpdateModuleDto) {
    return this.prisma.module.update({
      where: {id},
      data: updateModuleDto,
    });
  }

  async remove(id: number) {
    try {
      return await this.prisma.module.delete({
        where: { id }
      });
    } catch {
      throw new NotFoundException(`Module ${id} not found`);
    }
  }


  async findUserModulesOverview(
    userId: number,
    projectId: number,
  ): Promise<ModuleOverviewDto[]> {

    // -----------------------------
    // Get project
    // -----------------------------
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { trainingCourseId: true },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // -----------------------------
    // Get modules + tools
    // -----------------------------
    const modules = await this.prisma.module.findMany({
      where: {
        trainingCourseId: project.trainingCourseId,
      },
      include: {
        tools: {
          include: {
            forms: {
              include: {
                submissions: {
                  where: { userId, projectId },
                  orderBy: { submittedAt: 'desc' },
                },
              },
            },
            works: {
              include: {
                userWorkSubmissions: {
                  where: { userId, projectId },
                  orderBy: { submittedAt: 'desc' },
                },
              },
            },
            activities: true,
            assessmentGrids: {
              include: {
                gridVersions: {
                  include: {
                    feedbacks: {
                      where: { userId, projectId },
                      orderBy: { createdAt: 'desc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // -----------------------------
    // Mapping
    // -----------------------------
    return modules.map((module): ModuleOverviewDto => {

      const groups: ModuleToolGroupDto[] = [];

      for (const tool of module.tools) {

        let state: 'UNTOUCHED' | 'SUBMITTED' | 'CORRECTED' = 'UNTOUCHED';
        let date: Date | undefined = undefined;

        // =========================================================
        // WORK
        // =========================================================
        if (tool.type === 'WORK') {

          const submissions = tool.works.flatMap(w => w.userWorkSubmissions);

          const latest = submissions.sort(
            (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
          )[0];

          if (submissions.length > 0) {
            state = 'SUBMITTED';
            date = latest?.submittedAt;
          } else {
            date = tool.createdAt;
          }
        }

        // =========================================================
        // FORM
        // =========================================================
        if (tool.type === 'FORM') {

          const submissions = tool.forms.flatMap(f => f.submissions);

          const latest = submissions.sort(
            (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
          )[0];

          if (submissions.length > 0) {
            state = 'SUBMITTED';
            date = latest?.submittedAt;
          } else {
            date = tool.createdAt;
          }
        }

        // =========================================================
        // ACTIVITY
        // =========================================================
        if (tool.type === 'ACTIVITY') {

          const activity = tool.activities[0];

          date = activity?.startDateTime ?? tool.createdAt;

          state = 'UNTOUCHED';
        }

        // =========================================================
        // ASSESSMENT
        // =========================================================
        if (tool.type === 'ASSESSMENT') {

          const feedbacks = tool.assessmentGrids
            .flatMap(g => g.gridVersions)
            .flatMap(v => v.feedbacks);

          const latest = feedbacks.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          )[0];

          if (feedbacks.length > 0) {
            state = 'CORRECTED';
            date = latest?.createdAt;
          } else {
            date = tool.createdAt;
          }
        }

        // =========================================================
        // PUSH UNIFIED DTO
        // =========================================================
        groups.push({
          id: tool.id,
          label: tool.name,
          type: tool.type,
          state,
          date,
        });
      }

      return {
        id: module.id,
        name: module.name,
        status: {
          locked: false,
        },
        groups,
      };
    });
  }

}
