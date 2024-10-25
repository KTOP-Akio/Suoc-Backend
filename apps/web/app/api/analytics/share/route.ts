import { getLinkOrThrow } from "@/lib/api/links/get-link-or-throw";
import { createId } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { domainKeySchema } from "@/lib/zod/schemas/links";
import { NextResponse } from "next/server";

// GET /api/analytics/share – get a shared dashboard for a link
export const GET = withWorkspace(async ({ searchParams, workspace }) => {
  const { domain, key } = domainKeySchema.parse(searchParams);

  const link = await getLinkOrThrow({
    workspace,
    domain,
    key,
  });

  const sharedDashboard = await prisma.sharedDashboard.findUnique({
    where: { linkId: link.id },
  });

  return NextResponse.json(sharedDashboard);
});

// POST /api/analytics/share – create a shared dashboard for a link
export const POST = withWorkspace(
  async ({ searchParams, workspace }) => {
    const { domain, key } = domainKeySchema.parse(searchParams);

    const link = await getLinkOrThrow({
      workspace,
      domain,
      key,
    });

    const response = await prisma.sharedDashboard.create({
      data: {
        id: createId({ prefix: "dsh_" }),
        link: { connect: { id: link.id } },
        project: { connect: { id: workspace.id } },
        showConversions: workspace.conversionEnabled,
      },
    });

    return NextResponse.json(response);
  },
  {
    requiredPermissions: ["links.write"],
  },
);
