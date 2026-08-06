import { PrismaClient, RoleType, SubRoleType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.role.createMany({
    data: [
      { role: RoleType.STUDENT },
      { role: RoleType.TEACHER },
      { role: RoleType.COORDINATOR },
      { role: RoleType.EXTERNAL },
    ],
    skipDuplicates: true,
  });

  await prisma.subRole.createMany({
    data: [
      { subRole: SubRoleType.SUPERVISOR },
      { subRole: SubRoleType.PRESIDENT },
      { subRole: SubRoleType.READER },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });