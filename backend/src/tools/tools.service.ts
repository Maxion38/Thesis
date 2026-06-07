import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToolDto } from './dto/tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getToolsByModuleId(moduleId: number): Promise<ToolDto[]> {
    const tools = await this.prisma.tool.findMany({
      where: { moduleId },
      orderBy: { id: 'asc' },
    });

    return tools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      type: tool.type,
      moduleId: tool.moduleId,
    }));
  }

  async updateTool(id: number, dto: UpdateToolDto): Promise<ToolDto> {
    const tool = await this.prisma.tool.update({
      where: { id },
      data: dto,
    });

    return {
      id: tool.id,
      name: tool.name,
      description: tool.description,
      type: tool.type,
      moduleId: tool.moduleId,
    };
  }

  deleteTool(id: number) {
    return this.prisma.tool.delete({ where: { id } });
  }
}