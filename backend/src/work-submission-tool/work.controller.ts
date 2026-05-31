import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WorkService } from './work.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

@Controller('works')
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @Post()
  @Roles(RoleType.COORDINATOR)
  async createWork(@Body() dto: CreateWorkDto) {
    return this.workService.createWork(dto);
  }

  @Patch(':id')
  @Roles(RoleType.COORDINATOR)
  async updateWork(
    @Param('id', ParseIntPipe) workId: number,
    @Body() dto: UpdateWorkDto,
  ) {
    return this.workService.updateWork(workId, dto);
  }
}