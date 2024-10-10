import { prisma } from "@/lib/prisma";
import { WebhookTrigger, WorkspaceProps } from "../types";
import { sendWebhooks } from "./qstash";
import {
  LeadEventDataProps,
  LinkEventDataProps,
  SaleEventDataProps,
} from "./types";

// Send workspace level webhook
export const sendWorkspaceWebhook = async ({
  trigger,
  workspace,
  data,
}: {
  trigger: WebhookTrigger;
  workspace: Pick<WorkspaceProps, "id" | "webhookEnabled">;
  data: LinkEventDataProps | LeadEventDataProps | SaleEventDataProps;
}) => {
  if (!workspace.webhookEnabled) {
    return;
  }

  const webhooks = await prisma.webhook.findMany({
    where: {
      projectId: workspace.id,
      triggers: {
        array_contains: [trigger],
      },
    },
    select: {
      id: true,
      url: true,
      secret: true,
      disabled: true,
    },
  });

  return sendWebhooks({ trigger, webhooks, data });
};
