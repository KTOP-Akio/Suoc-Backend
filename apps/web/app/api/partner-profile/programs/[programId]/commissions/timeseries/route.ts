import { getStartEndDates } from "@/lib/analytics/utils/get-start-end-dates";
import { getProgramEnrollmentOrThrow } from "@/lib/api/programs/get-program-enrollment-or-throw";
import { withPartnerProfile } from "@/lib/auth/partner";
import { sqlGranularityMap } from "@/lib/planetscale/granularity";
import { analyticsQuerySchema } from "@/lib/zod/schemas/analytics";
import { prisma } from "@dub/prisma";
import { Prisma } from "@prisma/client";
import { format } from "date-fns";
import { NextResponse } from "next/server";

const partnerAnalyticsQuerySchema = analyticsQuerySchema.pick({
  event: true,
  start: true,
  end: true,
  interval: true,
  groupBy: true,
  timezone: true,
});

interface CommissionResult {
  clicks: number;
  leads: number;
  sales: number;
  saleAmount: number;
  earnings: number;
}

interface Commission {
  start: string;
  earnings: number;
}

// GET /api/partner-profile/programs/[programId]/commissions/timeseries - get timeseries chart for a partner's commissions
export const GET = withPartnerProfile(
  async ({ partner, params, searchParams }) => {
    const { program } = await getProgramEnrollmentOrThrow({
      partnerId: partner.id,
      programId: params.programId,
    });

    const { start, end, interval, groupBy, event } =
      partnerAnalyticsQuerySchema.parse(searchParams);

    const { startDate, endDate, granularity } = getStartEndDates({
      interval,
      start,
      end,
    });

    if (groupBy === "count") {
      const eventMap = {
        clicks: "click",
        leads: "lead",
        sales: "sale",
        composite: "click, lead, sale",
      };

      const commissions = await prisma.$queryRaw<CommissionResult>`
        SELECT
          COUNT(CASE WHEN type = 'click' THEN 1 END) AS clicks,
          COUNT(CASE WHEN type = 'lead' THEN 1 END) AS leads,
          COUNT(CASE WHEN type = 'sale' THEN 1 END) AS sales,
          SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END) AS saleAmount,
          SUM(earnings) AS earnings
        FROM Commission
        WHERE
          createdAt >= ${startDate}
          AND createdAt < ${endDate}
          AND programId = ${program.id}
          AND partnerId = ${partner.id}
          ${event !== "composite" ? Prisma.sql`AND type = ${eventMap[event]}` : Prisma.sql``};`;

      return NextResponse.json({
        clicks: Number(commissions[0].clicks) || 0,
        leads: Number(commissions[0].leads) || 0,
        sales: Number(commissions[0].sales) || 0,
        saleAmount: Number(commissions[0].saleAmount) || 0,
        earnings: Number(commissions[0].earnings) || 0,
      });
    }

    const { dateFormat, dateIncrement, startFunction, formatString } =
      sqlGranularityMap[granularity];

    const commissions = await prisma.$queryRaw<Commission[]>`
      SELECT 
        DATE_FORMAT(createdAt, ${dateFormat}) AS start, 
        SUM(earnings) AS earnings
      FROM Commission
      WHERE 
        createdAt >= ${startDate}
        AND createdAt < ${endDate}
        AND programId = ${program.id}
        AND partnerId = ${partner.id}
      GROUP BY start
      ORDER BY start ASC;
    `;

    const timeseries: Commission[] = [];
    let currentDate = startFunction(startDate);

    const commissionLookup = Object.fromEntries(
      commissions.map((item) => [
        item.start,
        {
          earnings: Number(item.earnings),
        },
      ]),
    );

    while (currentDate < endDate) {
      const periodKey = format(currentDate, formatString);

      timeseries.push({
        start: format(currentDate, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        earnings: commissionLookup[periodKey]?.earnings || 0,
      });

      currentDate = dateIncrement(currentDate);
    }

    return NextResponse.json(timeseries);
  },
);
