import { getEvents } from "@/lib/analytics/get-events";
import { getProgramEnrollmentOrThrow } from "@/lib/api/programs/get-program-enrollment-or-throw";
import { withPartner } from "@/lib/auth/partner";
import { eventsQuerySchema } from "@/lib/zod/schemas/analytics";
import { NextResponse } from "next/server";

// GET /api/partners/[partnerId]/programs/[programId]/events – get events for a program enrollment link
export const GET = withPartner(async ({ partner, params, searchParams }) => {
  const { link, program } = await getProgramEnrollmentOrThrow({
    partnerId: partner.id,
    programId: params.programId,
  });

  const parsedParams = eventsQuerySchema
    .pick({
      event: true,
      interval: true,
      page: true,
      limit: true,
      order: true,
      sortBy: true,
    })
    .parse(searchParams);

  const response = await getEvents({
    ...parsedParams,
    linkId: link.id,
    obfuscateData: true,
  });

  const getEarnings = (item: any) => {
    return program.commissionType === "percentage"
      ? item.sale.amount * program.commissionAmount
      : program.commissionAmount * item.sale.amount;
  };

  return NextResponse.json(
    response.map((item) => {
      return {
        ...item,
        earnings: getEarnings(item),
      };
    }),
  );
});
