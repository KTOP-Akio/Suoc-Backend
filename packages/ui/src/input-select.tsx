import { cn } from "@dub/utils";
import { Command, useCommandState } from "cmdk";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  Dispatch,
  InputHTMLAttributes,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { Drawer } from "vaul";
import { Badge } from "./badge";
import { useMediaQuery } from "./hooks";

export interface InputSelectItemProps {
  id: string;
  value: string;
  color?: string;
  image?: string;
  disabled?: boolean;
  label?: string;
}

export function InputSelect({
  items,
  selectedItem,
  setSelectedItem,
  className,
  adjustForMobile,
  icon,
  inputAttrs,
}: {
  items: InputSelectItemProps[] | [];
  selectedItem: InputSelectItemProps | null;
  setSelectedItem: Dispatch<SetStateAction<InputSelectItemProps | null>>;
  className?: string;
  adjustForMobile?: boolean;
  icon?: ReactNode;
  inputAttrs?: InputHTMLAttributes<HTMLInputElement>;
}) {
  const commandRef = useRef<HTMLDivElement | null>(null);
  const [openCommandList, setOpenCommandList] = useState(false);
  const [inputValue, setInputValue] = useState(selectedItem?.value || "");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        commandRef.current &&
        !commandRef.current.contains(e.target as Node)
      ) {
        setOpenCommandList(false);
      }
    };
    if (openCommandList) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [commandRef, openCommandList]);

  // hacks the input value to be empty when the selectedItem is empty
  useEffect(() => {
    if (!selectedItem?.value) {
      setInputValue("");
    }
  }, [selectedItem?.value]);

  const { isMobile } = useMediaQuery();

  const CommandInput = () => {
    const isEmpty = useCommandState((state: any) => state.filtered.count === 0);
    return (
      <>
        <Command.Input
          placeholder={inputAttrs?.placeholder || "Search..."}
          // hack to focus on the input when the dropdown opens
          autoFocus={openCommandList}
          // when focus on the input. only show the dropdown if there are tags and the tagValue is not empty
          onFocus={() => setOpenCommandList(true)}
          value={inputValue}
          onValueChange={setInputValue}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setOpenCommandList(false);
              // listen for cases where empty results and enter is pressed
            } else if (e.key === "Enter" && isEmpty) {
              setOpenCommandList(false);
              // if it's a letter or a number and there's no meta key pressed, openCommandList dropdown
            } else if (e.key.match(/^[a-z0-9]$/i) && !e.metaKey) {
              setOpenCommandList(true);
            }
          }}
          className="block w-full rounded-md border-none px-0 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
        />
      </>
    );
  };

  // renders a reusable list of items
  const SelectorList = () =>
    items.map((item) => (
      <Command.Item
        key={item.id}
        value={item.value}
        disabled={item.disabled}
        onSelect={() => {
          setSelectedItem(item);
          setInputValue(item.value);
          setOpenCommandList(false);
        }}
        className="group flex cursor-pointer items-center justify-between rounded-md px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 aria-disabled:cursor-not-allowed aria-disabled:opacity-75 aria-disabled:hover:bg-white aria-selected:bg-gray-100 aria-selected:text-gray-900"
      >
        <div className="flex items-center space-x-2">
          {item.image && (
            <img
              src={item.image}
              alt={item.value}
              className="h-4 w-4 rounded-full"
            />
          )}
          <p
            className={cn(
              "my-auto whitespace-nowrap rounded-md px-2 py-0.5 text-sm",
              item.color === "red" && "bg-red-100 text-red-600",
              item.color === "yellow" && "bg-yellow-100 text-yellow-600",
              item.color === "green" && "bg-green-100 text-green-600",
              item.color === "blue" && "bg-blue-100 text-blue-600",
              item.color === "purple" && "bg-purple-100 text-purple-600",
              item.color === "brown" && "bg-brown-100 text-brown-600",
            )}
          >
            {item.value}
          </p>
          {item.label && (
            <Badge className="text-xs" variant="neutral">
              {item.label}
            </Badge>
          )}
        </div>

        <Check className="invisible h-5 w-5 text-gray-500 aria-selected:visible" />
      </Command.Item>
    ));

  // when adjustForMobile is true, render the input as a drawer
  if (isMobile && adjustForMobile) {
    return (
      <Drawer.Root open={openCommandList} onOpenChange={setOpenCommandList}>
        <Drawer.Trigger className="sm:hidden" asChild>
          <Command ref={commandRef} className="relative" loop>
            <div
              className={cn(
                "group relative min-w-[140px] rounded-md border border-gray-300 bg-white px-1 focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500",
                className,
              )}
            >
              <div className="absolute inset-y-0 left-0 flex items-center justify-center pl-3 text-gray-400">
                {selectedItem && selectedItem.image ? (
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.value}
                    className="h-4 w-4 rounded-full"
                  />
                ) : (
                  icon || <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="flex h-10 px-8">
                <CommandInput />
                {inputValue && selectedItem?.value !== "" ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedItem(null);
                      setInputValue("");
                    }}
                    className="absolute inset-y-0 right-0 my-auto"
                  >
                    <X className="h-7 w-7 pr-3 text-gray-400" />
                  </button>
                ) : (
                  <ChevronDown className="absolute inset-y-0 right-0 my-auto h-7 w-7 pr-3 text-gray-400 transition-all" />
                )}
              </div>
            </div>
          </Command>
        </Drawer.Trigger>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-gray-100 bg-opacity-10 backdrop-blur" />
        <Drawer.Portal>
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 rounded-t-[10px] border-t border-gray-200 bg-white">
            <Command ref={commandRef} className="relative" loop>
              <div
                className={cn(
                  "group relative mb-2 rounded-t-md border border-gray-300 bg-white px-1 focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-200",
                  className,
                )}
              >
                <div className="absolute inset-y-0 left-0 flex items-center justify-center pl-3 text-gray-400">
                  {selectedItem && selectedItem.image ? (
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.value}
                      className="h-4 w-4 rounded-full"
                    />
                  ) : (
                    icon || <Search className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex h-10 px-8">
                  <CommandInput />
                  {inputValue && selectedItem?.value !== "" ? (
                    <button
                      onClick={() => {
                        setSelectedItem(null);
                        setInputValue("");
                      }}
                      className="absolute inset-y-0 right-0 my-auto"
                    >
                      <X className="h-7 w-7 pr-3 text-gray-400" />
                    </button>
                  ) : (
                    <ChevronDown className="absolute inset-y-0 right-0 my-auto h-7 w-7 rotate-180 pl-3 text-gray-400 transition-all" />
                  )}
                </div>
              </div>
              {openCommandList && (
                <Command.List className="dub-scrollbar h-[70vh] overflow-y-auto p-2">
                  <Command.Empty className="px-4 py-2 text-sm text-gray-600">
                    No results found for "{inputValue}"
                  </Command.Empty>
                  <SelectorList />
                </Command.List>
              )}
            </Command>
          </Drawer.Content>
          <Drawer.Overlay />
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Command ref={commandRef} className="relative" loop>
      <div
        className={cn(
          "group rounded-md border border-gray-200 bg-white px-1 transition-all focus-within:border-gray-500 focus-within:ring-4 focus-within:ring-gray-200",
          className,
        )}
      >
        <div
          onClick={() => setOpenCommandList((prev) => !prev)}
          className="absolute inset-y-0 left-0 flex cursor-pointer items-center justify-center pl-3 text-gray-400"
        >
          {selectedItem && selectedItem.image ? (
            <img
              src={selectedItem.image}
              alt={selectedItem.value}
              className="h-4 w-4 rounded-full"
            />
          ) : (
            icon || <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <div className="flex h-10 px-8">
          <CommandInput />
          {inputValue && selectedItem?.value !== "" ? (
            <button
              onClick={() => {
                setSelectedItem(null);
                setInputValue("");
              }}
              className="absolute inset-y-0 right-0 my-auto"
            >
              <X className="h-7 w-7 pr-3 text-gray-400" />
            </button>
          ) : (
            <ChevronDown
              onClick={() => setOpenCommandList((prev) => !prev)}
              className={`absolute inset-y-0 right-0 my-auto mr-3 h-4 w-4 cursor-pointer text-gray-400 transition-all ${
                openCommandList && "rotate-180"
              }`}
            />
          )}
        </div>
      </div>
      {openCommandList && (
        <Command.List className="dub-scrollbar absolute z-20 mt-2 h-[calc(var(--cmdk-list-height)+17px)] max-h-[300px] w-full overflow-auto rounded-md border border-gray-200 bg-white p-2 shadow-md transition-all">
          <Command.Empty className="px-4 py-2 text-sm text-gray-600">
            No results found for "{inputValue}"
          </Command.Empty>
          <SelectorList />
        </Command.List>
      )}
    </Command>
  );
}
