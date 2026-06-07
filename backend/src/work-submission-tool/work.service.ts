import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { ToolType } from '@prisma/client';

@Injectable()
export class WorkService {
  constructor(private readonly prisma: PrismaService) {}

  async getWork(workId: number) {
    const work = await this.prisma.work.findUnique({
      where: { id: workId },
      include: { tool: true },
    });

    if (!work) {
      throw new NotFoundException(`Work with id ${workId} not found`);
    }

    return work;
  }

  async createWork(dto: CreateWorkDto) {
    const module = await this.prisma.module.findUnique({
      where: { id: dto.moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with id ${dto.moduleId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const tool = await tx.tool.create({
        data: {
          name: dto.name,
          description: dto.description,
          type: ToolType.WORK,
          moduleId: dto.moduleId,
        },
      });

      const work = await tx.work.create({
        data: {
          maxAttempts: dto.maxAttempts,
          toolId: tool.id,
          ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
        },
      });

      return { tool, work };
    });
  }

  async updateWork(workId: number, dto: UpdateWorkDto) {
    const work = await this.prisma.work.findUnique({
      where: { id: workId },
      include: { tool: true },
    });

    if (!work) {
      throw new NotFoundException(`Work with id ${workId} not found`);
    }

    // Si moduleId changé, on vérifie que le nouveau module existe
    if (dto.moduleId && dto.moduleId !== work.tool.moduleId) {
      const module = await this.prisma.module.findUnique({
        where: { id: dto.moduleId },
      });

      if (!module) {
        throw new NotFoundException(`Module with id ${dto.moduleId} not found`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedTool = await tx.tool.update({
        where: { id: work.toolId },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description && { description: dto.description }),
          ...(dto.moduleId && { moduleId: dto.moduleId }),
        },
      });

      const updatedWork = await tx.work.update({
        where: { id: workId },
        data: {
          ...(dto.maxAttempts && { maxAttempts: dto.maxAttempts }),
          ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
        },
      });

      return { tool: updatedTool, work: updatedWork };
    });
  }
}