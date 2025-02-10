import { getAnalytics } from "@/lib/analytics/get-analytics";
import { getStartEndDates } from "@/lib/analytics/utils/get-start-end-dates";
import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import { sqlGranularityMap } from "@/lib/planetscale/granularity";
import { partnerAnalyticsQuerySchema } from "@/lib/zod/schemas/partners";
import { prisma } from "@dub/prisma";
import { format } from "date-fns";
import { NextResponse } from "next/server";

// TODO:
// - When interval=all we might not even need to pull from tinybird (get the aggregated data from planetscale)

// GET /api/partners/analytics – get analytics for a partner
export const GET = withWorkspace(async ({ workspace, searchParams }) => {
  const {
    groupBy,
    programId,
    partnerId,
    tenantId,
    interval,
    start,
    end,
    timezone,
  } = partnerAnalyticsQuerySchema.parse(searchParams);

  if (!programId) {
    throw new DubApiError({
      code: "bad_request",
      message:
        "Program ID not found. Did you forget to include a `programId` query parameter?",
    });
  }

  if (!partnerId && !tenantId) {
    throw new DubApiError({
      code: "bad_request",
      message: "You must provide a partnerId or tenantId.",
    });
  }

  const programEnrollment = await prisma.programEnrollment.findUniqueOrThrow({
    where: partnerId
      ? {
          partnerId_programId: {
            partnerId,
            programId,
          },
        }
      : {
          tenantId_programId: {
            tenantId: tenantId!,
            programId,
          },
        },
    include: {
      program: true,
    },
  });

  if (programEnrollment.program.workspaceId !== workspace.id) {
    throw new DubApiError({
      code: "not_found",
      message: "Program not found.",
    });
  }

  const analytics = await getAnalytics({
    programId,
    partnerId,
    tenantId,
    groupBy,
    interval,
    start,
    end,
    timezone,
    event: "composite",
  });

  const { startDate, endDate, granularity } = getStartEndDates({
    interval,
    start,
    end,
  });

  // Group by count
  if (groupBy === "count") {
    const earnings = await prisma.commission.aggregate({
      _sum: {
        earnings: true,
      },
      where: {
        programId: programEnrollment.programId,
        partnerId: programEnrollment.partnerId,
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    return NextResponse.json({
      ...analytics,
      earnings: earnings._sum.earnings || 0,
    });
  }

  const { dateFormat } = sqlGranularityMap[granularity];

  // Group by timeseries
  if (groupBy === "timeseries") {
    const earnings = await prisma.$queryRaw<
      { start: string; earnings: number }[]
    >`
    SELECT 
      DATE_FORMAT(CONVERT_TZ(createdAt, '+00:00', ${timezone || "+00:00"}),  ${dateFormat}) AS start, 
      SUM(earnings) AS earnings
    FROM Commission
    WHERE 
      createdAt >= ${startDate}
      AND createdAt < ${endDate}
      AND programId = ${programEnrollment.programId}
      AND partnerId = ${programEnrollment.partnerId}
    GROUP BY start
    ORDER BY start ASC;`;

    const earningsLookup = Object.fromEntries(
      earnings.map((item) => [
        format(
          new Date(item.start),
          granularity === "hour" ? "yyyy-MM-dd'T'HH:00" : "yyyy-MM-dd'T'00:00",
        ),
        {
          earnings: item.earnings,
        },
      ]),
    );

    const analyticsWithRevenue = analytics.map((item) => {
      const formattedDateTime = format(
        new Date(item.start),
        granularity === "hour" ? "yyyy-MM-dd'T'HH:00" : "yyyy-MM-dd'T'00:00",
      );

      return {
        ...item,
        earnings: Number(earningsLookup[formattedDateTime]?.earnings ?? 0),
      };
    });

    return NextResponse.json(analyticsWithRevenue);
  }

  // Group by top_links
  const topLinkEarnings = await prisma.commission.groupBy({
    by: ["linkId"],
    where: {
      linkId: {
        in: analytics.map((item) => item.id),
      },
      programId: programEnrollment.programId,
      partnerId: programEnrollment.partnerId,
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    _sum: {
      earnings: true,
    },
  });

  const topLinksWithEarnings = analytics.map((item) => {
    const link = topLinkEarnings.find((link) => link.linkId === item.id);

    return {
      ...item,
      earnings: Number(link?._sum.earnings ?? 0),
    };
  });

  return NextResponse.json(topLinksWithEarnings);
});
