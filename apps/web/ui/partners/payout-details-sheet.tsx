import { createDotsTransferAction } from "@/lib/actions/partners/create-dots-transfer";
import useWorkspace from "@/lib/swr/use-workspace";
import { PayoutWithPartnerProps, PayoutWithSalesProps } from "@/lib/types";
import { X } from "@/ui/shared/icons";
import {
  Button,
  Sheet,
  StatusBadge,
  Table,
  useTable,
  useTablePagination,
} from "@dub/ui";
import {
  capitalize,
  cn,
  currencyFormatter,
  DICEBEAR_AVATAR_URL,
  fetcher,
  formatDate,
  formatDateTime,
} from "@dub/utils";
import { useAction } from "next-safe-action/hooks";
import { useParams } from "next/navigation";
import { Dispatch, Fragment, SetStateAction, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { PayoutStatusBadges } from "./payout-status-badges";
import { SaleRowMenu } from "./sale-row-menu";

type PayoutDetailsSheetProps = {
  payout: PayoutWithPartnerProps;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

function PayoutDetailsSheetContent({
  payout,
  setIsOpen,
}: PayoutDetailsSheetProps) {
  const { id: workspaceId } = useWorkspace();
  const { programId } = useParams() as { programId: string };

  const { data: payoutWithSales, error } = useSWR<PayoutWithSalesProps>(
    `/api/programs/${programId}/payouts/${payout.id}?workspaceId=${workspaceId}`,
    fetcher,
  );

  const totalConversions = payoutWithSales?.sales?.length || 0;
  const loading = !payoutWithSales && !error;
  const canConfirmPayout = payout.status === "pending";
  const showPagination = totalConversions > 100;

  const invoiceData = useMemo(() => {
    const statusBadge = PayoutStatusBadges[payout.status];

    return {
      Partner: (
        <div className="flex items-center gap-2">
          <img
            src={
              payout.partner.image ||
              `${DICEBEAR_AVATAR_URL}${payout.partner.name}`
            }
            alt={payout.partner.name}
            className="size-5 rounded-full"
          />
          <div>{payout.partner.name}</div>
        </div>
      ),
      Period: `${formatDate(payout.periodStart, {
        month: "short",
        year:
          new Date(payout.periodStart).getFullYear() ===
          new Date(payout.periodEnd).getFullYear()
            ? undefined
            : "numeric",
      })}-${formatDate(payout.periodEnd, { month: "short" })}`,
      Sales: totalConversions,
      Amount: currencyFormatter(payout.amount / 100, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      Fee: currencyFormatter(payout.fee / 100, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      Total: currencyFormatter(payout.total / 100, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      Status: (
        <StatusBadge variant={statusBadge.variant} icon={statusBadge.icon}>
          {statusBadge.label}
        </StatusBadge>
      ),
    };
  }, [payout, totalConversions]);

  const { pagination, setPagination } = useTablePagination({
    pageSize: 100,
    page: 1,
  });

  const table = useTable({
    data:
      payoutWithSales?.sales?.filter(
        ({ status }) => !["duplicate", "fraud"].includes(status),
      ) || [],
    columns: [
      {
        header: "Sale",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm text-neutral-700">
              {row.original.customer.email || row.original.customer.name}
            </span>
            <span className="text-xs text-neutral-500">
              {formatDateTime(row.original.createdAt)}
            </span>
          </div>
        ),
      },
      {
        id: "total",
        header: "Total",
        cell: ({ row }) =>
          currencyFormatter(row.original.earnings / 100, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
      },
      // Menu
      {
        id: "menu",
        enableHiding: false,
        minSize: 43,
        size: 43,
        maxSize: 43,
        cell: ({ row }) => <SaleRowMenu row={row} />,
      },
    ],
    ...(showPagination && {
      pagination,
      onPaginationChange: setPagination,
      rowCount: totalConversions,
    }),
    columnPinning: { right: ["menu"] },
    thClassName: (id) =>
      cn(id === "total" && "[&>div]:justify-end", "border-l-0"),
    tdClassName: (id) => cn(id === "total" && "text-right", "border-l-0"),
    className: cn(
      !showPagination && "[&_tr:last-child>td]:border-b-transparent", // Hide bottom row border
    ),
    scrollWrapperClassName: "min-h-[40px]",
    resourceName: (p) => `sale${p ? "s" : ""}`,
    loading,
    error: error ? "Failed to load sales" : undefined,
  } as any);

  const { executeAsync, isExecuting } = useAction(createDotsTransferAction, {
    onSuccess: async () => {
      await mutate(
        (key) =>
          typeof key === "string" &&
          key.startsWith(`/api/programs/${programId}/payouts`),
        undefined,
        { revalidate: true },
      );
      toast.success("Successfully confirmed payout!");
      setIsOpen(false);
    },
    onError({ error }) {
      toast.error(error.serverError?.serverError);
    },
  });

  return (
    <>
      <div>
        <div className="flex items-start justify-between border-b border-neutral-200 p-6">
          <Sheet.Title className="text-xl font-semibold">
            {capitalize(payout.status)} payout
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
          <div className="text-base font-medium text-neutral-900">
            Invoice details
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(invoiceData).map(([key, value]) => (
              <Fragment key={key}>
                <div className="font-medium text-neutral-500">{key}</div>
                <div className="text-neutral-800">{value}</div>
              </Fragment>
            ))}
          </div>
        </div>
        <div className="p-6 pt-2">
          <Table {...table} />
        </div>
      </div>
      <div className="flex grow flex-col justify-end">
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 p-5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsOpen(false)}
            text={canConfirmPayout ? "Cancel" : "Close"}
            className="w-fit"
          />
          {canConfirmPayout && (
            <Button
              type="button"
              variant="primary"
              loading={isExecuting}
              onClick={async () => {
                if (!payout.partner.dotsUserId) {
                  toast.error("Partner has no Dots user ID");
                  return;
                }
                await executeAsync({
                  workspaceId: workspaceId!,
                  payoutId: payout.id,
                });
              }}
              text="Confirm payout"
              className="w-fit"
            />
          )}
        </div>
      </div>
    </>
  );
}

export function PayoutDetailsSheet({
  isOpen,
  ...rest
}: PayoutDetailsSheetProps & {
  isOpen: boolean;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={rest.setIsOpen}>
      <PayoutDetailsSheetContent {...rest} />
    </Sheet>
  );
}

export function usePayoutDetailsSheet({
  payout,
}: Omit<PayoutDetailsSheetProps, "setIsOpen">) {
  const [isOpen, setIsOpen] = useState(false);

  return {
    payoutDetailsSheet: (
      <PayoutDetailsSheet
        payout={payout}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    ),
    setIsOpen,
  };
}
