import { DubApiError } from "@/lib/api/errors";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  oAuthClientSchema,
  updateOAuthClientSchema,
} from "@/lib/zod/schemas/oauth";
import { NextResponse } from "next/server";

// GET /api/oauth-clients/[clientId] – get an OAuth client
export const GET = withWorkspace(
  async ({ params, workspace }) => {
    const app = await prisma.oAuthClient.findFirst({
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

    return NextResponse.json(oAuthClientSchema.parse(app));
  },
  {
    requiredScopes: ["oauth_apps.read"],
  },
);

// PATCH /api/oauth-clients/[clientId] – update an OAuth client
export const PATCH = withWorkspace(
  async ({ req, params, workspace }) => {
    const { name, description, website, redirectUri, scopes } =
      updateOAuthClientSchema.parse(await parseRequestBody(req));

    const app = await prisma.oAuthClient.update({
      where: {
        clientId: params.clientId,
        projectId: workspace.id,
      },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(website && { website }),
        ...(redirectUri && { redirectUri }),
        ...(scopes && {
          scopes: scopes.length > 0 ? [...new Set(scopes)].join(" ") : null,
        }),
      },
    });

    return NextResponse.json(oAuthClientSchema.parse(app));
  },
  {
    requiredScopes: ["oauth_apps.write"],
  },
);

// DELETE /api/oauth-clients/[clientId] - delete an OAuth client
export const DELETE = withWorkspace(
  async ({ params, workspace }) => {
    const app = await prisma.oAuthClient.findFirst({
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

    await prisma.oAuthClient.delete({
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
