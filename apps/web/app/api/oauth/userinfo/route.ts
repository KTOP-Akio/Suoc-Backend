import { DubApiError, handleAndReturnErrorResponse } from "@/lib/api/errors";
import { getAuthTokenOrThrow, hashToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/oauth/userinfo - get user info by access token
export async function GET(req: NextRequest) {
  try {
    const accessToken = getAuthTokenOrThrow(req);

    const tokenRecord = await prisma.restrictedToken.findFirst({
      where: {
        hashedKey: await hashToken(accessToken),
        expires: {
          gte: new Date(),
        },
        clientId: {
          not: null,
        },
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      throw new DubApiError({
        code: "unauthorized",
        message: "Access token not found or expired.",
      });
    }

    const { user } = tokenRecord;

    const userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    };

    return NextResponse.json(userInfo);
  } catch (e) {
    return handleAndReturnErrorResponse(e);
  }
}
