import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AssessmentGridService } from './assessment-grid.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { RoleType } from '@prisma/client';

@Controller('assessment-grid')
export class AssessmentGridController {
  constructor(private readonly assessmentGridService: AssessmentGridService) {}

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Get('students')
  async getStudentsWithAssessmentsId() {
    return this.assessmentGridService.getStudentsWithAssessmentsId();
  }

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Get(':gridId')
  async getAssessmentGrid(@Param('gridId', ParseIntPipe) gridId: number) {
    return this.assessmentGridService.getAssessmentGrid(gridId);
  }
}