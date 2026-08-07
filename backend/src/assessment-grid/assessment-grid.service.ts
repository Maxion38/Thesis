import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleType, ToolType } from '@prisma/client';
import { CriteriaDto, StudentWithGridsDto, GridSummaryDto } from './dto/assessment-grid.dto';

@Injectable()
export class AssessmentGridService {
  constructor(private prisma: PrismaService) {}

  async getStudentsWithAssessmentsId(): Promise<StudentWithGridsDto[]> {
    const students = await this.prisma.user.findMany({
      where: { roles: { some: { role: { role: RoleType.STUDENT } } } },
      select: {
        id: true,
        firstname: true,
        surname: true,
        projectMemberships: {
          select: {
            project: {
              select: {
                trainingCourse: {
                  select: {
                    modules: {
                      select: {
                        tools: {
                          where: { type: ToolType.ASSESSMENT },
                          // id du Tool == id de l'AssessmentGrid (PK partagée)
                          select: { id: true, name: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return students.map((student) => {
      const grids = new Map<number, GridSummaryDto>();
      for (const pm of student.projectMemberships) {
        for (const m of pm.project.trainingCourse.modules) {
          for (const t of m.tools) {
            grids.set(t.id, { id: t.id, name: t.name });
          }
        }
      }

      return {
        id: student.id,
        firstname: student.firstname,
        surname: student.surname,
        grids: Array.from(grids.values()),
      };
    });
  }

  async getAssessmentGrid(gridId: number): Promise<CriteriaDto[]> {
    const grid = await this.prisma.assessmentGrid.findUnique({
      where: { id: gridId },
      select: {
        criterias: {
          orderBy: { order: 'asc' },
          select: {
            name: true,
            order: true,
            defaultWeight: true,
            cells: {
              orderBy: { order: 'asc' },
              select: {
                description: true,
                order: true,
                weight: true,
              },
            },
          },
        },
      },
    });

    if (!grid) {
      throw new NotFoundException(`AssessmentGrid ${gridId} not found`);
    }

    return grid.criterias.map((criteria) => ({
      name: criteria.name,
      order: criteria.order,
      defaultWeight: criteria.defaultWeight,
      cells: criteria.cells.map((cell) => ({
        description: cell.description,
        order: cell.order,
        // weight est un Decimal Prisma -> number pour matcher CellDto
        weight: cell.weight === null ? null : Number(cell.weight),
      })),
    }));
  }
}