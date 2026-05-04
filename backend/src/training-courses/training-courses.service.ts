import { Injectable } from '@nestjs/common';
import { CreateTrainingCourseDto } from './dto/create-training-course.dto';
import { UpdateTrainingCourseDto } from './dto/update-training-course.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainingCoursesService {
  constructor(private prisma: PrismaService) {}

  create(createTrainingCourseDto: CreateTrainingCourseDto) {
    return 'This action adds a new trainingCourse';
  }

  findAll() {
    return this.prisma.trainingCourse.findMany();
  }

  findOne(id: number) {
    return this.prisma.trainingCourse.findUnique({
      where: {id} 
    });
  }

  update(id: number, updateTrainingCourseDto: UpdateTrainingCourseDto) {
    return this.prisma.trainingCourse.update({
      where: {id},
      data: updateTrainingCourseDto,
    });
  }

  remove(id: number) {
    return `This action removes a #${id} trainingCourse`;
  }
}
