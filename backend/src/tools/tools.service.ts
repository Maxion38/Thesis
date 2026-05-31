import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToolDto } from './dto/tool.dto';

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getToolsByModuleId(moduleId: number): Promise<ToolDto[]> {
    const tools = await this.prisma.tool.findMany({
      where: { moduleId },
      include: {
        works: true, 
      },
      orderBy: { id: 'asc' },
    });

    return tools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      type: tool.type,
      moduleId: tool.moduleId,

      maxAttempts: tool.works?.[0]?.maxAttempts ?? null,
    }));
  }
}