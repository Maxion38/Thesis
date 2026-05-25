import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrainingCourseDto } from './dto/create-training-course.dto';
import { UpdateTrainingCourseDto } from './dto/update-training-course.dto';
import { PrismaService } from '../prisma/prisma.service';
import { USER_WITH_ROLES } from 'src/users/includes/users.include';
import { toDtoUser } from 'src/users/mappers/user.mapper';

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


  async getAssignedUsers(trainingCourseId: number) {
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id: trainingCourseId },
      include: {
        projects: {
          include: {
            members: {
              include: {
                user: {
                  include: USER_WITH_ROLES,
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Training course not found');
    }

    const users = course.projects.flatMap(project =>
      project.members.map(member => member.user)
    );

    // remove duplicates
    const uniqueUsers = Array.from(
      new Map(users.map(u => [u.id, u])).values()
    );

    // DTO mapping (IMPORTANT)
    return uniqueUsers.map(toDtoUser);
  }


  async assignUsersToTrainingCourse(trainingCourseId: number, userIds: number[]) {
    return this.prisma.$transaction(async (tx) => {

      const course = await tx.trainingCourse.findUnique({
        where: { id: trainingCourseId }
      });

      if (!course) {
        throw new NotFoundException('Training course not found');
      }

      const users = await tx.user.findMany({
        where: {
          id: { in: userIds }
        }
      });

      if (users.length !== userIds.length) {
        throw new NotFoundException('One or more users not found');
      }

      const createdProjects = await Promise.all(
        users.map((user) =>
          tx.project.create({
            data: {
              title: `${user.firstname ?? user.surname} project`,
              trainingCourseId,
              members: {
                create: {
                  userId: user.id
                }
              }
            }
          })
        )
      );

      return createdProjects;
    });
  }


  async unassignUsersFromTrainingCourse(
    trainingCourseId: number,
    userIds: number[]
  ) {
    return this.prisma.$transaction(async (tx) => {

      const course = await tx.trainingCourse.findUnique({
        where: { id: trainingCourseId }
      });

      if (!course) {
        throw new NotFoundException('Training course not found');
      }

      const projects = await tx.project.findMany({
        where: {
          trainingCourseId,
          members: {
            some: {
              userId: { in: userIds }
            }
          }
        },
        include: {
          members: true
        }
      });

      // delete memberships
      await tx.projectMember.deleteMany({
        where: {
          userId: { in: userIds },
          project: {
            trainingCourseId
          }
        }
      });

      // delete empty projects
      const projectIds = projects.map(p => p.id);

      for (const project of projects) {
        const remainingMembers = await tx.projectMember.count({
          where: { projectId: project.id }
        });

        if (remainingMembers === 0) {
          await tx.project.delete({
            where: { id: project.id }
          });
        }
      }

      return { removedUserIds: userIds };
    });
  }
}
