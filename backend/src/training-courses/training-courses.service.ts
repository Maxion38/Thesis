import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrainingCourseDto } from './dto/create-training-course.dto';
import { UpdateTrainingCourseDto } from './dto/update-training-course.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainingCoursesService {
  constructor(private prisma: PrismaService) {}

  create(createTrainingCourseDto: CreateTrainingCourseDto) {
    return this.prisma.trainingCourse.create({
      data: createTrainingCourseDto
    });
  }

  findAll() {
    return this.prisma.trainingCourse.findMany();
  }

  async findOne(id: number) {
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException(`TrainingCourse ${id} not found`);
    }

    return course;
  }

  update(id: number, updateTrainingCourseDto: UpdateTrainingCourseDto) {
    return this.prisma.trainingCourse.update({
      where: {id},
      data: updateTrainingCourseDto,
    });
  }

  async remove(id: number) {
    try {
      return await this.prisma.trainingCourse.delete({
        where: { id }
      });
    } catch {
      throw new NotFoundException(`TrainingCourse ${id} not found`);
    }
  }
}
