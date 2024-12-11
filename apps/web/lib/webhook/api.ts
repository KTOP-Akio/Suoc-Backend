import { linkCache } from "@/lib/api/links/cache";
import { createId } from "@/lib/api/utils";
import { webhookCache } from "@/lib/webhook/cache";
import { WEBHOOK_ID_PREFIX } from "@/lib/webhook/constants";
import {
  identifyWebhookReceiver,
  isLinkLevelWebhook,
} from "@/lib/webhook/utils";
import { prisma } from "@dub/prisma";
import { Project } from "@dub/prisma/client";
import { waitUntil } from "@vercel/functions";
import { WebhookTrigger } from "../types";
import { createWebhookSecret } from "./secret";

export async function addWebhook({
  name,
  url,
  secret,
  triggers,
  workspace,
  linkIds,
}: {
  name: string;
  url: string;
  secret?: string;
  triggers: WebhookTrigger[];
  workspace: Pick<Project, "id">;
  linkIds?: string[];
}) {
  const webhook = await prisma.webhook.create({
    data: {
      id: createId({ prefix: WEBHOOK_ID_PREFIX }),
      name,
      url,
      triggers,
      projectId: workspace.id,
      receiver: identifyWebhookReceiver(url),
      secret: secret || createWebhookSecret(),
      links: {
        ...(linkIds &&
          linkIds.length > 0 && {
            create: linkIds.map((linkId) => ({
              linkId,
            })),
          }),
      },
    },
    select: {
      id: true,
      name: true,
      url: true,
      secret: true,
      triggers: true,
      links: true,
      disabledAt: true,
    },
  });

  await prisma.project.update({
    where: {
      id: workspace.id,
    },
    data: {
      webhookEnabled: true,
    },
  });

  waitUntil(
    (async () => {
      const links = await prisma.link.findMany({
        where: {
          id: { in: linkIds },
          projectId: workspace.id,
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

      Promise.all([
        ...(links && links.length > 0
          ? [linkCache.mset(formatedLinks), []]
          : []),

        ...(isLinkLevelWebhook(webhook) ? [webhookCache.set(webhook)] : []),
      ]);
    })(),
  );

  return webhook;
}

export const updateWebhookStatusForWorkspace = async ({
  workspace,
}: {
  workspace: Pick<Project, "id">;
}) => {
  const activeWebhooksCount = await prisma.webhook.count({
    where: {
      projectId: workspace.id,
      disabledAt: null,
    },
  });

  await prisma.project.update({
    where: {
      id: workspace.id,
    },
    data: {
      webhookEnabled: activeWebhooksCount > 0,
    },
  });
};
