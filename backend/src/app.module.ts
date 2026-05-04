import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TrainingCoursesModule } from './training-courses/training-courses.module';
import { ModulesModule } from './modules/modules.module';

@Module({
  imports: [PrismaModule, TrainingCoursesModule, ModulesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
