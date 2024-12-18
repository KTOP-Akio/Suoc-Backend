import { getEvents } from "@/lib/analytics/get-events";
import { validDateRangeForPlan } from "@/lib/analytics/utils";
import { getDomainOrThrow } from "@/lib/api/domains/get-domain-or-throw";
import { getLinkOrThrow } from "@/lib/api/links/get-link-or-throw";
import { throwIfClicksUsageExceeded } from "@/lib/api/links/usage-checks";
import { withWorkspace } from "@/lib/auth";
import { getFolders } from "@/lib/folder/get-folders";
import { checkFolderPermission } from "@/lib/folder/permissions";
import { eventsQuerySchema } from "@/lib/zod/schemas/analytics";
import { Link } from "@dub/prisma/client";
import { NextResponse } from "next/server";

export const GET = withWorkspace(
  async ({ searchParams, workspace, session }) => {
    throwIfClicksUsageExceeded(workspace);

    const parsedParams = eventsQuerySchema.parse(searchParams);

    let {
      event,
      interval,
      start,
      end,
      linkId,
      externalId,
      domain,
      key,
      folderId,
    } = parsedParams;

    let link: Link | null = null;

    if (domain) {
      await getDomainOrThrow({ workspace, domain });
    }

    if (linkId || externalId || (domain && key)) {
      link = await getLinkOrThrow({
        workspaceId: workspace.id,
        linkId,
        externalId,
        domain,
        key,
      });
    }

    if (link && link.folderId) {
      await checkFolderPermission({
        folderId: link.folderId,
        workspaceId: workspace.id,
        userId: session.user.id,
        requiredPermission: "folders.read",
      });
    }

    if (folderId) {
      await checkFolderPermission({
        workspaceId: workspace.id,
        userId: session.user.id,
        folderId,
        requiredPermission: "folders.read",
      });
    }

    const folders = await getFolders({
      workspaceId: workspace.id,
      userId: session.user.id,
    });

    validDateRangeForPlan({
      plan: workspace.plan,
      conversionEnabled: workspace.conversionEnabled,
      interval,
      start,
      end,
      throwError: true,
    });

    const response = await getEvents({
      ...parsedParams,
      event,
      ...(link && { linkId: link.id }),
      workspaceId: workspace.id,
      allowedFolderIds: folders.map((folder) => folder.id),
    });

    return NextResponse.json(response);
  },
  {
    requiredPlan: [
      "business",
      "business plus",
      "business extra",
      "business max",
      "enterprise",
    ],
    requiredPermissions: ["analytics.read"],
  },
);
