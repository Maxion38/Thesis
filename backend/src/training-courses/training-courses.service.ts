import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrainingCourseDto } from './dto/create-training-course.dto';
import { UpdateTrainingCourseDto } from './dto/update-training-course.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RoleType } from '@prisma/client';
import { isTrainingCourseActive } from './training-course-status.util';

@Injectable()
export class TrainingCoursesService {
  constructor(private prisma: PrismaService) {}

  create(createTrainingCourseDto: CreateTrainingCourseDto) {
    return this.prisma.trainingCourse.create({
      data: createTrainingCourseDto,
    });
  }

  findAll() {
    return this.prisma.trainingCourse.findMany();
  }

  async findMyActiveCourses(userId: number) {
    const courses = await this.prisma.trainingCourse.findMany({
      where: { projects: { some: { members: { some: { userId } } } } },
      orderBy: { name: 'asc' },
    });

    return courses.filter(isTrainingCourseActive);
  }

  async findAllWithRelatedInfos() {
    // V2 : Project n'a plus de supervisorId. Le "rapporteur" est un
    // ProjectMember comme les étudiants — on distingue
    // donc étudiants/enseignants via le rôle global de l'utilisateur
    // (User.roles), et le rapporteur via son sous-rôle ProjectMember.
    const trainingCourses = await this.prisma.trainingCourse.findMany({
      include: {
        projects: {
          include: {
            members: {
              include: {
                user: {
                  include: {
                    roles: {
                      include: { role: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return trainingCourses.map((course) => {
      const allMembers = course.projects.flatMap((project) => project.members);

      const studentsCount = new Set(
        allMembers
          .filter((m) =>
            m.user.roles.some((r) => r.role.role === RoleType.STUDENT),
          )
          .map((m) => m.userId),
      ).size;

      const teachersCount = new Set(
        allMembers
          .filter((m) =>
            m.user.roles.some((r) => r.role.role === RoleType.TEACHER),
          )
          .map((m) => m.userId),
      ).size;

      const usersCount = new Set(allMembers.map((m) => m.userId)).size;

      const { projects, ...courseWithoutProjects } = course;

      return {
        ...courseWithoutProjects,
        studentsCount,
        teachersCount,
        usersCount,
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
      where: { id },
      data: updateTrainingCourseDto,
    });
  }

  async remove(id: number) {
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException(`TrainingCourse ${id} not found`);
    }

    return this.prisma.trainingCourse.delete({
      where: { id },
    });
  }
}
