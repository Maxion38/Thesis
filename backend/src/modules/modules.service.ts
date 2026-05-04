import { Injectable } from '@nestjs/common';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}
  
  create(createModuleDto: CreateModuleDto) {
    return 'This action adds a new module';
  }

  findAll() {
    return this.prisma.module.findMany();
  }

  findAllForTrainingCourse(trainingCourseId: number) {
    return this.prisma.module.findMany({
      where: {
        trainingCourseId: trainingCourseId
      }
    })
  }

  findOne(id: number) {
    return this.prisma.module.findUnique({
      where: {
        id: id
      }
    });
  }

  update(id: number, updateModuleDto: UpdateModuleDto) {
    return `This action updates a #${id} module`;
  }

  remove(id: number) {
    return `This action removes a #${id} module`;
  }
}
