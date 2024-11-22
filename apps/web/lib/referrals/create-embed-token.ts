import { prisma } from "@/lib/prisma";
import { waitUntil } from "@vercel/functions";
import { DubApiError } from "../api/errors";
import { getLinkOrThrow } from "../api/links/get-link-or-throw";
import { createId } from "../api/utils";
import { ratelimit } from "../upstash";
import {
  EMBED_PUBLIC_TOKEN_EXPIRY,
  EMBED_PUBLIC_TOKEN_LENGTH,
} from "./constants";

export const createEmbedToken = async ({
  linkId,
  workspaceId,
}: {
  linkId: string;
  workspaceId: string;
}) => {
  const link = await getLinkOrThrow({ linkId, workspaceId });
  console.log("link", link);

  const { success } = await ratelimit(10, "1 m").limit(linkId);

  if (!success) {
    throw new DubApiError({
      code: "rate_limit_exceeded",
      message: "Too many requests.",
    });
  }

  const token = await prisma.embedPublicToken.findFirst({
    where: {
      linkId,
      expires: {
        gt: new Date(),
      },
    },
  });

  if (token) {
    return token;
  }

  // Remove all expired tokens for this link
  waitUntil(
    prisma.embedPublicToken.deleteMany({
      where: {
        linkId,
        expires: {
          lte: new Date(),
        },
      },
    }),
  );

  return await prisma.embedPublicToken.create({
    data: {
      id: createId({ prefix: "ept_" }),
      linkId,
      expires: new Date(Date.now() + EMBED_PUBLIC_TOKEN_EXPIRY),
      publicToken: createId({
        prefix: "dub_embed_",
        length: EMBED_PUBLIC_TOKEN_LENGTH,
      }),
    },
  });
};
