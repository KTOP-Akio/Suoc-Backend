import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { recordLink } from "@/lib/tinybird";
import { redis } from "@/lib/upstash";
import { R2_URL } from "@dub/utils";
import { Link, Tag } from "@prisma/client";

export async function bulkDeleteLinks({
  links,
  workspaceId,
}: {
  links: (Link & { tags: Pick<Tag, "id">[] })[];
  workspaceId: string;
}) {
  if (links.length === 0) {
    return;
  }

  const pipeline = redis.pipeline();

  links.forEach((link) => {
    pipeline.del(`${link.domain}:${link.key}`.toLowerCase());
  });

  return await Promise.all([
    // Delete the links from Redis
    pipeline.exec(),

    // Record the links deletion in Tinybird
    recordLink(
      links.map((link) => ({
        link_id: link.id,
        domain: link.domain,
        key: link.key,
        url: link.url,
        workspace_id: link.projectId,
        created_at: link.createdAt,
        tag_ids: link.tags.map(({ id }) => id),
        deleted: true,
      })),
    ),

    // For links that have an image, delete the image from R2
    links
      .filter((link) => link.image?.startsWith(`${R2_URL}/images/${link.id}`))
      .map((link) => storage.delete(link.image!.replace(`${R2_URL}/`, ""))),

    // Decrement the links count for the workspace
    prisma.project.update({
      where: {
        id: workspaceId,
      },
      data: {
        linksUsage: {
          decrement: links.length,
        },
      },
    }),
  ]);
}
