import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { WorkService } from './work.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { RoleType } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

@Controller('works')
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @Get(':id')
  @Auth()
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

  @Post(':workId/submissions')
  @Auth()
  @UseInterceptors(FileInterceptor('file'))
  submitWork(
    @Param('workId', ParseIntPipe) workId: number,
    @UploadedFile() file: any,
    @Req() req: { user: { userId: number; email: string; roles: string[] } },
  ) {
    return this.workService.submitWork(workId, file, req.user);
  }

  @Get(':workId/submissions/latest')
  @Auth()
  getLatestSubmission(
    @Param('workId', ParseIntPipe) workId: number,
    @Req() req: { user: { userId: number; email: string; roles: string[] } },
  ) {
    return this.workService.getLatestSubmission(workId, req.user.userId);
  }

  @Get(':workId/submissions/:submissionId/file')
  @Auth()
  getSubmissionFile(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Req() req: { user: { userId: number; email: string; roles: string[] } },
    @Res() res: Response,
  ) {
    return this.workService.getSubmissionFile(submissionId, req.user, res);
  }

  @Delete(':workId/submissions/:submissionId')
  @Auth(RoleType.STUDENT, RoleType.COORDINATOR)
  removeSubmission(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Req() req: { user: { userId: number; email: string; roles: string[] } },
  ) {
    return this.workService.removeSubmission(submissionId, req.user.userId);
  }

  @Get('user-submissions/:userId')
  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  getUserSubmissions(@Param('userId', ParseIntPipe) userId: number) {
    return this.workService.getUserSubmissions(userId);
  }
}
