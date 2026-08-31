import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { toDtoUser } from './mappers/user.mapper';
import { USER_WITH_ROLES } from './includes/users.include';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(trainingCourseId?: number) {
    const users = await this.prisma.user.findMany({
      where: trainingCourseId
        ? { projectMemberships: { some: { project: { trainingCourseId } } } }
        : undefined,
      include: USER_WITH_ROLES,
    });

    return users.map((user) => toDtoUser(user));
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findFirstProject(userId: number, trainingCourseId?: number) {
    return await this.prisma.project.findFirst({
      where: {
        members: {
          some: {
            userId,
          },
        },
        ...(trainingCourseId ? { trainingCourseId } : {}),
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
