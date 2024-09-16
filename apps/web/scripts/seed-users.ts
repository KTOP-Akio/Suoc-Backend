import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import "dotenv-flow/config";

async function main() {
  const users = [
    {
      name: "John Doe",
      email: "john@dub.co",
      passwordHash: await hashPassword("password"),
    },
    {
      name: "Jane Doe",
      email: "jane@dub.co",
      passwordHash: await hashPassword("password"),
    },
    {
      name: "Mark Zuckerberg",
      email: "mark@dub.com",
      passwordHash: await hashPassword("password"),
    },
  ];

  const workspaceId = "cm0qj8ubt0003wyjecxgfr28m";

  // Create users
  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  const createdUsers = await prisma.user.findMany({
    where: {
      email: {
        in: users.map((user) => user.email),
      },
    },
  });

  // Find the workspace
  const workspace = await prisma.project.findUniqueOrThrow({
    where: {
      id: workspaceId,
    },
  });

  // Add users to workspace
  await prisma.projectUsers.createMany({
    data: createdUsers.map((user) => ({
      userId: user.id,
      projectId: workspaceId,
    })),
  });
}

main();
