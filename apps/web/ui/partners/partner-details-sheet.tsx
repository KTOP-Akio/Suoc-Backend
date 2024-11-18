import usePayouts from "@/lib/swr/use-payouts";
import usePayoutsCount from "@/lib/swr/use-payouts-count";
import useWorkspace from "@/lib/swr/use-workspace";
import { EnrolledPartnerProps } from "@/lib/types";
import { PAYOUTS_MAX_PAGE_SIZE } from "@/lib/zod/schemas/partners";
import { X } from "@/ui/shared/icons";
import {
  Button,
  buttonVariants,
  Sheet,
  StatusBadge,
  Table,
  ToggleGroup,
  useCopyToClipboard,
  useTable,
  useTablePagination,
} from "@dub/ui";
import { Copy, GreekTemple, Link4 } from "@dub/ui/src/icons";
import {
  cn,
  COUNTRIES,
  currencyFormatter,
  DICEBEAR_AVATAR_URL,
  formatDate,
  getPrettyUrl,
} from "@dub/utils";
import Link from "next/link";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";
import { AnimatedEmptyState } from "../shared/animated-empty-state";
import { PartnerStatusBadges } from "./partner-status-badges";
import { PayoutStatusBadges } from "./payout-status-badges";

type PartnerDetailsSheetProps = {
  partner: EnrolledPartnerProps;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

function PartnerDetailsSheetContent({ partner }: PartnerDetailsSheetProps) {
  const badge = PartnerStatusBadges[partner.status];

  const saleAmount = (partner.link?.saleAmount ?? 0) / 100;
  const earnings = (partner.earnings ?? 0) / 100;

  const [, copyToClipboard] = useCopyToClipboard();

  const [selectedTab, setSelectedTab] = useState<"overview" | "payouts">(
    "overview",
  );

  return (
    <>
      <div>
        <div className="flex items-start justify-between border-b border-neutral-200 p-6">
          <Sheet.Title className="text-xl font-semibold">
            Partner details
          </Sheet.Title>
          <Sheet.Close asChild>
            <Button
              variant="outline"
              icon={<X className="size-5" />}
              className="h-auto w-fit p-1"
            />
          </Sheet.Close>
        </div>
        <div className="p-6">
          {/* Basic info */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col">
              <img
                src={partner.image || `${DICEBEAR_AVATAR_URL}${partner.name}`}
                alt={partner.name}
                className="size-12 rounded-full"
              />
              <div className="mt-4 flex items-center gap-2">
                <span className="text-lg font-semibold text-neutral-900">
                  {partner.name}
                </span>
                {badge && (
                  <StatusBadge icon={null} variant={badge.variant}>
                    {badge.label}
                  </StatusBadge>
                )}
              </div>
            </div>
            <div className="flex min-w-[40%] shrink grow basis-1/2 flex-wrap items-center justify-end gap-2">
              {partner.link && (
                <button
                  type="button"
                  title="Copy link"
                  onClick={() => {
                    if (!partner.link) return;
                    toast.promise(copyToClipboard(partner.link.shortLink), {
                      success: "Copied to clipboard",
                    });
                  }}
                  className="group flex min-w-0 items-center gap-1 overflow-hidden rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700 transition-colors duration-100 hover:bg-neutral-200/70 active:bg-neutral-200"
                >
                  <div className="relative size-3 shrink-0 text-neutral-600">
                    <Link4 className="absolute left-0 top-0 size-3 transition-[opacity,transform] duration-150 group-hover:-translate-y-2 group-hover:opacity-0" />
                    <Copy className="absolute left-0 top-0 size-3 translate-y-2 opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100" />
                  </div>
                  <span className="truncate">
                    {getPrettyUrl(partner.link.shortLink)}
                  </span>
                </button>
              )}
              {partner.country && (
                <div className="flex min-w-20 items-center gap-2 rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                  <img
                    alt=""
                    src={`https://flag.vercel.app/m/${partner.country}.svg`}
                    className="h-3 w-4"
                  />
                  <span className="truncate">{COUNTRIES[partner.country]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex divide-x divide-neutral-200">
            {[
              [
                "Revenue",
                !partner.link
                  ? "-"
                  : currencyFormatter(saleAmount, {
                      minimumFractionDigits: saleAmount % 1 === 0 ? 0 : 2,
                      maximumFractionDigits: 2,
                    }),
              ],
              ["Sales", !partner.link ? "-" : partner.link?.sales],
              [
                "Earnings",
                currencyFormatter(earnings, {
                  minimumFractionDigits: earnings % 1 === 0 ? 0 : 2,
                  maximumFractionDigits: 2,
                }),
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col px-5 first:pl-0">
                <span className="text-xs text-neutral-500">{label}</span>
                <span className="text-base text-neutral-900">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <ToggleGroup
              className="grid w-full grid-cols-2 rounded-lg border-transparent bg-neutral-100 p-0.5"
              optionClassName="justify-center text-neutral-600 hover:text-neutral-700"
              indicatorClassName="rounded-md bg-white"
              options={[
                { value: "overview", label: "Overview" },
                { value: "payouts", label: "Payouts" },
              ]}
              selected={selectedTab}
              selectAction={(value) => setSelectedTab(value as any)}
            />
          </div>
          <div className="mt-6">
            {selectedTab === "overview" && (
              <div className="flex flex-col gap-6 text-sm text-neutral-500">
                <h3 className="text-base font-semibold text-neutral-900">
                  About this partner
                </h3>

                <div>
                  <h4 className="font-semibold text-neutral-900">
                    Description
                  </h4>
                  <p className="mt-1.5">
                    {partner.bio || (
                      <span className="italic text-neutral-400">
                        No description provided
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {selectedTab === "payouts" && <PartnerPayouts partner={partner} />}
          </div>
        </div>
      </div>
      <div className="flex grow flex-col justify-end">
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 p-5">
          WIP
        </div>
      </div>
    </>
  );
}

function PartnerPayouts({ partner }: { partner: EnrolledPartnerProps }) {
  const { slug } = useWorkspace();

  const { payoutsCount, error: payoutsCountError } = usePayoutsCount({
    query: { partnerId: partner.id },
  });

  const { pagination, setPagination } = useTablePagination({
    page: 1,
    pageSize: PAYOUTS_MAX_PAGE_SIZE,
  });

  const { payouts, error: payoutsError } = usePayouts({
    query: { partnerId: partner.id },
  });

  const countLoading = !payoutsCount && !payoutsCountError;
  const payoutsLoading = !payouts && !payoutsError;
  const isLoading = countLoading || payoutsLoading;

  const showPagination =
    payoutsCount?.all && payoutsCount.all > PAYOUTS_MAX_PAGE_SIZE;

  const table = useTable({
    data: payouts || [],
    loading: isLoading,
    error:
      payoutsError || payoutsCountError ? "Failed to load payouts" : undefined,
    columns: [
      {
        id: "periodEnd",
        header: "Period End",
        accessorFn: (d) => formatDate(d.periodStart, { month: "short" }),
      },
      {
        header: "Status",
        cell: ({ row }) => {
          const badge = PayoutStatusBadges[row.original.status];
          return badge ? (
            <StatusBadge icon={badge.icon} variant={badge.variant}>
              {badge.label}
            </StatusBadge>
          ) : (
            "-"
          );
        },
      },
      {
        id: "total",
        header: "Total",
        accessorFn: (d) =>
          currencyFormatter(d.total / 100, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
      },
    ],
    ...(showPagination && {
      pagination,
      onPaginationChange: setPagination,
      rowCount: payoutsCount?.all || 0,
    }),
    resourceName: (p) => `payout${p ? "s" : ""}`,
    thClassName: (id) =>
      cn(id === "total" && "[&>div]:justify-end", "border-l-0"),
    tdClassName: (id) => cn(id === "total" && "text-right", "border-l-0"),
    className: cn(
      !showPagination && "[&_tr:last-child>td]:border-b-transparent", // Hide bottom row border
    ),
    scrollWrapperClassName: "min-h-[40px]",
  } as any);

  return payouts?.length || isLoading ? (
    <>
      <Table {...table} />
      <div className="mt-2 flex justify-end">
        <Link
          href={`/${slug}/programs/${partner.programId}/payouts?partnerId=${partner.id}`}
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "flex h-7 items-center rounded-lg border px-2 text-sm",
          )}
        >
          View all
        </Link>
      </div>
    </>
  ) : (
    <AnimatedEmptyState
      className="md:min-h-96"
      title="No payouts"
      description="When this partner is eligible for or has received payouts, they will appear here."
      cardContent={() => (
        <>
          <div className="flex size-7 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50">
            <GreekTemple className="size-4 text-neutral-700" />
          </div>
          <div className="h-2.5 w-28 min-w-0 rounded-sm bg-neutral-200" />
        </>
      )}
    />
  );
}

export function PartnerDetailsSheet({
  isOpen,
  ...rest
}: PartnerDetailsSheetProps & {
  isOpen: boolean;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={rest.setIsOpen}>
      <PartnerDetailsSheetContent {...rest} />
    </Sheet>
  );
}

export function usePartnerDetailsSheet({
  partner,
}: Omit<PartnerDetailsSheetProps, "setIsOpen">) {
  const [isOpen, setIsOpen] = useState(false);

  return {
    partnerDetailsSheet: (
      <PartnerDetailsSheet
        partner={partner}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    ),
    setIsOpen,
  };
}
