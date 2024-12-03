"use client";

import { createManualPayoutAction } from "@/lib/actions/partners/create-manual-payout";
import { AnalyticsResponseOptions } from "@/lib/analytics/types";
import usePartners from "@/lib/swr/use-partners";
import useProgram from "@/lib/swr/use-program";
import useWorkspace from "@/lib/swr/use-workspace";
import { createManualPayoutSchema } from "@/lib/zod/schemas/payouts";
import { X } from "@/ui/shared/icons";
import {
  Button,
  Combobox,
  DateRangePicker,
  Sheet,
  useRouterStuff,
} from "@dub/ui";
import {
  capitalize,
  cn,
  currencyFormatter,
  DICEBEAR_AVATAR_URL,
  fetcher,
  formatDate,
} from "@dub/utils";
import { nFormatter } from "@dub/utils/src/functions";
import { PayoutType } from "@prisma/client";
import {
  endOfMonth,
  endOfQuarter,
  endOfYear,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subMonths,
} from "date-fns";
import { useAction } from "next-safe-action/hooks";
import {
  Dispatch,
  Fragment,
  ReactNode,
  SetStateAction,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { z } from "zod";

interface CreatePayoutSheetProps {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const schema = createManualPayoutSchema.pick({
  partnerId: true,
  type: true,
  start: true,
  end: true,
  amount: true,
  description: true,
});

type FormData = z.infer<typeof schema>;

function CreatePayoutSheetContent({ setIsOpen }: CreatePayoutSheetProps) {
  const dateRangePickerId = useId();
  const { program } = useProgram();
  const { data: partners } = usePartners();
  const { id: workspaceId } = useWorkspace();
  const { queryParams } = useRouterStuff();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    clearErrors,
  } = useForm<FormData>({
    defaultValues: {
      type: "sales",
    },
  });

  const partnerId = watch("partnerId");
  const payoutType = watch("type");
  const start = watch("start");
  const end = watch("end");
  const amount = watch("amount");

  const partnerOptions = useMemo(() => {
    return partners?.map((partner) => ({
      value: partner.id,
      label: partner.name,
      icon: (
        <img
          src={
            partner.image ||
            `https://api.dicebear.com/9.x/micah/svg?seed=${partner.id}`
          }
          className="size-4 rounded-full"
        />
      ),
    }));
  }, [partners]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const searchParams = new URLSearchParams({
        workspaceId: workspaceId!,
        event: payoutType,
        start: start?.toISOString() || "",
        end: end?.toISOString() || "",
        page: "1",
        sortBy: "timestamp",
        order: "desc",
      });

      const response = await fetch(`/api/events?${searchParams.toString()}`);
      const events = await response.json();
    };

    if (payoutType === "custom" || !start || !end) {
      return;
    }

    const partner = partners?.find((p) => p.id === partnerId);

    if (!partner) {
      return;
    }

    fetchAnalytics();
  }, [partnerId, start, end, payoutType]);

  const { executeAsync, isExecuting } = useAction(createManualPayoutAction, {
    onSuccess: async (res) => {
      toast.success("Successfully created payout!");
      setIsOpen(false);
      mutate(
        `/api/programs/${program?.id}/payouts?workspaceId=${workspaceId}&sortBy=periodStart&order=desc`,
      );
      const payoutId = res.data?.id;
      if (payoutId) {
        queryParams({ set: { payoutId } });
      }
    },
    onError({ error }) {
      toast.error(error.serverError);
    },
  });

  const onSubmit = async (data: FormData) => {
    if (workspaceId && program) {
      await executeAsync({
        ...data,
        workspaceId,
        programId: program.id,
        start: data.start ? data.start.toISOString() : null,
        end: data.end ? data.end.toISOString() : null,
      });
    }
  };

  const { data: totalEvents } = useSWR<{
    [key in AnalyticsResponseOptions]: number;
  }>(
    payoutType !== "custom" &&
      start &&
      end &&
      `/api/analytics?${new URLSearchParams({
        workspaceId: workspaceId!,
        event: payoutType,
        start: start?.toISOString() || "",
        end: end?.toISOString() || "",
      }).toString()}`,
    fetcher,
  );

  const invoiceData = useMemo(() => {
    const selectedPartner = partners?.find((p) => p.id === partnerId);

    const quantity = totalEvents?.[payoutType];
    const payoutAmount = quantity && amount ? quantity * amount : undefined;

    return {
      ...(selectedPartner && {
        Partner: (
          <div className="flex items-center gap-2">
            <img
              src={
                selectedPartner.image ||
                `${DICEBEAR_AVATAR_URL}${selectedPartner.id}`
              }
              alt={selectedPartner.name}
              className="size-5 rounded-full"
            />
            <div>{selectedPartner.name}</div>
          </div>
        ),
      }),

      ...(start &&
        end && {
          Period: `${formatDate(start, {
            month: "short",
            year:
              new Date(start).getFullYear() === new Date(end).getFullYear()
                ? undefined
                : "numeric",
          })}-${formatDate(end, { month: "short" })}`,
        }),

      ...(quantity && {
        [capitalize(payoutType) as string]: nFormatter(quantity, {
          full: true,
        }),
      }),

      ...(payoutAmount && {
        Amount: currencyFormatter(payoutAmount, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        Fee: currencyFormatter(payoutAmount * 0.02, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        Total: currencyFormatter(payoutAmount * 1.02, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      }),
    };
  }, [partnerId, partners, start, end, payoutType, totalEvents, amount]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
      <div>
        <div className="flex items-start justify-between border-b border-neutral-200 p-6">
          <Sheet.Title className="text-xl font-semibold">
            Create payout
          </Sheet.Title>
          <Sheet.Close asChild>
            <Button
              variant="outline"
              icon={<X className="size-5" />}
              className="h-auto w-fit p-1"
            />
          </Sheet.Close>
        </div>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-900">
              Partner
            </label>
            <Combobox
              selected={
                partnerOptions?.find((o) => o.value === partnerId) ?? null
              }
              setSelected={(option) => {
                if (option) {
                  setValue("partnerId", option.value);
                  clearErrors("partnerId");
                }
              }}
              options={partnerOptions}
              caret={true}
              placeholder="Select partners"
              searchPlaceholder="Search..."
              matchTriggerWidth
              buttonProps={{
                className: cn(
                  "w-full justify-start border-gray-300 px-3",
                  "data-[state=open]:ring-1 data-[state=open]:ring-gray-500 data-[state=open]:border-gray-500",
                  "focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-none",
                  !partnerId && "text-gray-400",
                  errors.partnerId && "border-red-500",
                ),
              }}
            />
            {errors.partnerId && (
              <p className="text-xs text-red-600">{errors.partnerId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="type"
              className="flex items-center space-x-2 text-sm font-medium text-gray-900"
            >
              Reward type
            </label>
            <select
              {...register("type", { required: true })}
              className="block w-full rounded-md border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-gray-500 sm:text-sm"
            >
              {Object.values(PayoutType).map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {payoutType !== "sales" && (
            <div>
              <label
                htmlFor="amount"
                className="text-sm font-medium text-neutral-800"
              >
                Reward amount
              </label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-neutral-400">
                  $
                </span>
                <input
                  className={cn(
                    "block w-full rounded-md border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 sm:text-sm",
                    "pl-6 pr-[6.5rem]",
                    payoutType === "custom" && "pr-12",
                  )}
                  {...register("amount", {
                    required: true,
                  })}
                  autoComplete="off"
                  placeholder="5"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-neutral-400">
                  USD
                  {payoutType !== "custom" &&
                    ` per ${payoutType.replace(/s$/, "")}`}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor={dateRangePickerId}
              className="block text-sm font-medium text-gray-700"
            >
              Payout period {payoutType === "custom" ? "(optional)" : ""}
            </label>
            <DateRangePicker
              id={dateRangePickerId}
              onChange={(dateRange) => {
                if (dateRange) {
                  setValue("start", dateRange.from!);
                  setValue("end", dateRange.to!);
                }
              }}
              align="end"
              presets={[
                {
                  id: "this-month",
                  label: "This month",
                  dateRange: {
                    from: startOfMonth(new Date()),
                    to: endOfMonth(new Date()),
                  },
                },
                {
                  id: "last-month",
                  label: "Last month",
                  dateRange: {
                    from: startOfMonth(subMonths(new Date(), 1)),
                    to: endOfMonth(subMonths(new Date(), 1)),
                  },
                },
                {
                  id: "this-quarter",
                  label: "This quarter",
                  dateRange: {
                    from: startOfQuarter(new Date()),
                    to: endOfQuarter(new Date()),
                  },
                },
                {
                  id: "this-year",
                  label: "This year",
                  dateRange: {
                    from: startOfYear(new Date()),
                    to: endOfYear(new Date()),
                  },
                },
              ]}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="description"
              className="flex items-center space-x-2 text-sm font-medium text-gray-900"
            >
              Description (optional)
            </label>
            <textarea
              {...register("description")}
              className="block w-full rounded-md border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-gray-500 sm:text-sm"
              placeholder="A note to partner about this payout."
            />
          </div>

          {Object.entries(invoiceData).length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-neutral-800">Summary</p>
              <div className="grid grid-cols-2 gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                {Object.entries(invoiceData).map(([key, value]) => (
                  <Fragment key={key}>
                    <div className="font-medium text-neutral-500">{key}</div>
                    <div className="text-neutral-800">
                      {value as ReactNode | string}
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex grow flex-col justify-end">
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 p-5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsOpen(false)}
            text="Cancel"
            className="w-fit"
            disabled={isExecuting}
          />
          <Button
            type="submit"
            variant="primary"
            text="Create payout"
            className="w-fit"
            loading={isExecuting}
            // disabled={!isValid}
          />
        </div>
      </div>
    </form>
  );
}

export function CreatePayoutSheet({
  isOpen,
  ...rest
}: CreatePayoutSheetProps & {
  isOpen: boolean;
}) {
  const { queryParams } = useRouterStuff();

  return (
    <Sheet
      open={isOpen}
      onOpenChange={rest.setIsOpen}
      onClose={() => queryParams({ del: "partnerId" })}
    >
      <CreatePayoutSheetContent {...rest} />
    </Sheet>
  );
}

export function useCreatePayoutSheet() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    createPayoutSheet: (
      <CreatePayoutSheet setIsOpen={setIsOpen} isOpen={isOpen} />
    ),
    setIsOpen,
  };
}
