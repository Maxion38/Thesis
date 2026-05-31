import { Prisma } from '@prisma/client';
import { ModuleToolGroupDto } from './dto/module-overview.dto';

export function buildToolsInclude(userId: number, projectId: number) {
  return {
    tools: {
      include: {
        forms: {
          include: {
            submissions: {
              where: { userId, projectId },
              orderBy: { submittedAt: 'desc' as const },
            },
          },
        },
        works: {
          include: {
            userWorkSubmissions: {
              where: { userId, projectId },
              orderBy: { submittedAt: 'desc' as const },
            },
          },
        },
        activities: true,
        assessmentGrids: {
          include: {
            gridVersions: {
              include: {
                feedbacks: {
                  where: { userId, projectId },
                  orderBy: { createdAt: 'desc' as const },
                },
              },
            },
          },
        },
      },
    },
  } satisfies Prisma.ModuleInclude;
}

export type ToolWithRelations = Prisma.ToolGetPayload<
  ReturnType<typeof buildToolsInclude>['tools']
>;

export function resolveToolGroup(tool: ToolWithRelations): ModuleToolGroupDto {
  let state: 'UNTOUCHED' | 'SUBMITTED' | 'CORRECTED' = 'UNTOUCHED';
  let date: Date | undefined;

  switch (tool.type) {

    case 'WORK': {
      const submissions = tool.works
        .flatMap(w => w.userWorkSubmissions)
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

      if (submissions.length > 0) {
        state = 'SUBMITTED';
        date = submissions[0].submittedAt;
      } else {
        date = tool.createdAt;
      }
      break;
    }

    case 'FORM': {
      const submissions = tool.forms
        .flatMap(f => f.submissions)
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

      if (submissions.length > 0) {
        state = 'SUBMITTED';
        date = submissions[0].submittedAt;
      } else {
        date = tool.createdAt;
      }
      break;
    }

    case 'ACTIVITY': {
      date = tool.activities[0]?.startDateTime ?? tool.createdAt;
      break;
    }

    case 'ASSESSMENT': {
      const feedbacks = tool.assessmentGrids
        .flatMap(g => g.gridVersions)
        .flatMap(v => v.feedbacks)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (feedbacks.length > 0) {
        state = 'CORRECTED';
        date = feedbacks[0].createdAt;
      } else {
        date = tool.createdAt;
      }
      break;
    }
  }

  return {
    id: tool.id,
    label: tool.name,
    type: tool.type,
    state,
    date,
  };
}