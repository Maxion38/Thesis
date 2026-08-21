import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { AssessmentGridService } from './assessment-grid.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { RoleType } from '@prisma/client';
import { SetCriteriaNoteDto, SetCriteriaFeedbackDto, CreateCriteriaDiscussionDto } from './dto/assessment-grid.dto';

@Controller('assessment-grid')
export class AssessmentGridController {
  constructor(private readonly assessmentGridService: AssessmentGridService) {}

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Get('projects')
  async getProjectsWithAssessmentsId(
    @Query('trainingCourseId') trainingCourseId: string | undefined,
    @Query('rapporteur') rapporteur: string | undefined,
    @Req() req: any,
  ) {
    return this.assessmentGridService.getProjectsWithAssessmentsId(
      trainingCourseId ? +trainingCourseId : undefined,
      rapporteur === 'true' ? req.user.userId : undefined,
    );
  }

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Get(':gridId')
  async getAssessmentGrid(@Param('gridId', ParseIntPipe) gridId: number) {
    return this.assessmentGridService.getAssessmentGrid(gridId);
  }

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Patch('criteria/:criteriaId/note')
  async setCriteriaNote(
    @Param('criteriaId', ParseIntPipe) criteriaId: number,
    @Body() dto: SetCriteriaNoteDto,
    @Req() req: any,
  ) {
    return this.assessmentGridService.setCriteriaNote(criteriaId, req.user.userId, dto);
  }

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Patch('criteria/:criteriaId/feedback')
  async setCriteriaFeedback(
    @Param('criteriaId', ParseIntPipe) criteriaId: number,
    @Body() dto: SetCriteriaFeedbackDto,
    @Req() req: any,
  ) {
    return this.assessmentGridService.setCriteriaFeedback(criteriaId, req.user.userId, dto);
  }

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Get('criteria/:criteriaId/discussions')
  async getCriteriaDiscussions(
    @Param('criteriaId', ParseIntPipe) criteriaId: number,
    @Query('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.assessmentGridService.getCriteriaDiscussions(criteriaId, projectId);
  }

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Post('criteria/:criteriaId/discussions')
  async createCriteriaDiscussion(
    @Param('criteriaId', ParseIntPipe) criteriaId: number,
    @Body() dto: CreateCriteriaDiscussionDto,
    @Req() req: any,
  ) {
    return this.assessmentGridService.createCriteriaDiscussion(criteriaId, req.user.userId, dto);
  }

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Get(':gridId/evaluations')
  async getGridEvaluations(
    @Param('gridId', ParseIntPipe) gridId: number,
    @Query('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.assessmentGridService.getGridEvaluations(gridId, projectId);
  }

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Get(':gridId/context')
  async getGridContext(
    @Param('gridId', ParseIntPipe) gridId: number,
    @Query('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.assessmentGridService.getGridContext(gridId, projectId);
  }
}