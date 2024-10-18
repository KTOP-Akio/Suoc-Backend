import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { recordLink } from "@/lib/tinybird";
import { redis } from "@/lib/upstash";
import { R2_URL } from "@dub/utils";
import { waitUntil } from "@vercel/functions";

export async function deleteLink(linkId: string) {
  const link = await prisma.link.delete({
    where: {
      id: linkId,
    },
    include: {
      tags: true,
    },
  });

  waitUntil(
    Promise.allSettled([
      // Record link in the Tinybird
      recordLink({
        link_id: link.id,
        domain: link.domain,
        key: link.key,
        url: link.url,
        tag_ids: link.tags.map((tag) => tag.tagId),
        workspace_id: link.projectId,
        created_at: link.createdAt,
        deleted: true,
      }),

      // Remove image from R2 storage if it exists
      link.image &&
        link.image.startsWith(`${R2_URL}/images/${link.id}`) &&
        storage.delete(link.image.replace(`${R2_URL}/`, "")),

      // Remove the link from Redis
      redis.hdel(`${link.domain}:${link.key}`.toLowerCase()),

      // Decrement the links count for the workspace
      link.projectId &&
        prisma.project.update({
          where: {
            id: link.projectId,
          },
          data: {
            linksUsage: {
              decrement: 1,
            },
          },
        }),
    ]),
  );

  return link;
}
