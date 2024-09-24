import { cn, truncate } from "@dub/utils";
import { Command, CommandEmpty, CommandInput, CommandItem } from "cmdk";
import {
  isValidElement,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatedSizeContainer } from "../animated-size-container";
import { Button, ButtonProps } from "../button";
import { useMediaQuery, useScrollProgress } from "../hooks";
import {
  CheckboxCheckedFill,
  CheckboxUnchecked,
  Icon,
  LoadingSpinner,
  Plus,
} from "../icons";
import { Popover } from "../popover";

export type ComboboxOption<TMeta = any> = {
  label: string;
  value: string;
  icon?: Icon | ReactNode;
  meta?: TMeta;
};

export type ComboboxProps<
  TMultiple extends boolean | undefined,
  TMeta extends any,
> = PropsWithChildren<{
  multiple?: TMultiple;
  selected: TMultiple extends true
    ? ComboboxOption<TMeta>[]
    : ComboboxOption<TMeta> | null;
  setSelected: TMultiple extends true
    ? (tags: ComboboxOption<TMeta>[]) => void
    : (tag: ComboboxOption<TMeta> | null) => void;
  options?: ComboboxOption<TMeta>[];
  icon?: Icon | ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyState?: ReactNode;
  createLabel?: (search: string) => ReactNode;
  onCreate?: (search: string) => Promise<boolean>;
  buttonProps?: ButtonProps;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>;

function isMultipleSelection(
  multiple: boolean | undefined,
  setSelected: any,
): setSelected is (tags: ComboboxOption[]) => void {
  return multiple === true;
}

export function Combobox({
  multiple,
  selected: selectedProp,
  setSelected,
  options,
  icon: Icon,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyState,
  createLabel,
  onCreate,
  buttonProps,
  open,
  onOpenChange,
  children,
}: ComboboxProps<boolean | undefined, any>) {
  const isMultiple = isMultipleSelection(multiple, setSelected);

  // Ensure selectedProp is an array
  const selected = Array.isArray(selectedProp)
    ? selectedProp
    : selectedProp
      ? [selectedProp]
      : [];

  const { isMobile } = useMediaQuery();

  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = open ?? isOpenInternal;
  const setIsOpen = onOpenChange ?? setIsOpenInternal;

  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSelect = (option: ComboboxOption) => {
    if (isMultiple) {
      const isAlreadySelected = selected.some(
        ({ value }) => value === option.value,
      );
      setSelected(
        isAlreadySelected
          ? selected.filter(({ value }) => value !== option.value)
          : [...selected, option],
      );
    } else
      setSelected(
        selected.length && selected[0]?.value === option.value ? null : option,
      );
  };

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  return (
    <Popover
      openPopover={isOpen}
      setOpenPopover={setIsOpen}
      align="start"
      side="top"
      onWheel={(e) => {
        // Allows scrolling to work when the popover's in a modal
        e.stopPropagation();
      }}
      content={
        <AnimatedSizeContainer
          width={!isMobile}
          height
          className="rounded-[inherit]"
          style={{ transform: "translateZ(0)" }} // Fixes overflow on some browsers
          transition={{ ease: "easeInOut", duration: 0.1 }}
        >
          <Command loop>
            <div className="flex items-center overflow-hidden rounded-t-lg border-b border-gray-200">
              <CommandInput
                placeholder={searchPlaceholder}
                value={search}
                onValueChange={setSearch}
                className="grow border-0 py-3 pl-4 pr-2 outline-none placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                onKeyDown={(e) => {
                  if (
                    e.key === "Escape" ||
                    (e.key === "Backspace" && !search)
                  ) {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                  }
                }}
              />
              <kbd className="mr-2 hidden shrink-0 rounded bg-gray-200 px-2 py-0.5 text-xs font-light text-gray-500 md:block">
                T
              </kbd>
            </div>
            <Scroll>
              <Command.List
                className={cn("flex w-full min-w-[100px] flex-col gap-1 p-1")}
              >
                {options !== undefined ? (
                  <>
                    {options.map((option) => (
                      <Option
                        key={`${option.label}, ${option.value}`}
                        option={option}
                        multiple={isMultiple}
                        selected={selected.some(
                          ({ value }) => value === option.value,
                        )}
                        onSelect={() => handleSelect(option)}
                      />
                    ))}
                    {search.length > 0 && onCreate && (
                      <CommandItem
                        className={cn(
                          "flex cursor-pointer items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm text-gray-700",
                          "data-[selected=true]:bg-gray-100",
                        )}
                        onSelect={async () => {
                          setIsCreating(true);
                          const success = await onCreate?.(search);
                          if (success) {
                            setSearch("");
                            setIsOpen(false);
                          }
                          setIsCreating(false);
                        }}
                      >
                        {isCreating ? (
                          <LoadingSpinner className="size-4 shrink-0" />
                        ) : (
                          <Plus className="size-4 shrink-0" />
                        )}
                        <div className="grow">
                          {createLabel?.(search) || `Create "${search}"`}
                        </div>
                      </CommandItem>
                    )}
                    <CommandEmpty className="flex h-12 items-center justify-center text-sm text-gray-500">
                      {emptyState ? emptyState : "No matches"}
                    </CommandEmpty>
                  </>
                ) : (
                  // undefined - loading state
                  <Command.Loading>
                    <div className="flex h-12 items-center justify-center">
                      <LoadingSpinner />
                    </div>
                  </Command.Loading>
                )}
              </Command.List>
            </Scroll>
          </Command>
        </AnimatedSizeContainer>
      }
    >
      <Button
        variant="secondary"
        {...buttonProps}
        className={cn(buttonProps?.className, "flex items-center gap-2")}
        text={
          children ||
          selected.map((option) => option.label).join(", ") ||
          placeholder
        }
        icon={
          Icon ? (
            isReactNode(Icon) ? (
              Icon
            ) : (
              <Icon className="size-4" />
            )
          ) : undefined
        }
      />
    </Popover>
  );
}

const Scroll = ({ children }: PropsWithChildren) => {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollProgress, updateScrollProgress } = useScrollProgress(ref);

  return (
    <>
      <div
        className="scrollbar-hide max-h-[min(50vh,190px)] w-screen overflow-y-scroll sm:w-auto"
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
};

function Option({
  option,
  onSelect,
  multiple,
  selected,
}: {
  option: ComboboxOption;
  onSelect: () => void;
  multiple: boolean;
  selected: boolean;
}) {
  return (
    <Command.Item
      className={cn(
        "flex cursor-pointer items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm",
        "data-[selected=true]:bg-gray-100",
      )}
      onSelect={onSelect}
      value={option.label + option?.value}
    >
      {multiple && (
        <div className="shrink-0 text-gray-600">
          {selected ? (
            <CheckboxCheckedFill className="size-4 text-gray-600" />
          ) : (
            <CheckboxUnchecked className="size-4 text-gray-400" />
          )}
        </div>
      )}
      <div className="flex items-center gap-1">
        {option.icon && (
          <span className="shrink-0 text-gray-600">
            {isReactNode(option.icon) ? (
              option.icon
            ) : (
              <option.icon className="h-4 w-4" />
            )}
          </span>
        )}
        {truncate(option.label, 48)}
      </div>
    </Command.Item>
  );
}

const isReactNode = (element: any): element is ReactNode =>
  isValidElement(element);
