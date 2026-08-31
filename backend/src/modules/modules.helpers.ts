import { Prisma, GridFeedbackStatus } from '@prisma/client';
import { ModuleToolGroupDto } from './dto/module-overview.dto';

export function buildToolsInclude(userId: number, projectId: number) {
  return {
    tools: {
      include: {
        // V2 : Form / Work / Activity / AssessmentGrid sont chacun en
        // relation 1-1 avec Tool (héritage à clé partagée) — un Tool =
        // une définition unique posée par la coordination. Les occurrences
        // multiples (plusieurs réunions, plusieurs soutenances) sont
        // modélisées comme autant de Tools distincts, pas comme plusieurs
        // lignes Activity sous un même Tool.
        form: {
          include: {
            submissions: {
              where: { userId, projectId },
              orderBy: { submittedAt: 'desc' as const },
            },
          },
        },
        work: {
          include: {
            submissions: {
              where: { userId, projectId },
              orderBy: { submittedAt: 'desc' as const },
            },
          },
        },
        activity: true,
        assessmentGrid: {
          include: {
            feedbacks: {
              where: { projectId },
              orderBy: { createdAt: 'desc' as const },
            },
          },
        },
        linksAsSource: { select: { targetToolId: true } },
        linksAsTarget: { select: { sourceToolId: true } },
      },
    },
  } satisfies Prisma.ModuleInclude;
}

export type ToolWithRelations = Prisma.ToolGetPayload<
  ReturnType<typeof buildToolsInclude>['tools']
>;

export function resolveToolGroup(tool: ToolWithRelations): ModuleToolGroupDto {
  let state: 'UNTOUCHED' | 'SUBMITTED' | 'CORRECTED' | GridFeedbackStatus =
    'UNTOUCHED';
  let date: Date | undefined;

  switch (tool.type) {
    case 'WORK': {
      const submissions = [...(tool.work?.submissions ?? [])].sort(
        (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
      );

      if (submissions.length > 0) {
        state = 'SUBMITTED';
        date = submissions[0].submittedAt;
      } else {
        date = tool.work?.dueDate ?? undefined;
      }
      break;
    }

    case 'FORM': {
      const submissions = [...(tool.form?.submissions ?? [])].sort(
        (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
      );

      if (submissions.length > 0) {
        state = 'SUBMITTED';
        date = submissions[0].submittedAt;
      } else {
        date = tool.form?.dueDate ?? undefined;
      }
      break;
    }

    case 'ACTIVITY': {
      date = tool.activity?.startDateTime ?? tool.createdAt;
      break;
    }

    case 'ASSESSMENT': {
      const feedbacks = [...(tool.assessmentGrid?.feedbacks ?? [])].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const feedback = feedbacks[0];
      state = feedback?.status ?? GridFeedbackStatus.PENDING;
      date = feedback?.createdAt ?? tool.createdAt;
      break;
    }
  }

  const linkedToolId =
    tool.linksAsSource?.[0]?.targetToolId ??
    tool.linksAsTarget?.[0]?.sourceToolId ??
    undefined;

  return {
    id: tool.id,
    label: tool.name,
    type: tool.type,
    state,
    date,
    linkedToolId,
  };
}
