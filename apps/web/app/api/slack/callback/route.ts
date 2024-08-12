import { DubApiError } from "@/lib/api/errors";
import { getSession } from "@/lib/auth";
import { installIntegration } from "@/lib/integration/install";
import { SlackCredential } from "@/lib/integration/slack/type";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/upstash";
import z from "@/lib/zod";
import { getSearchParams } from "@dub/utils";
import { redirect } from "next/navigation";

const schema = z.object({
  code: z.string(),
  state: z.string(),
});

export const GET = async (req: Request) => {
  try {

  } catch(e: any) {
    //
  }


  const session = await getSession();

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { code, state } = schema.parse(getSearchParams(req.url));

  // Find workspace that initiated the Stripe app install
  const workspaceId = await redis.get<string>(`slack:install:state:${state}`);

  if (!workspaceId) {
    throw new DubApiError({
      code: "bad_request",
      message: "Unknown state",
    });
  }

  const workspace = await prisma.project.findFirstOrThrow({
    where: {
      id: workspaceId,
    },
    select: {
      slug: true,
    },
  });

  const formData = new FormData();
  formData.append("code", code);
  formData.append("client_id", `${process.env.SLACK_CLIENT_ID}`);
  formData.append("client_secret", `${process.env.SLACK_CLIENT_SECRET}`);

  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  const credentials: SlackCredential = {
    appId: data.app_id,
    botUserId: data.bot_user_id,
    scope: data.scope,
    accessToken: data.access_token,
    tokenType: data.token_type,
    authUser: data.authed_user,
    team: data.team,
  };

  await installIntegration({
    integrationSlug: "slack",
    userId: session.user.id,
    workspaceId,
    credentials,
  });

  redirect(`${workspace.slug}/integrations/slack`);
};
