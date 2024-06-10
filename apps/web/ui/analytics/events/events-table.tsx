"use client";

import { editQueryString } from "@/lib/analytics/utils";
import { clickEventEnrichedSchema } from "@/lib/zod/schemas/clicks";
import { leadEventEnrichedSchema } from "@/lib/zod/schemas/leads";
import { saleEventEnrichedSchema } from "@/lib/zod/schemas/sales";
import { Filter } from "@/ui/shared/icons";
import {
  Button,
  CursorRays,
  LinkLogo,
  LoadingSpinner,
  QRCode,
  Tooltip,
  useRouterStuff,
} from "@dub/ui";
import { SortOrder } from "@dub/ui/src/icons";
import {
  COUNTRIES,
  capitalize,
  cn,
  fetcher,
  getApexDomain,
  nFormatter,
  truncate,
} from "@dub/utils";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useContext, useEffect, useMemo } from "react";
import useSWR from "swr";
import z from "zod";
import { AnalyticsContext } from "../analytics-provider";
import DeviceIcon from "../device-icon";
import usePagination from "./use-pagination";

const PAGE_SIZE = 100;
const tableCellClassName =
  "border-r border-b border-gray-200 px-4 py-2.5 text-left text-sm leading-6 whitespace-nowrap overflow-hidden [&>.flex]:pr-4";

type EventType = "clicks" | "leads" | "sales";

type Datum =
  | z.infer<typeof clickEventEnrichedSchema>
  | z.infer<typeof leadEventEnrichedSchema>
  | z.infer<typeof saleEventEnrichedSchema>;

const eventColumns: Record<
  EventType,
  { all: string[]; defaultVisible: string[] }
> = {
  clicks: {
    all: ["trigger", "link", "country", "device", "timestamp"],
    defaultVisible: ["trigger", "link", "country", "device", "timestamp"],
  },
  leads: {
    all: ["event", "link", "customer", "country", "device", "timestamp"],
    defaultVisible: [
      "event",
      "link",
      "customer",
      "country",
      "device",
      "timestamp",
    ],
  },
  sales: {
    all: [
      "event",
      "invoiceId",
      "link",
      "country",
      "device",
      "amount",
      "timestamp",
    ],
    defaultVisible: ["event", "link", "country", "amount", "timestamp"],
  },
};

const FilterButton = () => (
  <div className="group-hover:animate-slide-left-fade absolute right-0 rounded-lg border border-gray-200 bg-white p-1 opacity-0 shadow-lg group-hover:opacity-100">
    <span className="sr-only">Filter</span>
    <Filter className="h-3 w-3 text-black" />
  </div>
);

export default function EventsTable() {
  const { searchParams, queryParams } = useRouterStuff();
  const tab = searchParams.get("tab") || "clicks";

  const sortBy = searchParams.get("sort") || "timestamp";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  const { pagination, setPagination } = usePagination(PAGE_SIZE);

  const columns = useMemo<ColumnDef<Datum, any>[]>(
    () =>
      [
        // Click trigger
        {
          id: "trigger",
          header: "Event",
          accessorKey: "qr",
          cell: ({ getValue }) => (
            <div className="flex items-center gap-3">
              {getValue() ? (
                <>
                  <QRCode className="h-4 w-4" />
                  QR scan
                </>
              ) : (
                <>
                  <CursorRays className="h-4 w-4" />
                  Link click
                </>
              )}
            </div>
          ),
        },
        // Lead/sale event name
        {
          id: "event",
          header: "Event",
          accessorKey: "event_name",
          cell: ({ getValue }) =>
            getValue() || <span className="text-gray-400">-</span>,
        },
        // Sale invoice ID
        {
          id: "invoiceId",
          header: "Invoice ID",
          accessorKey: "invoice_id",
          cell: ({ getValue }) =>
            getValue() || <span className="text-gray-400">-</span>,
        },
        {
          id: "link",
          header: "Link",
          accessorKey: "link",
          cell: ({ getValue }) => (
            <Link
              href={
                queryParams({
                  set: {
                    domain: getValue().domain,
                    key: getValue().key,
                  },
                  getNewPath: true,
                }) as string
              }
              className="group relative flex items-center gap-3"
            >
              <LinkLogo
                apexDomain={getApexDomain(getValue().url)}
                className="h-4 w-4 sm:h-4 sm:w-4"
              />
              <span>
                <span className="font-medium text-gray-950">
                  {getValue().domain}
                </span>
                {getValue().key === "_root" ? "" : `/${getValue().key}`}
              </span>
              <FilterButton />
            </Link>
          ),
        },
        {
          id: "customer",
          header: "Customer",
          accessorKey: "customer",
          cell: ({ getValue }) => {
            const display =
              truncate(getValue().name || getValue().email, 20) ?? "Unknown";
            return (
              <div className="flex items-center gap-3">
                <img
                  alt={display}
                  src={getValue().avatar}
                  className="h-4 w-4 rounded-full border border-gray-200"
                />
                <span>{display}</span>
              </div>
            );
          },
        },
        {
          id: "country",
          header: "Country",
          accessorKey: "country",
          cell: ({ getValue }) => (
            <Link
              href={
                queryParams({
                  set: {
                    country: getValue(),
                  },
                  getNewPath: true,
                }) as string
              }
              className="group relative flex items-center gap-3"
            >
              <img
                alt={getValue()}
                src={`https://hatscripts.github.io/circle-flags/flags/${getValue().toLowerCase()}.svg`}
                className="h-4 w-4"
              />
              <span>{COUNTRIES[getValue()] ?? getValue()}</span>
              <FilterButton />
            </Link>
          ),
        },
        {
          id: "device",
          header: "Device",
          accessorKey: "device",
          cell: ({ getValue }) => (
            <Link
              href={
                queryParams({
                  set: {
                    device: getValue(),
                  },
                  getNewPath: true,
                }) as string
              }
              className="group relative flex items-center gap-3"
            >
              <DeviceIcon
                display={capitalize(getValue()) ?? getValue()}
                tab="devices"
                className="h-4 w-4"
              />
              <span>{getValue()}</span>
              <FilterButton />
            </Link>
          ),
        },
        // Date
        {
          id: "timestamp",
          header: "Date",
          accessorFn: (d) => new Date(d.timestamp),
          cell: ({ getValue }) => (
            <Tooltip
              content={getValue().toLocaleTimeString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hour12: true,
              })}
            >
              <span>
                {getValue().toLocaleTimeString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                })}
              </span>
            </Tooltip>
          ),
        },
        // Sales amount
        {
          id: "amount",
          header: "Sales Amount",
          accessorKey: "amount",
          cell: ({ getValue }) => (
            <div className="flex items-center gap-2">
              <span>${nFormatter(getValue() / 100)}</span>
              <span className="text-gray-400">USD</span>
            </div>
          ),
        },
      ].filter((c) => eventColumns[tab].all.includes(c.id)),
    [tab],
  );

  const defaultData = useMemo(() => [], []);

  const { queryString, totalEvents } = useContext(AnalyticsContext);

  const { data, isLoading, error } = useSWR<Datum[]>(
    `/api/analytics/events?${editQueryString(queryString, {
      event: tab,
      offset: (pagination.pageIndex * pagination.pageSize).toString(),
      limit: pagination.pageSize.toString(),
      sortBy,
      order,
    }).toString()}`,
    fetcher,
    {
      keepPreviousData: true,
    },
  );

  const table = useReactTable({
    data: data ?? defaultData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    rowCount: totalEvents?.[tab] ?? 0,
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
    manualPagination: true,
    autoResetPageIndex: false,
    manualSorting: true,
  });

  useEffect(() => {
    // reset page index when tab or filters change
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [tab, queryString]);

  return (
    <div className="border border-gray-200 bg-white sm:rounded-xl">
      <div className="relative rounded-[inherit]">
        {(!error && !!data?.length) || isLoading ? (
          <div className="min-h-[400px] overflow-x-auto rounded-[inherit]">
            <table
              className={cn(
                "w-full border-separate border-spacing-0",

                // Remove side borders from table to avoid interfering with outer border
                "[&_thead_tr:first-child>*]:border-t-0", // Top row
                "[&_tr>*:first-child]:border-l-0", // Left column
                "[&_tr>*:last-child]:border-r-0", // Right column
              )}
            >
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const isSortableColumn = ["timestamp", "amount"].includes(
                        header.column.id,
                      );
                      return (
                        <th
                          key={header.id}
                          className={cn(tableCellClassName, "font-medium")}
                          style={{ width: `${header.getSize()}px` }}
                        >
                          <button
                            className="flex items-center gap-2"
                            disabled={!isSortableColumn}
                            onClick={() =>
                              queryParams({
                                set: {
                                  sort: header.column.id,
                                  order:
                                    sortBy !== header.column.id
                                      ? "desc"
                                      : order === "asc"
                                        ? "desc"
                                        : "asc",
                                },
                              })
                            }
                            aria-label="Sort by column"
                          >
                            <span>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                            </span>
                            {isSortableColumn && (
                              <SortOrder
                                order={
                                  sortBy === header.column.id ? order : null
                                }
                              />
                            )}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(tableCellClassName, "text-gray-600")}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-64 w-full items-center justify-center text-sm text-gray-500">
            {error ? "Failed to fetch data" : "No data available"}
          </div>
        )}
        <div className="sticky bottom-0 flex items-center justify-between rounded-b-[inherit] border-t border-gray-200 bg-white px-4 py-3.5 text-sm leading-6 text-gray-600">
          <div>
            Viewing{" "}
            <span className="font-medium">
              {pagination.pageIndex * pagination.pageSize + 1}-
              {Math.min(
                pagination.pageIndex * pagination.pageSize +
                  pagination.pageSize,
                table.getRowCount(),
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium">
              {table.getRowCount().toLocaleString()}
            </span>{" "}
            events
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              text="Previous"
              className="h-7 px-2"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            />
            <Button
              variant="secondary"
              text="Next"
              className="h-7 px-2"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            />
          </div>
        </div>

        {/* Loading/error overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-white/50"
            >
              <LoadingSpinner />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
