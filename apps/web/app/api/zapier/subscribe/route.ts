import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import z from "@/lib/zod";
import { NextResponse } from "next/server";

const subscribeSchema = z.object({
  url: z.string(),
});

export const POST = withWorkspace(async ({ workspace, req }) => {
  const { url } = subscribeSchema.parse(await parseRequestBody(req));

  // Create a new Zapier hook for the workspace
  const hook = await prisma.zapierHook.create({
    data: {
      projectId: workspace.id,
      url,
    },
  });

  // Enable the hook on the workspace
  if (hook) {
    await prisma.project.update({
      where: {
        id: workspace.id,
      },
      data: {
        zapierHookEnabled: true,
      },
    });
  }

  console.info(`[Zapier] Workspace ${workspace.id} subscribed to ${hook}`);

  return NextResponse.json({ id: hook.id }, { status: 201 });
});
