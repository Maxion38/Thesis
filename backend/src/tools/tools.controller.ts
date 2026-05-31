import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { ToolsService } from './tools.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

@Controller('tools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ToolsController {
  constructor(private readonly toolService: ToolsService) {}

  @Get('module/:moduleId')
  @Roles(RoleType.COORDINATOR)
  async getToolsByModuleId(
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ) {
    return this.toolService.getToolsByModuleId(moduleId);
  }
}

