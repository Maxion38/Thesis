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


  async findAllWithRelatedInfos() {
    const trainingCourses = await this.prisma.trainingCourse.findMany({
      include: {
        projects: {
          include: {
            members: true,
          },
        },
      },
    });

    return trainingCourses.map(course => {
      const studentsCount = new Set(
        course.projects.flatMap(project =>
          project.members.map(member => member.userId)
        )
      ).size;

      const teachersCount = new Set(
        course.projects
          .map(project => project.supervisorId)
          .filter(id => id !== null)
      ).size;

      return {
        ...course,
        studentsCount,
        teachersCount,
      };
    });
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
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id }
    });

    if (!course) {
      throw new NotFoundException(`TrainingCourse ${id} not found`);
    }

    return this.prisma.trainingCourse.delete({
      where: { id }
    });
  }
}
