import { parseRequestBody } from "@/lib/api/utils";
import { hashToken, withWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTokenSchema, tokenSchema } from "@/lib/zod/schemas/token";
import { nanoid } from "@dub/utils";
import { User } from "@prisma/client";
import { waitUntil } from "@vercel/functions";
import { sendEmail } from "emails";
import APIKeyCreated from "emails/api-key-created";
import { NextResponse } from "next/server";

// POST /api/tokens – create a new token for a workspace
export const POST = withWorkspace(
  async ({ req, session, workspace }) => {
    const { name, isMachine, scopes } = createTokenSchema.parse(
      await parseRequestBody(req),
    );

    let machineUser: User | null = null;

    // Create machine user if needed
    if (isMachine) {
      machineUser = await prisma.user.create({
        data: {
          name: "Machine",
          image: "https://api.dicebear.com/9.x/bottts/svg",
          isMachine: true,
        },
      });

      // Add machine user to workspace
      await prisma.projectUsers.create({
        data: {
          role: "member",
          userId: machineUser.id,
          projectId: workspace.id,
        },
      });
    }

    // Create token
    const token = `dub_${nanoid(24)}`;
    const hashedKey = await hashToken(token);
    const partialKey = `${token.slice(0, 3)}...${token.slice(-4)}`;

    await prisma.restrictedToken.create({
      data: {
        name,
        hashedKey,
        partialKey,
        userId: isMachine ? machineUser?.id! : session.user.id,
        projectId: workspace.id,
        scopes: scopes && scopes.length > 0 ? scopes.join(" ") : null,
      },
    });

    waitUntil(
      sendEmail({
        email: session.user.email,
        subject: "New API Key Created",
        react: APIKeyCreated({
          email: session.user.email,
          apiKeyName: name,
        }),
      }),
    );

    return NextResponse.json({ token });
  },
  {
    requiredScopes: ["tokens.write"],
  },
);

// GET /api/tokens - get all tokens for a workspace
export const GET = withWorkspace(
  async ({ workspace }) => {
    const tokens = await prisma.restrictedToken.findMany({
      where: {
        projectId: workspace.id,
      },
      select: {
        id: true,
        name: true,
        partialKey: true,
        scopes: true,
        lastUsed: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            isMachine: true,
          },
        },
      },
      orderBy: [{ lastUsed: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tokenSchema.array().parse(tokens));
  },
  {
    requiredScopes: ["tokens.read", "tokens.write"],
  },
);
