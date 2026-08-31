import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkDto } from './dto/create-work.dto';
import { UpdateWorkDto } from './dto/update-work.dto';
import { RoleType, ToolType } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import path from 'path';
import * as fs from 'fs';
import { Response } from 'express';

@Injectable()
export class WorkService {
  constructor(
    private readonly prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async getWork(workId: number) {
    const work = await this.prisma.work.findUnique({
      where: { id: workId },
      include: { tool: true },
    });

    if (!work) {
      throw new NotFoundException(`Work with id ${workId} not found`);
    }

    return work;
  }

  async createWork(dto: CreateWorkDto) {
    const module = await this.prisma.module.findUnique({
      where: { id: dto.moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with id ${dto.moduleId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const tool = await tx.tool.create({
        data: {
          name: dto.name,
          description: dto.description,
          type: ToolType.WORK,
          moduleId: dto.moduleId,
        },
      });

      // V2 : Work partage sa PK avec Tool (héritage à clé partagée),
      // on ne passe donc plus toolId mais id = tool.id.
      const work = await tx.work.create({
        data: {
          id: tool.id,
          maxAttempts: dto.maxAttempts,
          ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
        },
      });

      return { tool, work };
    });
  }

  async updateWork(workId: number, dto: UpdateWorkDto) {
    const work = await this.prisma.work.findUnique({
      where: { id: workId },
      include: { tool: true },
    });

    if (!work) {
      throw new NotFoundException(`Work with id ${workId} not found`);
    }

    // Si moduleId changé, on vérifie que le nouveau module existe
    if (dto.moduleId && dto.moduleId !== work.tool.moduleId) {
      const module = await this.prisma.module.findUnique({
        where: { id: dto.moduleId },
      });

      if (!module) {
        throw new NotFoundException(`Module with id ${dto.moduleId} not found`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // work.id === work.tool.id (PK partagée) -> plus de work.toolId
      const updatedTool = await tx.tool.update({
        where: { id: work.id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description && { description: dto.description }),
          ...(dto.moduleId && { moduleId: dto.moduleId }),
        },
      });

      const updatedWork = await tx.work.update({
        where: { id: workId },
        data: {
          ...(dto.maxAttempts && { maxAttempts: dto.maxAttempts }),
          ...(dto.dueDate !== undefined && {
            dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          }),
        },
      });

      return { tool: updatedTool, work: updatedWork };
    });
  }

  async submitWork(
    workId: number,
    file: any,
    user: { userId: number; email: string; roles: string[] },
  ) {
    // CHECK work exist
    const work = await this.prisma.work.findUnique({
      where: { id: workId },
      include: { tool: true },
    });
    if (!work) throw new NotFoundException(`Work with id ${workId} not found`);

    // FETCH user for firstName and lastName
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
    });
    if (!dbUser)
      throw new NotFoundException(`User with id ${user.userId} not found`);

    // FETCH first project (in the futur : handle multiple projects)
    const project = await this.usersService.findFirstProject(user.userId);
    if (!project)
      throw new NotFoundException(`No project found for user ${user.userId}`);

    // COUNT number of attemps
    const attemptCount = await this.prisma.userWorkSubmission.count({
      where: { workId, userId: user.userId },
    });
    const attempt = attemptCount + 1;

    // BUILD filname and filepath
    const userName = `${dbUser.firstname ?? ''}_${dbUser.surname}`
      .trim()
      .replace(/\s+/g, '_');
    const workName = work.tool.name.replace(/\s+/g, '_');
    const ext = file.originalname.split('.').pop();
    const fileName = `${userName}_${workName}_attempt${attempt}.${ext}`;

    const storagePath = process.env.STORAGE_PATH ?? './storage';
    const dirPath = path.join(storagePath, 'work-submissions', userName);
    const filePath = path.join(dirPath, fileName);

    // SAVE file on disk
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(filePath, file.buffer);

    // UPDATE db table
    return this.prisma.userWorkSubmission.create({
      data: {
        fileName,
        filePath,
        workId,
        userId: user.userId,
        projectId: project.id,
      },
    });
  }

  async removeSubmission(submissionId: number, userId: number) {
    const submission = await this.prisma.userWorkSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} not found`);
    }

    if (submission.userId !== userId) {
      throw new ForbiddenException(
        `You are not allowed to delete this submission`,
      );
    }

    await this.prisma.userWorkSubmission.delete({
      where: { id: submissionId },
    });

    const absolutePath = path.resolve(submission.filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }

  async getLatestSubmission(workId: number, userId: number) {
    return this.prisma.userWorkSubmission.findFirst({
      where: { workId, userId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getSubmissionFile(
    submissionId: number,
    user: { userId: number; roles: string[] },
    res: Response,
  ) {
    const submission = await this.prisma.userWorkSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission)
      throw new NotFoundException(`Submission ${submissionId} not found`);

    const isOwner = submission.userId === user.userId;
    const isReviewer =
      user.roles.includes(RoleType.TEACHER) ||
      user.roles.includes(RoleType.COORDINATOR);

    if (!isOwner && !isReviewer) {
      throw new ForbiddenException(
        `You are not allowed to access this submission`,
      );
    }

    const absolutePath = path.resolve(submission.filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException(`File not found on disk`);
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${submission.fileName}"`,
    );
    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(absolutePath).pipe(res);
  }

  async getUserSubmissions(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return this.prisma.userWorkSubmission.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      include: {
        work: {
          include: { tool: true },
        },
      },
    });
  }
}
