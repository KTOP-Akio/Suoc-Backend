"use client";

import { EnrolledPartnerProps, PartnerCounts } from "@/lib/types";
import { AnimatedEmptyState } from "@/ui/shared/animated-empty-state";
import { SearchBoxPersisted } from "@/ui/shared/search-box";
import {
  AnimatedSizeContainer,
  Filter,
  StatusBadge,
  Table,
  usePagination,
  useRouterStuff,
  useTable,
} from "@dub/ui";
import {
  CircleCheck,
  CircleHalfDottedClock,
  CircleXmark,
  OfficeBuilding,
} from "@dub/ui/src/icons";
import {
  currencyFormatter,
  DICEBEAR_AVATAR_URL,
  fetcher,
  formatDate,
} from "@dub/utils";
import { useMemo } from "react";
import useSWR from "swr";
import { usePartnerFilters } from "./use-partner-filters";

export const StatusBadges = {
  pending: {
    label: "Applied",
    variant: "pending",
    className: "text-orange-500",
    icon: CircleHalfDottedClock,
  },
  approved: {
    label: "Approved",
    variant: "success",
    className: "text-green-500",
    icon: CircleCheck,
  },
  rejected: {
    label: "Rejected",
    variant: "error",
    className: "text-red-500",
    icon: CircleXmark,
  },
};

export function PartnerTable({ programId }: { programId: string }) {
  const { queryParams, searchParams } = useRouterStuff();

  const sortBy = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  const {
    filters,
    activeFilters,
    onSelect,
    onRemove,
    onRemoveAll,
    searchQuery,
  } = usePartnerFilters({ sortBy, order });

  const { data: partnersCounts, error: countError } = useSWR<PartnerCounts[]>(
    `/api/programs/${programId}/partners/count?${searchQuery}`,
    fetcher,
  );

  const totalPartnersCount = useMemo(
    () => partnersCounts?.reduce((acc, { _count }) => acc + _count, 0) || 0,
    [partnersCounts],
  );

  const { data: partners, error } = useSWR<EnrolledPartnerProps[]>(
    `/api/programs/${programId}/partners?${searchQuery}`,
    fetcher,
  );

  const loading = (!partners || !partnersCounts) && !error && !countError;

  const { pagination, setPagination } = usePagination();

  const table = useTable({
    data: partners || [],
    columns: [
      {
        header: "Affiliate",
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <img
                src={
                  row.original.logo ||
                  `${DICEBEAR_AVATAR_URL}${row.original.name}`
                }
                alt={row.original.name}
                className="size-5 rounded-full"
              />
              <div>{row.original.name}</div>
            </div>
          );
        },
      },
      {
        id: "createdAt",
        header: "Enrolled",
        accessorFn: (d) => formatDate(d.createdAt, { month: "short" }),
      },
      {
        header: "Status",
        cell: ({ row }) => {
          const badge = StatusBadges[row.original.status];
          return badge ? (
            <StatusBadge icon={null} variant={badge.variant}>
              {badge.label}
            </StatusBadge>
          ) : (
            "-"
          );
        },
      },
      {
        header: "Location",
        accessorKey: "country",
      },
      {
        header: "Conversions",
        accessorFn: (d) => (d.status !== "pending" ? d.link?.sales : "-"),
      },
      {
        header: "Earned",
        accessorFn: (d) =>
          d.status !== "pending"
            ? currencyFormatter(d.earnings, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "-",
      },
    ],
    pagination,
    onPaginationChange: setPagination,
    sortableColumns: ["createdAt"],
    sortBy,
    sortOrder: order,
    onSortChange: ({ sortBy, sortOrder }) =>
      queryParams({
        set: {
          ...(sortBy && { sort: sortBy }),
          ...(sortOrder && { order: sortOrder }),
        },
      }),
    thClassName: "border-l-0",
    tdClassName: "border-l-0",
    resourceName: (p) => `partner${p ? "s" : ""}`,
    rowCount: totalPartnersCount,
    loading,
    error: error || countError ? "Failed to load partners" : undefined,
  });

  return loading || partners?.length ? (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {loading ? (
            <>
              <div className="h-10 w-full animate-pulse rounded-md bg-neutral-200 md:w-24" />
              <div className="h-10 w-full animate-pulse rounded-md bg-neutral-200 md:w-32" />
            </>
          ) : (
            <>
              <Filter.Select
                className="w-full md:w-fit"
                filters={filters}
                activeFilters={activeFilters}
                onSelect={onSelect}
                onRemove={onRemove}
              />
              <SearchBoxPersisted />
            </>
          )}
        </div>
        <AnimatedSizeContainer height>
          <div>
            {activeFilters.length > 0 && (
              <div className="pt-3">
                <Filter.List
                  filters={filters}
                  activeFilters={activeFilters}
                  onRemove={onRemove}
                  onRemoveAll={onRemoveAll}
                />
              </div>
            )}
          </div>
        </AnimatedSizeContainer>
      </div>
      <Table {...table} />
    </div>
  ) : (
    <AnimatedEmptyState
      title="No partners found"
      description="No partners have been added to this program yet."
      cardContent={() => (
        <>
          <OfficeBuilding className="size-4 text-neutral-700" />
          <div className="h-2.5 w-24 min-w-0 rounded-sm bg-neutral-200" />
        </>
      )}
    />
  );
}
