import { prisma } from "@/lib/prisma";

import "dotenv-flow/config";

async function main() {
  const workspaceUsers = await prisma.projectUsers.findMany({
    where: {
      user: {
        isMachine: false,
      },
    },
    select: {
      id: true,
    },
    take: 500,
    skip: 0,
  });

  if (!workspaceUsers) {
    return;
  }

  const result = await prisma.notificationPreference.createMany({
    data: workspaceUsers.map((workspaceUser) => {
      return {
        projectUserId: workspaceUser.id,
      };
    }),
  });

  console.log(
    "Created notification preferences for",
    result.count,
    "workspace users",
  );
}

main();
