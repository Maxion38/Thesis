import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { WorkController } from './work.controller';
import { WorkService } from './work.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: require('multer').memoryStorage(),
    }),
  ],
  controllers: [WorkController],
  providers: [WorkService, UsersService],
})
export class WorkSubmissionToolModule {}
