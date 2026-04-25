import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.module.findMany();
  }

  create(data: { name: string }) {
    return this.prisma.module.create({
      data,
    });
  }
}