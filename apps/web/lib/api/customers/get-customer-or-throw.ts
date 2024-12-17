import { prisma } from "@dub/prisma";
import { DubApiError } from "../errors";

export const getCustomerOrThrow = async ({
  id,
  workspaceId,
}: {
  id: string;
  workspaceId: string;
}) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer || customer.projectId !== workspaceId) {
    throw new DubApiError({
      code: "not_found",
      message: "Customer not found.",
    });
  }

  if (!customer.avatar) {
    customer.avatar = `https://api.dicebear.com/9.x/notionists/png?seed=${customer.id}`;
  }

  return customer;
};
