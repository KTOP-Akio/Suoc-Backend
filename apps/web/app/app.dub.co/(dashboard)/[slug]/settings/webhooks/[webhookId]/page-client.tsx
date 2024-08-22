"use client";

import { clientAccessCheck } from "@/lib/api/tokens/permissions";
import useWorkspace from "@/lib/swr/use-workspace";
import { WebhookEventProps } from "@/lib/types";
import { WebhookEventListSkeleton } from "@/ui/webhooks/loading-events-skelton";
import { NoEventsPlaceholder } from "@/ui/webhooks/no-events-placeholder";
import { WebhookEventList } from "@/ui/webhooks/webhook-events";
import WebhookHeader from "@/ui/webhooks/webhook-header";
import { MaxWidthWrapper } from "@dub/ui";
import { fetcher } from "@dub/utils";
import { redirect } from "next/navigation";
import useSWR from "swr";

export default function WebhookLogsPageClient({
  webhookId,
}: {
  webhookId: string;
}) {
  const { slug, flags, role, id: workspaceId } = useWorkspace();

  const { error: permissionsError } = clientAccessCheck({
    action: "webhooks.read",
    role,
  });

  if (!flags?.webhooks || permissionsError) {
    redirect(`/${slug}/settings`);
  }

  const { data: events, isLoading } = useSWR<WebhookEventProps[]>(
    `/api/webhooks/${webhookId}/events?workspaceId=${workspaceId}`,
    fetcher,
    {
      keepPreviousData: true,
    },
  );

  // TODO: Get total events from API
  const totalEvents = events?.length || 100;

  return (
    <>
      <WebhookHeader webhookId={webhookId} page="events" />
      <MaxWidthWrapper className="max-w-screen-lg space-y-6">
        {isLoading ? (
          <WebhookEventListSkeleton />
        ) : events && events.length === 0 ? (
          <NoEventsPlaceholder />
        ) : (
          <WebhookEventList totalEvents={totalEvents} events={events || []} />
        )}
      </MaxWidthWrapper>
    </>
  );
}
