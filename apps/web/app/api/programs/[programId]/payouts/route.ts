import { getProgramOrThrow } from "@/lib/api/programs/get-program";
import { withWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PartnerSchema, PayoutSchema } from "@/lib/zod/schemas/partners";
import { PayoutStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import z from "zod";

const searchSchema = z.object({
  status: z.nativeEnum(PayoutStatus).optional(),
  offset: z.number().optional().default(0),
  limit: z.number().optional().default(50),
});

export const responseSchema = PayoutSchema.and(
  z.object({
    partner: PartnerSchema,
    _count: z.object({ sales: z.number() }),
  }),
);

// GET /api/programs/[programId]/payouts - get all payouts for a program
export const GET = withWorkspace(
  async ({ workspace, params, searchParams }) => {
    const { status, offset, limit } = searchSchema.parse(searchParams);

    const program = await getProgramOrThrow({
      workspaceId: workspace.id,
      programId: params.programId,
    });

    const payouts = await prisma.payout.findMany({
      where: {
        programId: program.id,
        ...(status && { status }),
      },
      include: {
        partner: true,
        _count: {
          select: {
            sales: true,
          },
        },
      },
      skip: offset,
      take: limit,
    });

    return NextResponse.json(z.array(responseSchema).parse(payouts));
  },
);
