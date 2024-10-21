import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { getSession } from "./auth";

export const getContentAPI = cache(async () => {
  return await fetch("https://dub.co/api/content", {
    next: {
      revalidate: 60 * 60 * 24, // cache for 24 hours
    },
  }).then((res) => res.json());
});

export const getDefaultWorkspace = cache(async () => {
  const session = await getSession();
  if (!session) {
    return null;
  }
  return await prisma.project.findFirst({
    where: {
      users: {
        some: {
          userId: session.user.id,
        },
      },
    },
    select: {
      slug: true,
    },
  });
});

export const getWorkspace = cache(async ({ slug }: { slug: string }) => {
  const session = await getSession();
  if (!session) {
    return null;
  }
  return await prisma.project.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      usage: true,
      usageLimit: true,
      referralLinkId: true,
      plan: true,
      stripeId: true,
      billingCycleStart: true,
      createdAt: true,
      users: {
        where: {
          userId: session.user.id,
        },
        select: {
          role: true,
        },
      },
    },
  });
});

export const getLink = cache(
  async ({ domain, key }: { domain: string; key: string }) => {
    return await prisma.link.findUnique({
      where: {
        domain_key: {
          domain,
          key,
        },
      },
    });
  },
);
