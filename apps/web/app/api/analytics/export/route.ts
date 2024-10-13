import { VALID_ANALYTICS_ENDPOINTS } from "@/lib/analytics/constants";
import { getAnalytics } from "@/lib/analytics/get-analytics";
import { convertToCSV, validDateRangeForPlan } from "@/lib/analytics/utils";
import { getDomainOrThrow } from "@/lib/api/domains/get-domain-or-throw";
import { getLinkOrThrow } from "@/lib/api/links/get-link-or-throw";
import { throwIfClicksUsageExceeded } from "@/lib/api/links/usage-checks";
import { withWorkspace } from "@/lib/auth";
import { getFolders } from "@/lib/folder/get-folders";
import { checkFolderPermission } from "@/lib/folder/permissions";
import { analyticsQuerySchema } from "@/lib/zod/schemas/analytics";
import { Link } from "@prisma/client";
import JSZip from "jszip";

// GET /api/analytics/export – get export data for analytics
export const GET = withWorkspace(
  async ({ searchParams, workspace, session }) => {
    throwIfClicksUsageExceeded(workspace);

    const parsedParams = analyticsQuerySchema.parse(searchParams);

    const { interval, start, end, linkId, externalId, domain, key, folderId } =
      parsedParams;

    let link: Link | null = null;

    if (domain) {
      await getDomainOrThrow({ workspace, domain });
    }

    if (linkId || externalId || (domain && key)) {
      link = await getLinkOrThrow({
        workspace: workspace,
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
      interval,
      start,
      end,
      throwError: true,
    });

    const zip = new JSZip();

    await Promise.all(
      VALID_ANALYTICS_ENDPOINTS.map(async (endpoint) => {
        // no need to fetch top links data if there's a link specified
        // since this is just a single link
        if (endpoint === "top_links" && link) return;
        // we're not fetching top URLs data if there's no link specified
        if (endpoint === "top_urls" && !link) return;
        // skip clicks count
        if (endpoint === "count") return;

        const response = await getAnalytics({
          ...parsedParams,
          workspaceId: workspace.id,
          ...(link && { linkId: link.id }),
          event: "clicks",
          groupBy: endpoint,
          allowedFolderIds: folders.map((folder) => folder.id),
        });

        if (!response || response.length === 0) return;

        const csvData = convertToCSV(response);
        zip.file(`${endpoint}.csv`, csvData);
      }),
    );

    const zipData = await zip.generateAsync({ type: "nodebuffer" });

    return new Response(zipData, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=analytics_export.zip",
      },
    });
  },
  {
    requiredPermissions: ["analytics.read"],
  },
);
