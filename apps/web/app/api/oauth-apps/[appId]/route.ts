import { DubApiError } from "@/lib/api/errors";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  oAuthAppSchema,
  updateOAuthAppSchema,
} from "@/lib/zod/schemas/oauth-app";
import { NextResponse } from "next/server";

// GET /api/oauth-apps/[appId] – get an OAuth app
export const GET = withWorkspace(async ({ params, workspace }) => {
  const app = await prisma.oAuthApp.findUnique({
    where: {
      id: params.appId,
      projectId: workspace.id,
    },
  });

  if (!app) {
    throw new DubApiError({
      code: "not_found",
      message: `OAuth app with id ${params.appId} not found.`,
    });
  }

  return NextResponse.json(oAuthAppSchema.parse(app));
});

// PATCH /api/oauth-apps/[appId] – update an OAuth app
export const PATCH = withWorkspace(async ({ req, params, workspace }) => {
  const { name, description, website, redirectUri, scopes } =
    updateOAuthAppSchema.parse(await parseRequestBody(req));

  const app = await prisma.oAuthApp.update({
    where: {
      id: params.appId,
      projectId: workspace.id,
    },
    data: {
      name,
      description,
      website,
      redirectUri,
      scopes: scopes ? scopes.join(",") : null,
    },
  });

  return NextResponse.json(oAuthAppSchema.parse(app));
});

// DELETE /api/oauth-apps/[appId] - delete an OAuth app
export const DELETE = withWorkspace(async ({ req, params, workspace }) => {
  const app = await prisma.oAuthApp.findUnique({
    where: {
      id: params.appId,
      projectId: workspace.id,
    },
  });

  if (!app) {
    throw new DubApiError({
      code: "not_found",
      message: `OAuth app with id ${params.appId} not found.`,
    });
  }

  await prisma.oAuthApp.delete({
    where: {
      id: params.appId,
    },
  });

  return NextResponse.json({ id: params.appId });
});
