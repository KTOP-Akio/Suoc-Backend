import { DubApiError } from "@/lib/api/errors";
import { OAUTH_CONFIG } from "@/lib/api/oauth/constants";
import { createToken } from "@/lib/api/oauth/utils";
import { hashToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import z from "@/lib/zod";
import { refreshTokenSchema } from "@/lib/zod/schemas/oauth";
import { getCurrentPlan } from "@dub/utils";
import { NextRequest } from "next/server";

// Get new access token using refresh token
export const refreshAccessToken = async (
  req: NextRequest,
  params: z.infer<typeof refreshTokenSchema>,
) => {
  let {
    refresh_token,
    client_id: clientId,
    client_secret: clientSecret,
  } = params;

  // If no client_id or client_secret is provided in the request body
  // then it should be provided in the Authorization header as Basic Auth for non-PKCE
  if (!clientId && !clientSecret) {
    const authorizationHeader = req.headers.get("Authorization") || "";
    const [type, token] = authorizationHeader.split(" ");

    if (type === "Basic") {
      const splits = Buffer.from(token, "base64").toString("utf-8").split(":");

      if (splits.length > 1) {
        clientId = splits[0];
        clientSecret = splits[1];
      }
    }
  }

  if (!clientId) {
    throw new DubApiError({
      code: "unauthorized",
      message: "Missing client_id",
    });
  }

  const app = await prisma.oAuthApp.findFirst({
    where: {
      clientId,
    },
    select: {
      name: true,
      pkce: true,
      hashedClientSecret: true,
    },
  });

  if (!app) {
    throw new DubApiError({
      code: "unauthorized",
      message: "OAuth app not found for the provided client_id",
    });
  }

  if (!app.pkce) {
    if (!clientSecret) {
      throw new DubApiError({
        code: "unauthorized",
        message: "Missing client_secret",
      });
    }

    if (app.hashedClientSecret !== (await hashToken(clientSecret))) {
      throw new DubApiError({
        code: "unauthorized",
        message: "Invalid client_secret",
      });
    }
  }

  const refreshTokenRecord = await prisma.oAuthRefreshToken.findFirst({
    where: {
      clientId,
      hashedRefreshToken: await hashToken(refresh_token),
    },
    select: {
      id: true,
      expiresAt: true,
      accessToken: {
        select: {
          id: true,
          name: true,
          userId: true,
          projectId: true,
          scopes: true,
          project: {
            select: {
              plan: true,
            },
          },
        },
      },
    },
  });

  if (!refreshTokenRecord) {
    throw new DubApiError({
      code: "unauthorized",
      message: "Refresh token not found or expired",
    });
  }

  if (refreshTokenRecord.expiresAt < new Date()) {
    throw new DubApiError({
      code: "unauthorized",
      message: "Refresh token expired",
    });
  }

  const {
    userId,
    projectId,
    scopes,
    name,
    project: workspace,
    id: accessTokenId,
  } = refreshTokenRecord.accessToken;

  const newAccessToken = createToken({
    length: OAUTH_CONFIG.ACCESS_TOKEN_LENGTH,
    prefix: OAUTH_CONFIG.ACCESS_TOKEN_PREFIX,
  });
  const newRefreshToken = createToken({
    length: OAUTH_CONFIG.REFRESH_TOKEN_LENGTH,
  });
  const accessTokenExpires = new Date(
    Date.now() + OAUTH_CONFIG.ACCESS_TOKEN_LIFETIME * 1000,
  );

  await prisma.$transaction([
    // Delete the old access token
    prisma.restrictedToken.delete({
      where: {
        id: accessTokenId,
      },
    }),

    // Create the access token and refresh token
    prisma.restrictedToken.create({
      data: {
        clientId,
        userId,
        projectId,
        scopes,
        name,
        hashedKey: await hashToken(newAccessToken),
        partialKey: `${newAccessToken.slice(0, 3)}...${newAccessToken.slice(-4)}`,
        rateLimit: getCurrentPlan(workspace.plan as string).limits.api,
        expires: accessTokenExpires,
        refreshTokens: {
          create: {
            clientId,
            hashedRefreshToken: await hashToken(newRefreshToken),
            expiresAt: new Date(
              Date.now() + OAUTH_CONFIG.REFRESH_TOKEN_LIFETIME * 1000,
            ),
          },
        },
      },
    }),
  ]);

  // https://www.oauth.com/oauth2-servers/making-authenticated-requests/refreshing-an-access-token/
  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    token_type: "Bearer",
    expires_in: OAUTH_CONFIG.ACCESS_TOKEN_LIFETIME,
  };
};
