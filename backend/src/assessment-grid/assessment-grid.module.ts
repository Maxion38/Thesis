import { Module } from '@nestjs/common';
import { AssessmentGridService } from './assessment-grid.service';
import { AssessmentGridController } from './assessment-grid.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AssessmentGridController],
  providers: [AssessmentGridService],
})
export class AssessmentGridModule {}
