import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { USER_WITH_ROLES } from 'src/users/includes/users.include';
import { toDtoUser } from 'src/users/mappers/user.mapper';
import { RoleType } from '@prisma/client';
import { extractRoles } from './helpers/roles.helper';
import { UserDto } from 'src/users/dto/user.dto';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async getAssignedUsers(trainingCourseId: number): Promise<UserDto[]> {
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

    const users = course.projects.flatMap((p) => p.members.map((m) => m.user));

    const uniqueUsers = Array.from(
      new Map(users.map((u) => [u.id, u])).values(),
    );

    return uniqueUsers.map(toDtoUser);
  }

  async getAssignableUsers(trainingCourseId: number): Promise<UserDto[]> {
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

    const assignedUsers = course.projects.flatMap((project) =>
      project.members.map((member) => member.user),
    );

    const assignedUserIds = new Set(assignedUsers.map((user) => user.id));

    const allUsers = await this.prisma.user.findMany({
      include: USER_WITH_ROLES,
    });

    const result: UserDto[] = [];

    for (const user of allUsers) {
      if (assignedUserIds.has(user.id)) {
        continue;
      }

      const userDto = toDtoUser(user);
      const roles = extractRoles(user);

      for (const role of roles) {
        if (role === RoleType.COORDINATOR) {
          continue;
        }

        result.push({
          ...userDto,
          roles: [role],
        });
      }
    }

    return result;
  }

  async assignUsersToTrainingCourse(
    trainingCourseId: number,
    userIds: number[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.trainingCourse.findUnique({
        where: { id: trainingCourseId },
      });

      if (!course) {
        throw new NotFoundException('Training course not found');
      }

      const users = await tx.user.findMany({
        where: {
          id: { in: userIds },
        },
      });

      if (users.length !== userIds.length) {
        throw new NotFoundException('One or more users not found');
      }

      const alreadyAssigned = await tx.projectMember.findMany({
        where: {
          userId: { in: userIds },
          project: {
            trainingCourseId,
          },
        },
        select: {
          userId: true,
        },
      });

      const alreadyAssignedIds = new Set(alreadyAssigned.map((x) => x.userId));

      const filteredUsers = users.filter((u) => !alreadyAssignedIds.has(u.id));

      const createdProjects = await Promise.all(
        filteredUsers.map((user) =>
          tx.project.create({
            data: {
              title: `${user.firstname ?? user.surname} project`,
              trainingCourseId,
              members: {
                create: {
                  userId: user.id,
                },
              },
            },
          }),
        ),
      );

      return {
        created: filteredUsers.length,
        skipped: alreadyAssignedIds.size,
      };
    });
  }

  async unassignUsersFromTrainingCourse(
    trainingCourseId: number,
    userIds: number[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.trainingCourse.findUnique({
        where: { id: trainingCourseId },
      });

      if (!course) {
        throw new NotFoundException('Training course not found');
      }

      // find actual memberships
      const existingMemberships = await tx.projectMember.findMany({
        where: {
          userId: { in: userIds },
          project: {
            trainingCourseId,
          },
        },
        select: {
          userId: true,
        },
      });

      const existingIds = existingMemberships.map((m) => m.userId);

      if (existingIds.length === 0) {
        return {
          removedUserIds: [],
          message: 'No matching assignments found',
        };
      }

      // delete only existing
      await tx.projectMember.deleteMany({
        where: {
          userId: { in: existingIds },
          project: {
            trainingCourseId,
          },
        },
      });

      // cleanup empty projects
      const affectedProjects = await tx.project.findMany({
        where: {
          trainingCourseId,
        },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      await Promise.all(
        affectedProjects
          .filter((p) => p._count.members === 0)
          .map((p) =>
            tx.project.delete({
              where: { id: p.id },
            }),
          ),
      );

      return {
        removedUserIds: existingIds,
      };
    });
  }
}
