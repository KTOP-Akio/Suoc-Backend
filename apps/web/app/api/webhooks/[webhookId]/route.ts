import { DubApiError } from "@/lib/api/errors";
import { linkCache } from "@/lib/api/links/cache";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateWebhookStatusForWorkspace } from "@/lib/webhook/api";
import { webhookCache } from "@/lib/webhook/cache";
import { transformWebhook } from "@/lib/webhook/transform";
import { isLinkLevelWebhook } from "@/lib/webhook/utils";
import { updateWebhookSchema } from "@/lib/zod/schemas/webhooks";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";

// GET /api/webhooks/[webhookId] - get info about a specific webhook
export const GET = withWorkspace(
  async ({ workspace, params }) => {
    const { webhookId } = params;

    const webhook = await prisma.webhook.findUniqueOrThrow({
      where: {
        id: webhookId,
        projectId: workspace.id,
      },
      select: {
        id: true,
        name: true,
        url: true,
        secret: true,
        triggers: true,
        disabledAt: true,
        links: true,
      },
    });

    return NextResponse.json(transformWebhook(webhook));
  },
  {
    requiredPermissions: ["webhooks.read"],
    featureFlag: "webhooks",
    requiredPlan: [
      "business",
      "business plus",
      "business extra",
      "business max",
      "enterprise",
    ],
  },
);

// PATCH /api/webhooks/[webhookId] - update a specific webhook
export const PATCH = withWorkspace(
  async ({ workspace, params, req }) => {
    const { webhookId } = params;

    const { name, url, triggers, linkIds } = updateWebhookSchema.parse(
      await parseRequestBody(req),
    );

    if (url) {
      const webhookUrlExists = await prisma.webhook.findFirst({
        where: {
          projectId: workspace.id,
          url,
          id: {
            not: webhookId,
          },
        },
      });

      if (webhookUrlExists) {
        throw new DubApiError({
          code: "conflict",
          message: "A Webhook with this URL already exists.",
        });
      }
    }

    if (linkIds && linkIds.length > 0) {
      const links = await prisma.link.findMany({
        where: {
          id: { in: linkIds },
          projectId: workspace.id,
        },
        select: {
          id: true,
        },
      });

      if (links.length !== linkIds.length) {
        throw new DubApiError({
          code: "bad_request",
          message:
            "Invalid link IDs provided. Please check the links you are adding the webhook to.",
        });
      }
    }

    const oldLinks = await prisma.linkWebhook.findMany({
      where: {
        webhookId,
      },
      select: {
        linkId: true,
      },
    });

    const webhook = await prisma.webhook.update({
      where: {
        id: webhookId,
        projectId: workspace.id,
      },
      data: {
        ...(name && { name }),
        ...(url && { url }),
        ...(triggers && { triggers }),
        ...(linkIds && {
          links: {
            deleteMany: {},
            create: linkIds.map((linkId) => ({
              linkId,
            })),
          },
        }),
      },
      select: {
        id: true,
        name: true,
        url: true,
        secret: true,
        triggers: true,
        disabledAt: true,
        links: {
          select: {
            linkId: true,
          },
        },
      },
    });

    waitUntil(
      (async () => {
        const existingWebhook = await prisma.webhook.findUniqueOrThrow({
          where: {
            id: webhookId,
            projectId: workspace.id,
          },
        });

        // If the webhook is being changed from link level to workspace level, delete the cache
        if (
          isLinkLevelWebhook(existingWebhook) &&
          !isLinkLevelWebhook(webhook)
        ) {
          await webhookCache.delete(webhookId);

          const links = await prisma.link.findMany({
            where: {
              id: { in: oldLinks.map(({ linkId }) => linkId) },
            },
            include: {
              webhooks: {
                select: {
                  webhookId: true,
                },
              },
            },
          });

          const formatedLinks = links.map((link) => {
            return {
              ...link,
              webhookIds: link.webhooks.map(({ webhookId }) => webhookId),
            };
          });

          await linkCache.mset(formatedLinks);
        }

        // If the webhook is being changed from workspace level to link level, set the cache
        else if (isLinkLevelWebhook(webhook)) {
          await webhookCache.set(webhook);
        }

        const newLinkIds = webhook.links.map(({ linkId }) => linkId);
        const oldLinkIds = oldLinks.map(({ linkId }) => linkId);

        if (!newLinkIds.length && !oldLinkIds.length) {
          return;
        }

        const linksAdded = newLinkIds.filter(
          (linkId) => !oldLinkIds.includes(linkId),
        );

        const linksRemoved = oldLinkIds.filter(
          (linkId) => !newLinkIds.includes(linkId),
        );

        // No changes in the links
        if (!linksAdded.length && !linksRemoved.length) {
          console.log("No changes in the links");
          return;
        }

        const links = await prisma.link.findMany({
          where: {
            id: { in: [...linksAdded, ...linksRemoved] },
          },
          include: {
            webhooks: {
              select: {
                webhookId: true,
              },
            },
          },
        });

        const formatedLinks = links.map((link) => {
          return {
            ...link,
            ...(link.webhooks.length > 0 && {
              webhookIds: link.webhooks.map(({ webhookId }) => webhookId),
            }),
          };
        });

        await linkCache.mset(formatedLinks);
      })(),
    );

    return NextResponse.json(transformWebhook(webhook));
  },
  {
    requiredPermissions: ["webhooks.write"],
    featureFlag: "webhooks",
    requiredPlan: [
      "business",
      "business plus",
      "business extra",
      "business max",
      "enterprise",
    ],
  },
);

// DELETE /api/webhooks/[webhookId] - delete a specific webhook
export const DELETE = withWorkspace(
  async ({ workspace, params }) => {
    const { webhookId } = params;

    const linkWebhooks = await prisma.linkWebhook.findMany({
      where: {
        webhookId,
      },
      select: {
        linkId: true,
      },
    });

    await prisma.webhook.delete({
      where: {
        id: webhookId,
        projectId: workspace.id,
      },
    });

    waitUntil(
      (async () => {
        const links = await prisma.link.findMany({
          where: {
            id: { in: linkWebhooks.map(({ linkId }) => linkId) },
          },
          include: {
            webhooks: {
              select: {
                webhookId: true,
              },
            },
          },
        });

        const formatedLinks = links.map((link) => {
          return {
            ...link,
            webhookIds: link.webhooks.map((webhook) => webhook.webhookId),
          };
        });

        await Promise.all([
          updateWebhookStatusForWorkspace({ workspace }),
          linkCache.mset(formatedLinks),
          webhookCache.delete(webhookId),
        ]);
      })(),
    );

    return NextResponse.json({
      id: webhookId,
    });
  },
  {
    requiredPermissions: ["webhooks.write"],
    featureFlag: "webhooks",
    requiredPlan: [
      "business",
      "business plus",
      "business extra",
      "business max",
      "enterprise",
    ],
  },
);
