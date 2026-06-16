import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleOverviewDto } from './dto/module-overview.dto';
import { ModuleDetailsDto } from './dto/module-details.dto';
import { buildToolsInclude, resolveToolGroup } from './modules.helpers';

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

    const now = new Date();

    if (now < course.startDate || now > course.endDate) {
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