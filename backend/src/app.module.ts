import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TrainingCoursesModule } from './training-courses/training-courses.module';
import { ModulesModule } from './modules/modules.module';
import { AuthModule } from './auth/auth.module';
import { InvitationModule } from './invitation/invitation.module';
import { UsersModule } from './users/users.module';
import { AssignmentsModule } from './assignments/assignments.module';

@Module({
  imports: [PrismaModule, TrainingCoursesModule, ModulesModule, AuthModule, InvitationModule, UsersModule, AssignmentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
