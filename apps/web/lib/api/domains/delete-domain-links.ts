import prisma from "@/lib/prisma";
import { redis } from "@/lib/upstash";
import { waitUntil } from "@vercel/functions";
import { storage } from "../../storage";
import { recordLink } from "../../tinybird";
import { removeDomainFromVercel } from "./remove-domain-vercel";

/* Delete a domain and all links & images associated with it */
export async function deleteDomainAndLinks(domain: string) {
  const [domainData, allLinks] = await Promise.all([
    prisma.domain.findUnique({
      where: {
        slug: domain,
      },
      select: {
        id: true,
        target: true,
        projectId: true,
      },
    }),
    prisma.link.findMany({
      where: {
        domain,
      },
      select: {
        id: true,
        domain: true,
        key: true,
        url: true,
        image: true,
        projectId: true,
        tags: true,
      },
    }),
  ]);
  if (!domainData) {
    return null;
  }

  const response = await prisma.domain.delete({
    where: {
      slug: domain,
    },
  });

  waitUntil(
    (async () => {
      const res = await Promise.allSettled([
        // delete all links from redis
        redis.del(domain.toLowerCase()),
        // record deletes in tinybird for domain & links
        recordLink([
          {
            link_id: domainData.id,
            domain,
            key: "_root",
            url: domainData.target || "",
            project_id: domainData.projectId,
            deleted: true,
          },
          ...allLinks.map((link) => ({
            link_id: link.id,
            domain: link.domain,
            key: link.key,
            url: link.url,
            tagIds: link.tags.map((tag) => tag.tagId),
            project_id: link.projectId,
            deleted: true,
          })),
        ]),
        ...allLinks.map((link) => {
          if (link.image?.startsWith(process.env.STORAGE_BASE_URL as string)) {
            storage.delete(`images/${link.id}`);
          }
        }),
        // remove the domain from Vercel
        removeDomainFromVercel(domain),
      ]);
      console.log(res);
    })(),
  );

  return response;
}
