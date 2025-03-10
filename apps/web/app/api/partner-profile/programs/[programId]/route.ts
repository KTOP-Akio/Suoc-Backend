import { getProgramEnrollmentOrThrow } from "@/lib/api/programs/get-program-enrollment-or-throw";
import { withPartnerProfile } from "@/lib/auth/partner";
import { determinePartnerDiscount } from "@/lib/partners/determine-partner-discount";
import { determinePartnerReward } from "@/lib/partners/determine-partner-reward";
import { ProgramEnrollmentSchema } from "@/lib/zod/schemas/programs";
import { NextResponse } from "next/server";

// GET /api/partner-profile/programs/[programId] – get a partner's enrollment in a program
export const GET = withPartnerProfile(async ({ partner, params }) => {
  const programEnrollment = await getProgramEnrollmentOrThrow({
    partnerId: partner.id,
    programId: params.programId,
  });

  const { partnerId, programId } = programEnrollment;

  const [reward, discount] = await Promise.all([
    determinePartnerReward({
      event: "sale",
      partnerId,
      programId,
    }),

    determinePartnerDiscount({
      partnerId,
      programId,
    }),
  ]);

  return NextResponse.json(
    ProgramEnrollmentSchema.parse({
      ...programEnrollment,
      reward,
      discount,
    }),
  );
});
