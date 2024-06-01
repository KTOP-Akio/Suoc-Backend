import { cn, truncate } from "@dub/utils";
import { Command } from "cmdk";
import { Check, ChevronDown, ListFilter } from "lucide-react";
import {
  CSSProperties,
  PropsWithChildren,
  ReactNode,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { AnimatedSizeContainer } from "../animated-size-container";
import { useMediaQuery, useResizeObserver } from "../hooks";
import { LoadingSpinner } from "../icons";
import { Popover } from "../popover";
import { Filter, FilterOption } from "./types";

type FilterSelectProps = {
  filters: Filter[];
  onSelect: (key: string, value: string) => void;
  onRemove: (key: string) => void;
  onOpenFilter?: (key: string) => void;
  activeFilters?: {
    key: Filter["key"];
    value: FilterOption["value"];
  }[];
  children?: ReactNode;
  className?: string;
};

export function FilterSelect({
  filters,
  onSelect,
  onRemove,
  onOpenFilter,
  activeFilters,
  children,
  className,
}: FilterSelectProps) {
  const { isMobile } = useMediaQuery();

  // Track main list container/dimensions to maintain size for loading spinner
  const mainListContainer = useRef<HTMLDivElement>(null);
  const mainListDimensions = useRef<{
    width: number;
    height: number;
  }>();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFilterKey, setSelectedFilterKey] = useState<
    Filter["key"] | null
  >(null);

  const reset = useCallback(() => {
    setSearch("");
    setSelectedFilterKey(null);
  }, []);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen]);

  // The currently selected filter to display options for
  const selectedFilter = selectedFilterKey
    ? filters.find(({ key }) => key === selectedFilterKey)
    : null;

  const openFilter = useCallback((key: Filter["key"]) => {
    if (mainListContainer.current) {
      mainListDimensions.current = {
        width: mainListContainer.current.scrollWidth,
        height: mainListContainer.current.scrollHeight,
      };
    }

    setSearch("");
    setSelectedFilterKey(key);
    onOpenFilter?.(key);
  }, []);

  const selectOption = useCallback(
    (value: FilterOption["value"]) => {
      if (!selectedFilter) return;

      activeFilters?.find(({ key }) => key === selectedFilterKey)?.value ===
      value
        ? onRemove(selectedFilter.key)
        : onSelect(selectedFilter.key, value);

      setIsOpen(false);
    },
    [activeFilters, selectedFilter],
  );

  return (
    <Popover
      openPopover={isOpen}
      setOpenPopover={setIsOpen}
      onEscapeKeyDown={(e) => {
        if (selectedFilterKey) {
          e.preventDefault();
          reset();
        }
      }}
      content={
        <AnimatedSizeContainer
          width={!isMobile}
          height
          className="rounded-[inherit]"
          style={{ transform: "translateZ(0)" }} // Fixes overflow on some browsers
        >
          <Command loop>
            <Command.Input
              size={1}
              className="w-full rounded-t-lg border-0 border-b border-gray-200 px-4 py-3 text-sm ring-0 placeholder:text-gray-400 focus:border-gray-200 focus:ring-0"
              placeholder={`${selectedFilter?.label || "Filter"}...`}
              value={search}
              onValueChange={setSearch}
              onKeyDown={(e) => {
                if (e.key === "Escape" || (e.key === "Backspace" && !search)) {
                  e.preventDefault();
                  e.stopPropagation();
                  selectedFilterKey ? reset() : setIsOpen(false);
                }
              }}
            />
            <FilterScroll key={selectedFilterKey} ref={mainListContainer}>
              {!selectedFilter ? (
                <Command.List className="flex w-full min-w-[180px] flex-col gap-1 p-2">
                  {filters.map((filter) => (
                    <FilterButton
                      {...filter}
                      key={filter.key}
                      onSelect={() => openFilter(filter.key)}
                    />
                  ))}
                  <NoMatches />
                </Command.List>
              ) : (
                <Command.List className="flex w-full min-w-[100px] flex-col gap-1 p-2">
                  {selectedFilter.options ? (
                    <>
                      {selectedFilter.options?.map((option) => {
                        const isSelected =
                          activeFilters?.find(
                            ({ key }) => key === selectedFilterKey,
                          )?.value === option.value;

                        return (
                          <FilterButton
                            {...option}
                            key={option.value}
                            right={
                              isSelected ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                option.right
                              )
                            }
                            onSelect={() => selectOption(option.value)}
                          />
                        );
                      })}
                      <NoMatches />
                    </>
                  ) : (
                    <Command.Loading>
                      <div
                        className="flex items-center justify-center px-2 py-4"
                        style={mainListDimensions.current}
                      >
                        <LoadingSpinner />
                      </div>
                    </Command.Loading>
                  )}
                </Command.List>
              )}
            </FilterScroll>
          </Command>
        </AnimatedSizeContainer>
      }
    >
      <button
        type="button"
        className={cn(
          "group flex h-10 cursor-pointer appearance-none items-center gap-x-2 truncate rounded-md border px-3 outline-none transition-all sm:text-sm",
          "border-gray-200 bg-white text-gray-900 placeholder-gray-400 transition-all",
          "focus-visible:border-gray-500 data-[state=open]:border-gray-500 data-[state=open]:ring-4 data-[state=open]:ring-gray-200",
          className,
        )}
      >
        <ListFilter className="h-4 w-4 shrink-0" />
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-gray-900">
          {children ?? "Filter"}
        </span>
        <div className="ml-1">
          {activeFilters?.length ? (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-black text-[0.625rem] text-white">
              {activeFilters.length}
            </div>
          ) : (
            <ChevronDown
              className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-75 group-data-[state=open]:rotate-180`}
            />
          )}
        </div>
      </button>
    </Popover>
  );
}

const FilterScroll = forwardRef(
  ({ children }: PropsWithChildren, forwardedRef) => {
    const ref = useRef<HTMLDivElement>(null);
    useImperativeHandle(forwardedRef, () => ref.current);

    const [scrollProgress, setScrollProgress] = useState(1);

    const updateScrollProgress = useCallback(() => {
      if (!ref.current) return;
      const { scrollTop, scrollHeight, clientHeight } = ref.current;

      setScrollProgress(
        scrollHeight === clientHeight
          ? 1
          : scrollTop / (scrollHeight - clientHeight),
      );
    }, []);

    const resizeObserverEntry = useResizeObserver(ref);

    useEffect(updateScrollProgress, [resizeObserverEntry]);

    return (
      <>
        <div
          className="scrollbar-hide max-h-[50vh] w-screen overflow-y-scroll sm:w-auto"
          ref={ref}
          onScroll={updateScrollProgress}
        >
          {children}
        </div>
        {/* Bottom scroll fade */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 hidden h-16 w-full bg-gradient-to-t from-white sm:block"
          style={{ opacity: 1 - Math.pow(scrollProgress, 2) }}
        ></div>
      </>
    );
  },
);

function FilterButton({
  icon: Icon,
  label,
  right,
  onSelect,
}: Omit<Filter | FilterOption, "key" | "value"> & {
  right?: ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      className={cn(
        "flex cursor-pointer items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm",
        "data-[selected=true]:bg-gray-100",
      )}
      onSelect={onSelect}
      value={label}
    >
      <span className="shrink-0 text-gray-600">
        {isReactNode(Icon) ? Icon : <Icon className="h-4 w-4" />}
      </span>
      {truncate(label, 30)}
      <div className="ml-1 flex shrink-0 grow justify-end text-gray-500">
        {right}
      </div>
    </Command.Item>
  );
}

const NoMatches = ({ style }: { style?: CSSProperties }) => (
  <Command.Empty
    className="p-2 text-center text-sm text-gray-400"
    style={style}
  >
    No matches
  </Command.Empty>
);

const isReactNode = (element: any): element is ReactNode =>
  isValidElement(element);
