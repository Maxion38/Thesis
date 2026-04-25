import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ModulesModule } from './modules/modules.module';

@Module({
  imports: [PrismaModule, ModulesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
