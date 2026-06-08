import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { ToolsService } from './tools.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleType } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { UpdateToolDto } from './dto/update-tool.dto';

@Controller('tools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ToolsController {
  constructor(private readonly toolService: ToolsService) {}

  @Get('module/:moduleId')
  @Auth()
  async getToolsByModuleId(
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ) {
    return this.toolService.getToolsByModuleId(moduleId);
  }

  @Patch(':id')
  @Auth(RoleType.COORDINATOR)
  async updateTool(
    @Param('id', ParseIntPipe) toolId: number,
    @Body() dto: UpdateToolDto,
  ) {
    return this.toolService.updateTool(toolId, dto);
  }

  @Delete(':id')
  @Auth(RoleType.COORDINATOR)
  async deleteTool(
    @Param('id', ParseIntPipe) toolId: number, 
  ) {
    return this.toolService.deleteTool(toolId);
  }
}

