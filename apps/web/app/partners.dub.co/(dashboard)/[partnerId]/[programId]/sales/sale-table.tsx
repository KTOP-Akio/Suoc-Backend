"use client";

import usePartnerAnalytics from "@/lib/swr/use-partner-analytics";
import usePartnerEvents from "@/lib/swr/use-partner-events";
import { AnimatedEmptyState } from "@/ui/shared/animated-empty-state";
import SimpleDateRangePicker from "@/ui/shared/simple-date-range-picker";
import { Table, usePagination, useRouterStuff, useTable } from "@dub/ui";
import { CircleDollar } from "@dub/ui/src/icons";
import { currencyFormatter, formatDate } from "@dub/utils";

export function SaleTablePartner({ limit }: { limit?: number }) {
  const { queryParams, searchParamsObj } = useRouterStuff();

  const {
    start,
    end,
    interval,
    sortBy = "timestamp",
    order = "desc",
  } = searchParamsObj as {
    start?: string;
    end?: string;
    interval?: string;
    sortBy?: "timestamp";
    order?: "asc" | "desc";
  };

  const { data: { sales: totalSaleEvents } = {} } = usePartnerAnalytics({
    interval: interval as any,
    start: start ? new Date(start) : undefined,
    end: end ? new Date(end) : undefined,
  });

  const {
    data: saleEvents,
    loading,
    error,
  } = usePartnerEvents({
    event: "sales",
    interval: interval as any,
    start: start ? new Date(start) : undefined,
    end: end ? new Date(end) : undefined,
    order,
    sortBy,
  });

  const { pagination, setPagination } = usePagination(limit);

  const { table, ...tableProps } = useTable({
    data: saleEvents?.slice(0, limit) || [],
    loading,
    error: error ? "Failed to fetch sales events." : undefined,
    columns: [
      {
        id: "timestamp",
        header: "Date",
        accessorKey: "timestamp",
        cell: ({ row }) => {
          return formatDate(row.original.timestamp, { month: "short" });
        },
      },
      {
        id: "customer",
        header: "Customer",
        accessorKey: "customer",
        cell: ({ row }) => {
          return row.original.customer.email;
        },
      },
      {
        id: "saleAmount",
        header: "Sale Amount",
        accessorKey: "sale",
        cell: ({ row }) => {
          return currencyFormatter(row.original.sale.amount / 100, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
      },
      {
        id: "earnings",
        header: "Earnings",
        accessorKey: "earnings",
        cell: ({ row }) => {
          return currencyFormatter(row.original.earnings / 100, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
      },
    ],
    ...(!limit && {
      pagination,
      onPaginationChange: setPagination,
      sortableColumns: ["timestamp"],
      sortBy,
      sortOrder: order,
      onSortChange: ({ sortBy, sortOrder }) =>
        queryParams({
          set: {
            ...(sortBy && { sort: sortBy }),
            ...(sortOrder && { order: sortOrder }),
          },
        }),
    }),
    rowCount: totalSaleEvents,
    emptyState: (
      <AnimatedEmptyState
        title="No sales found"
        description="No sales have been made for this program yet."
        cardContent={() => (
          <>
            <CircleDollar className="size-4 text-neutral-700" />
            <div className="h-2.5 w-24 min-w-0 rounded-sm bg-neutral-200" />
          </>
        )}
      />
    ),
    resourceName: (plural) => `sale${plural ? "s" : ""}`,
  });

  return loading || saleEvents?.length ? (
    <div className="flex flex-col gap-3">
      {!limit && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {loading ? (
            <>
              <div className="h-10 w-full animate-pulse rounded-md bg-neutral-200 md:w-32" />
            </>
          ) : (
            <>
              <SimpleDateRangePicker className="w-full sm:min-w-[200px] md:w-fit" />
            </>
          )}
        </div>
      )}
      <Table
        {...tableProps}
        table={table}
        containerClassName="border-neutral-300"
      />
    </div>
  ) : (
    <AnimatedEmptyState
      title="No sales found"
      description="No sales have been made for this program yet."
      cardContent={() => (
        <>
          <CircleDollar className="size-4 text-neutral-700" />
          <div className="h-2.5 w-24 min-w-0 rounded-sm bg-neutral-200" />
        </>
      )}
    />
  );
}
