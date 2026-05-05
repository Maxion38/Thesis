import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}
  
  create(createModuleDto: CreateModuleDto) {
    return this.prisma.module.create({
      data: createModuleDto
    });
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
    return this.prisma.module.update({
      where: {id},
      data: updateModuleDto,
    });
  }

  async remove(id: number) {
    try {
      return await this.prisma.module.delete({
        where: { id }
      });
    } catch {
      throw new NotFoundException(`Module ${id} not found`);
    }
  }
}
