import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import { uninstallSlackIntegration } from "@/lib/integrations/slack/uninstall";
import { prisma } from "@dub/prisma";
import { SLACK_INTEGRATION_ID } from "@dub/utils";
import { NextResponse } from "next/server";

// DELETE /api/integrations/uninstall - uninstall an installation by id
export const DELETE = withWorkspace(
  async ({ searchParams, session, workspace }) => {
    const { installationId } = searchParams;

    const installation = await prisma.installedIntegration.findUnique({
      where: {
        id: installationId,
        projectId: workspace.id,
      },
    });

    if (!installation) {
      throw new DubApiError({
        code: "not_found",
        message: "Integration not found",
      });
    }

    if (installation.userId !== session.user.id) {
      throw new DubApiError({
        code: "unauthorized",
        message:
          "You are not authorized to uninstall this integration. Only the user who installed it can uninstall it.",
      });
    }

    const { integration } = await prisma.installedIntegration.delete({
      where: {
        id: installationId,
      },
      select: {
        integration: {
          select: {
            id: true,
          },
        },
      },
    });

    if (integration.id === SLACK_INTEGRATION_ID) {
      await uninstallSlackIntegration({
        installation,
      });
    }

    return NextResponse.json({ id: installationId });
  },
  {
    requiredPermissions: ["integrations.write"],
  },
);
