import { storage } from "@/lib/storage";
import { recordLink } from "@/lib/tinybird";
import { redis } from "@/lib/upstash";
import { Link } from "@dub/prisma/client";
import { R2_URL } from "@dub/utils";

export async function bulkDeleteLinks({
  links,
}: {
  links: (Link & { tags: { tagId: string }[] })[];
}) {
  if (links.length === 0) {
    return;
  }

  const pipeline = redis.pipeline();

  links.forEach((link) => {
    pipeline.hdel(link.domain.toLowerCase(), link.key.toLowerCase());
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
        tag_ids: link.tags.map(({ tagId }) => tagId),
        program_id: link.programId ?? "",
        workspace_id: link.projectId,
        created_at: link.createdAt,
        tag_ids: link.tags.map(({ id }) => id),
        folder_id: link.folderId,
        deleted: true,
      })),
    ),

    // For links that have an image, delete the image from R2
    // TODO: How do we optimize this?
    links
      .filter((link) => link.image?.startsWith(`${R2_URL}/images/${link.id}`))
      .map((link) => storage.delete(link.image!.replace(`${R2_URL}/`, ""))),
  ]);
}
