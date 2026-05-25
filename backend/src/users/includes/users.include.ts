import { Prisma } from '@prisma/client';

export const USER_WITH_ROLES = {
  roles: {
    include: {
      role: true,
    },
  },
} satisfies Prisma.UserInclude;