import { DubApiError } from "@/lib/api/errors";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  oAuthAppSchema,
  updateOAuthClientSchema,
} from "@/lib/zod/schemas/oauth";
import { NextResponse } from "next/server";

// GET /api/oauth-apps/[clientId] – get an OAuth app
export const GET = withWorkspace(
  async ({ params, workspace }) => {
    const app = await prisma.oAuthApp.findFirst({
      where: {
        clientId: params.clientId,
        projectId: workspace.id,
      },
    });

    if (!app) {
      throw new DubApiError({
        code: "not_found",
        message: `OAuth app with id ${params.clientId} not found.`,
      });
    }

    return NextResponse.json(oAuthAppSchema.parse(app));
  },
  {
    requiredScopes: ["oauth_apps.read"],
  },
);

// PATCH /api/oauth-apps/[clientId] – update an OAuth app
export const PATCH = withWorkspace(
  async ({ req, params, workspace }) => {
    const { name, developer, website, redirectUri, scopes } =
      updateOAuthClientSchema.parse(await parseRequestBody(req));

    const app = await prisma.oAuthApp.update({
      where: {
        clientId: params.clientId,
        projectId: workspace.id,
      },
      data: {
        ...(name && { name }),
        ...(developer && { developer }),
        ...(website && { website }),
        ...(redirectUri && { redirectUri }),
        ...(scopes && { scopes: [...new Set(scopes)].join(" ") }),
      },
    });

    return NextResponse.json(oAuthAppSchema.parse(app));
  },
  {
    requiredScopes: ["oauth_apps.write"],
  },
);

// DELETE /api/oauth-apps/[clientId] - delete an OAuth app
export const DELETE = withWorkspace(
  async ({ params, workspace }) => {
    const app = await prisma.oAuthApp.findFirst({
      where: {
        clientId: params.clientId,
        projectId: workspace.id,
      },
    });

    if (!app) {
      throw new DubApiError({
        code: "not_found",
        message: `OAuth app with id ${params.clientId} not found.`,
      });
    }

    await prisma.oAuthApp.delete({
      where: {
        clientId: params.clientId,
      },
    });

    return NextResponse.json({ id: params.clientId });
  },
  {
    requiredScopes: ["oauth_apps.write"],
  },
);
