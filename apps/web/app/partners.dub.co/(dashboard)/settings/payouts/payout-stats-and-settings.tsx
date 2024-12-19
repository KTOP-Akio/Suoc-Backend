"use client";

import usePartnerPayoutsCount from "@/lib/swr/use-partner-payouts-count";
import usePartnerProfile from "@/lib/swr/use-partner-profile";
import StripeConnectButton from "@/ui/partners/stripe-connect-button";
import { PayoutStatus } from "@dub/prisma/client";
import { MatrixLines } from "@dub/ui";
import { fetcher } from "@dub/utils";
import NumberFlow from "@number-flow/react";
import { Stripe } from "stripe";
import useSWR from "swr";

export function PayoutStatsAndSettings() {
  const { partner } = usePartnerProfile();
  const { payoutsCount } = usePartnerPayoutsCount();

  const { data: bankAccount } = useSWR<Stripe.BankAccount | null>(
    partner?.id && `/api/partners/${partner.id}/payouts/settings`,
    fetcher,
  );

  return (
    <div className="grid grid-cols-1 divide-neutral-200 rounded-lg border border-neutral-200 bg-neutral-50 max-sm:divide-y sm:grid-cols-2 sm:divide-x">
      <div className="flex flex-col gap-1.5 p-4">
        <div className="flex justify-between gap-5">
          <div className="p-1">
            <div className="text-sm text-neutral-500">Upcoming payouts</div>
          </div>
          <StripeConnectButton
            text={
              partner?.payoutsEnabled ? "Payout settings" : "Connect payouts"
            }
            className="h-8 w-fit px-3"
            variant={partner?.payoutsEnabled ? "secondary" : "primary"}
            // TODO: Stripe Connect – remove this once we can onboard partners from other countries
            disabledTooltip={
              partner?.country !== "US"
                ? "We currently only support setting up payouts for US partners, but we will be adding more countries very soon."
                : undefined
            }
          />
        </div>
        <div className="flex items-end justify-between gap-5">
          <NumberFlow
            className="mt-2 text-2xl text-neutral-800"
            value={
              (payoutsCount?.find((p) => p.status === PayoutStatus.pending)
                ?.amount ?? 0) / 100
            }
            format={{
              style: "currency",
              currency: "USD",
            }}
          />
          {bankAccount && (
            <div className="text-sm">
              <p className="text-neutral-600">{bankAccount.bank_name}</p>
              <div className="flex items-center gap-1.5 font-mono text-gray-400">
                <MatrixLines className="size-3" />
                {bankAccount.routing_number}
                <MatrixLines className="size-3" />
                ••••{bankAccount.last4}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 p-4">
        <div className="flex justify-between gap-5">
          <div className="p-1">
            <div className="text-sm text-neutral-500">Total payouts</div>
          </div>
        </div>
        <NumberFlow
          className="mt-2 text-2xl text-neutral-800"
          value={
            (payoutsCount?.find((p) => p.status === PayoutStatus.completed)
              ?.amount ?? 0) / 100
          }
          format={{
            style: "currency",
            currency: "USD",
          }}
        />
      </div>
    </div>
  );
}
