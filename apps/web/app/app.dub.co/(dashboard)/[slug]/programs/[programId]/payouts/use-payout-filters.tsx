import useWorkspace from "@/lib/swr/use-workspace";
import { useRouterStuff } from "@dub/ui";
import { CircleDotted } from "@dub/ui/src/icons";
import { cn } from "@dub/utils";
import { useMemo } from "react";
import { PayoutStatusBadges } from "./payout-table";

export function usePayoutFilters(extraSearchParams: Record<string, string>) {
  const { searchParamsObj, queryParams } = useRouterStuff();
  const { id: workspaceId } = useWorkspace();

  const filters = useMemo(
    () => [
      {
        key: "status",
        icon: CircleDotted,
        label: "Status",
        options: Object.entries(PayoutStatusBadges).map(
          ([value, { label }]) => {
            const Icon = PayoutStatusBadges[value].icon;
            return {
              value,
              label,
              icon: (
                <Icon
                  className={cn(
                    PayoutStatusBadges[value].className,
                    "size-4 bg-transparent",
                  )}
                />
              ),
            };
          },
        ),
      },
    ],
    [],
  );

  const activeFilters = useMemo(() => {
    const { status } = searchParamsObj;
    return [...(status ? [{ key: "status", value: status }] : [])];
  }, [searchParamsObj]);

  const onSelect = (key: string, value: any) =>
    queryParams({
      set: {
        [key]: value,
      },
      del: "page",
    });

  const onRemove = (key: string, value: any) =>
    queryParams({
      del: [key, "page"],
    });

  const onRemoveAll = () =>
    queryParams({
      del: ["status", "search"],
    });

  const searchQuery = useMemo(
    () =>
      new URLSearchParams({
        ...Object.fromEntries(
          activeFilters.map(({ key, value }) => [key, value]),
        ),
        ...(searchParamsObj.search && { search: searchParamsObj.search }),
        workspaceId: workspaceId || "",
        ...extraSearchParams,
      }).toString(),
    [activeFilters, workspaceId, extraSearchParams],
  );

  const isFiltered = activeFilters.length > 0 || searchParamsObj.search;

  return {
    filters,
    activeFilters,
    onSelect,
    onRemove,
    onRemoveAll,
    searchQuery,
    isFiltered,
  };
}
