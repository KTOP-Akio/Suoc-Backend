import { prisma } from "@dub/prisma";
import { linkConstructorSimple } from "@dub/utils";
import "dotenv-flow/config";
import { linkCache } from "../../lib/api/links/cache";
import { encodeKeyIfCaseSensitive } from "../../lib/api/links/case-sensitivity";

const domain = "buff.ly";
const userId = "user_EzRuKzR9sG3WmHapVV6aEec7";
const oldFolderId = "fold_LIZsdjTgFVbQVGYSUmYAi5vT";
const newFolderId = "fold_1JNQBVZV8P0NA0YGB11W2HHSQ";

async function main() {
  const links = await prisma.link.findMany({
    where: {
      userId,
      domain,
      folderId: oldFolderId,
      createdAt: {
        lte: new Date("2025-03-07T16:33:32.084Z"),
      },
    },
    select: {
      id: true,
      domain: true,
      key: true,
    },
    take: 100,
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!links.length) {
    console.log("No more links to migrate.");
    return;
  }

  await Promise.allSettled(
    links.map(async (link) => {
      const newKey = encodeKeyIfCaseSensitive({
        domain,
        key: link.key,
      });

      const newShortLink = linkConstructorSimple({
        domain,
        key: newKey,
      });

      await prisma.link.update({
        where: {
          id: link.id,
        },
        data: {
          key: newKey,
          shortLink: newShortLink,
          folderId: newFolderId,
        },
      });

      console.log(
        `Updated link ${link.id} to ${newShortLink} and new folder ${newFolderId}`,
      );
    }),
  );

  // expire the Redis cache for the links so it fetches the latest version from the database
  await linkCache.expireMany(links);
}

main();
