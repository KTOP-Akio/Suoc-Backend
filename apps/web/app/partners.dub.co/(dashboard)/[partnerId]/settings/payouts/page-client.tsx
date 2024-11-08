"use client";

import { createDotsFlowAction } from "@/lib/actions/partners/create-dots-flow";
import { DotsFlowSteps, DotsUser } from "@/lib/dots/types";
import usePartnerProfile from "@/lib/swr/use-partner-profile";
import LayoutLoader from "@/ui/layout/layout-loader";
import { AnimatedEmptyState } from "@/ui/shared/animated-empty-state";
import { CheckCircleFill } from "@/ui/shared/icons";
import { Button, Modal, Note } from "@dub/ui";
import { GreekTemple, MobilePhone } from "@dub/ui/src/icons";
import { currencyFormatter, fetcher } from "@dub/utils";
import { useAction } from "next-safe-action/hooks";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import PayoutMethodCard from "./payout-method-card";

export function PayoutsSettingsPageClient() {
  const { partnerId } = useParams() as { partnerId: string };
  const { partner } = usePartnerProfile();

  const {
    data: dotsUser,
    isLoading,
    mutate,
  } = useSWR<DotsUser>(
    partnerId ? `/api/partners/${partnerId}/dots-user` : null,
    fetcher,
  );

  const { executeAsync, isExecuting } = useAction(createDotsFlowAction, {
    onError({ error }) {
      toast.error(error.serverError?.serverError);
    },
  });

  const [modalState, setModalState] = useState<{
    show: boolean;
    iframeSrc: string;
  }>({
    show: false,
    iframeSrc: "",
  });

  const handleExecution = async (flow: DotsFlowSteps) => {
    const result = await executeAsync({ partnerId, flow });
    if (!result?.data?.ok || !("link" in result?.data)) {
      toast.error(result?.data?.error);
      return;
    }
    setModalState({ show: true, iframeSrc: result.data.link });
  };

  return (
    <>
      {modalState.show && (
        <Modal
          showModal={modalState.show}
          setShowModal={() => setModalState({ show: false, iframeSrc: "" })}
          onClose={() => mutate()}
          className="h-[90vh] w-full max-w-[90vw]"
        >
          <iframe src={modalState.iframeSrc} className="h-full w-full" />
        </Modal>
      )}
      <div className="min-h-screen">
        {partner?.dotsUserId && dotsUser?.verified ? (
          <div className="grid gap-4">
            <div className="grid gap-4 rounded-lg border border-neutral-300 bg-white p-5">
              <div className="grid divide-neutral-200 rounded-lg border border-neutral-200 bg-neutral-50 max-sm:divide-y sm:grid-cols-[repeat(2,minmax(0,1fr))] sm:divide-x">
                <div className="flex flex-col p-4">
                  <div className="flex justify-between gap-5">
                    <div className="p-1 text-sm text-neutral-500">
                      Withdrawable balance
                    </div>
                    <div>
                      {dotsUser ? (
                        <Button
                          text="Withdraw funds"
                          onClick={() => toast.info("WIP")}
                          className="h-7 w-fit px-2"
                          disabledTooltip={
                            dotsUser.payout_methods.length === 0
                              ? "You need to connect a payout method first"
                              : !dotsUser.compliance.submitted
                                ? "You need to verify your identity first"
                                : undefined
                          }
                        />
                      ) : (
                        <div className="h-7 w-24 animate-pulse rounded-md bg-neutral-200" />
                      )}
                    </div>
                  </div>
                  <div className="mt-6 flex grow flex-col justify-end p-1">
                    {dotsUser ? (
                      <div className="text-2xl text-neutral-800">
                        {currencyFormatter(
                          dotsUser?.wallet.withdrawable_amount / 100,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}{" "}
                        USD
                      </div>
                    ) : (
                      <div className="h-8 w-32 animate-pulse rounded bg-neutral-200" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col p-4">
                  <div className="flex justify-between gap-5">
                    <div className="p-1 text-sm text-neutral-500">
                      Pending balance
                    </div>
                  </div>
                  <div className="mt-6 flex grow flex-col justify-end p-1">
                    {dotsUser ? (
                      <div className="text-2xl text-neutral-800">
                        {currencyFormatter(
                          dotsUser?.wallet.pending_amount / 100,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}{" "}
                        USD
                      </div>
                    ) : (
                      <div className="h-8 w-32 animate-pulse rounded bg-neutral-200" />
                    )}
                  </div>
                </div>
              </div>
              {dotsUser?.payout_methods.length === 0 ? (
                <AnimatedEmptyState
                  title="No payout methods connected"
                  description="Connect a payout method to start withdrawing funds"
                  cardContent={() => (
                    <>
                      <GreekTemple className="size-4 text-neutral-700" />
                      <div className="h-2.5 w-24 min-w-0 rounded-sm bg-neutral-200" />
                    </>
                  )}
                  addButton={
                    <Button
                      text="Connect payout method"
                      onClick={() => handleExecution("manage-payouts")}
                      loading={isExecuting}
                    />
                  }
                />
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-neutral-900">
                      Payout methods
                    </p>
                    <Button
                      text="Manage"
                      variant="secondary"
                      onClick={() => handleExecution("manage-payouts")}
                      loading={isExecuting}
                      className="h-8 w-fit px-2"
                    />
                  </div>
                  <div className="grid gap-4">
                    {dotsUser.payout_methods.map(
                      ({ platform, default: isDefault }) => (
                        <PayoutMethodCard
                          key={platform}
                          platform={platform}
                          isDefault={isDefault}
                        />
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full border border-neutral-200">
                  <Note className="size-5 text-neutral-700" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">
                    Compliance documents
                  </p>
                  {dotsUser.compliance.submitted ? (
                    <div className="flex items-center gap-1">
                      <CheckCircleFill className="size-4 text-green-600" />
                      <p className="text-sm text-neutral-500">
                        {partner.country === "US"
                          ? "W-9 submitted"
                          : "W8-BEN submitted"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">
                      W8-BEN (non-US) / W-9 (US) Required to withdraw payouts
                    </p>
                  )}
                </div>
              </div>
              <Button
                text={dotsUser.compliance.submitted ? "Update" : "Submit"}
                variant="secondary"
                onClick={() => handleExecution("compliance")}
                loading={isExecuting}
                className="h-8 w-fit px-2"
              />
            </div>
          </div>
        ) : !isLoading ? (
          <AnimatedEmptyState
            title="Verify your phone number"
            description="Verify your phone number to set up payouts"
            cardContent={() => (
              <>
                <MobilePhone className="size-4 text-neutral-700" />
                <div className="h-2.5 w-24 min-w-0 rounded-sm bg-neutral-200" />
              </>
            )}
            addButton={
              <Button
                text="Verify phone number"
                onClick={() => handleExecution("manage-payouts")}
                loading={isExecuting}
              />
            }
          />
        ) : (
          <LayoutLoader />
        )}
      </div>
    </>
  );
}
