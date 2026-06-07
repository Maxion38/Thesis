import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { WorkService } from './work.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { RoleType } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';

@Controller('works')
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @Auth()
  @Get(':id')
  getWork(@Param('id', ParseIntPipe) id: number) {
    return this.workService.getWork(id);
  }

  @Post()
  @Auth(RoleType.COORDINATOR)
  async createWork(@Body() dto: CreateWorkDto) {
    return this.workService.createWork(dto);
  }

  @Patch(':id')
  @Auth(RoleType.COORDINATOR)
  async updateWork(
    @Param('id', ParseIntPipe) workId: number,
    @Body() dto: UpdateWorkDto,
  ) {
    return this.workService.updateWork(workId, dto);
  }
}