import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { createEmbedToken } from "@/lib/referrals/create-embed-token";
import {
  createReferralTokenSchema,
  referralTokenSchema,
} from "@/lib/zod/schemas/referrals";
import { NextResponse } from "next/server";

// GET /api/referrals/tokens - create a new referral token for the given link
export const POST = withWorkspace(async ({ workspace, req }) => {
  const { linkId } = createReferralTokenSchema.parse(
    await parseRequestBody(req),
  );

  const token = await createEmbedToken({ linkId, workspaceId: workspace.id });

  return NextResponse.json(referralTokenSchema.parse(token), {
    status: 201,
  });
});
