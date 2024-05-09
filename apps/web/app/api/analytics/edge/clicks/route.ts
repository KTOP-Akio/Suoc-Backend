import { getClicks, validDateRangeForPlan } from "@/lib/analytics";
import {
  DubApiError,
  exceededLimitError,
  handleAndReturnErrorResponse,
} from "@/lib/api/errors";
import { getDomainOrLink, getWorkspaceViaEdge } from "@/lib/planetscale";
import { ratelimit } from "@/lib/upstash";
import { clickAnalyticsQuerySchema } from "@/lib/zod/schemas";
import { DUB_DEMO_LINKS, DUB_WORKSPACE_ID, getSearchParams } from "@dub/utils";
import { ipAddress } from "@vercel/edge";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "edge";

export const GET = async (
  req: NextRequest,
  { params }: { params: Record<string, string> },
) => {
  try {
    let { groupBy: oldGroupBy } = clickAnalyticsQuerySchema.parse(params);

    const searchParams = getSearchParams(req.url);
    const parsedParams = clickAnalyticsQuerySchema.parse(searchParams);

    let { groupBy, domain, key, interval } = parsedParams;

    let link;

    const demoLink = DUB_DEMO_LINKS.find(
      (l) => l.domain === domain && l.key === key,
    );

    // if it's a demo link
    if (demoLink) {
      // Rate limit in production
      if (process.env.NODE_ENV !== "development") {
        const ip = ipAddress(req);
        const { success } = await ratelimit(15, groupBy ? "1 m" : "10 s").limit(
          `demo-analytics:${demoLink.id}:${ip}:${groupBy}`,
        );

        if (!success) {
          throw new DubApiError({
            code: "rate_limit_exceeded",
            message: "Don't DDoS me pls 🥺",
          });
        }
      }
      link = {
        id: demoLink.id,
        projectId: DUB_WORKSPACE_ID,
      };
    } else if (domain) {
      link = await getDomainOrLink({ domain, key });
      // if the link is explicitly private (publicStats === false)
      if (!link?.publicStats) {
        throw new DubApiError({
          code: "forbidden",
          message: "Analytics for this link are not public",
        });
      }
      const workspace =
        link?.projectId && (await getWorkspaceViaEdge(link.projectId));

      validDateRangeForPlan({
        plan: workspace.plan,
        interval,
        throwError: true,
      });

      if (workspace && workspace.usage > workspace.usageLimit) {
        throw new DubApiError({
          code: "forbidden",
          message: exceededLimitError({
            plan: workspace.plan,
            limit: workspace.usageLimit,
            type: "clicks",
          }),
        });
      }
    }

    const response = await getClicks({
      ...parsedParams,
      // workspaceId can be undefined (for public links that haven't been claimed/synced to a workspace)
      ...(link.projectId && { workspaceId: link.projectId }),
      groupBy: groupBy || oldGroupBy,
      linkId: link.id,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleAndReturnErrorResponse(error);
  }
};
