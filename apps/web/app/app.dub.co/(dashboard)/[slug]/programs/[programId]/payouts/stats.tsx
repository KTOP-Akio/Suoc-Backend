"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { fetcher } from "@dub/utils";
import { PayoutStatus } from "@prisma/client";
import useSWR from "swr";

interface PayoutsCount {
  status: PayoutStatus;
  _count: number;
}

export function PayoutStats({ programId }: { programId: string }) {
  const { id: workspaceId } = useWorkspace();

  const { data: payoutsCounts } = useSWR<PayoutsCount[]>(
    `/api/programs/${programId}/payouts/count?workspaceId=${workspaceId}`,
    fetcher,
  );

  const pendingPayoutsCount =
    payoutsCounts?.find((payout) => payout.status === "pending")?._count || 0;

  const completedPayoutsCount =
    payoutsCounts?.find((payout) => payout.status === "completed")?._count || 0;

  return (
    <div className="flex w-full gap-4">
      <div className="flex basis-1/3 flex-col items-start justify-start gap-1 rounded-lg border border-neutral-300 px-4 py-3">
        <div className="text-[13px] font-normal text-neutral-500">All</div>
        <div className="text-lg font-semibold leading-tight text-neutral-800">
          {pendingPayoutsCount + completedPayoutsCount}
        </div>
      </div>

      <div className="flex basis-1/3 flex-col items-start justify-start gap-1 rounded-lg border border-neutral-300 px-4 py-3">
        <div className="text-[13px] font-normal text-neutral-500">Pending</div>
        <div className="text-lg font-semibold leading-tight text-neutral-800">
          {pendingPayoutsCount}
        </div>
      </div>

      <div className="flex basis-1/3 flex-col items-start justify-start gap-1 rounded-lg border border-neutral-300 px-4 py-3">
        <div className="text-[13px] font-normal text-neutral-500">Paid</div>
        <div className="text-lg font-semibold leading-tight text-neutral-800">
          {completedPayoutsCount}
        </div>
      </div>
    </div>
  );
}
