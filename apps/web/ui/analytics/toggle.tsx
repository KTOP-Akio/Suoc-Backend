import {
  INTERVAL_DATA,
  INTERVAL_DISPLAYS,
  VALID_ANALYTICS_FILTERS,
} from "@/lib/analytics/constants";
import { validDateRangeForPlan } from "@/lib/analytics/utils";
import useDomains from "@/lib/swr/use-domains";
import useTags from "@/lib/swr/use-tags";
import useWorkspace from "@/lib/swr/use-workspace";
import { LinkProps } from "@/lib/types";
import {
  BlurImage,
  DatePickerContext,
  DateRangePicker,
  ExpandingArrow,
  Filter,
  TooltipContent,
  useRouterStuff,
  useScroll,
} from "@dub/ui";
import {
  Cube,
  CursorRays,
  FlagWavy,
  Globe,
  Hyperlink,
  MobilePhone,
  OfficeBuilding,
  QRCode,
  Tag,
  Window,
} from "@dub/ui/src/icons";
import {
  APP_DOMAIN,
  COUNTRIES,
  DUB_LOGO,
  GOOGLE_FAVICON_URL,
  cn,
  getApexDomain,
  getNextPlan,
  linkConstructor,
  nFormatter,
} from "@dub/utils";
import { useCallback, useContext, useMemo, useState } from "react";
import { AnalyticsContext } from ".";
import LinkLogo from "../links/link-logo";
import { COLORS_LIST } from "../links/tag-badge";
import DeviceIcon from "./device-icon";
import ExportButton from "./export-button";
import SharePopover from "./share-popover";
import { useAnalyticsFilterOption } from "./utils";

export default function Toggle() {
  const { plan } = useWorkspace();
  const { queryParams, searchParamsObj } = useRouterStuff();
  const { basePath, domain, key, url, admin, demo, start, end, interval } =
    useContext(AnalyticsContext);

  const isPublicStatsPage = basePath.startsWith("/stats");

  const scrolled = useScroll(80);

  const { tags } = useTags();
  const { allDomains: domains } = useDomains();

  const [requestedFilters, setRequestedFilters] = useState<string[]>([]);

  const activeFilters = useMemo(() => {
    const { domain, tagId, qr, country, city, device, browser, os, key } =
      searchParamsObj;
    return [
      ...(domain && !key ? [{ key: "domain", value: domain }] : []),
      ...(domain && key
        ? [{ key: "link", value: linkConstructor({ domain, key }) }]
        : []),
      ...(tagId ? [{ key: "tagId", value: tagId }] : []),
      ...(qr ? [{ key: "qr", value: qr === "true" }] : []),
      ...(country ? [{ key: "country", value: country }] : []),
      ...(city ? [{ key: "city", value: city }] : []),
      ...(device ? [{ key: "device", value: device }] : []),
      ...(browser ? [{ key: "browser", value: browser }] : []),
      ...(os ? [{ key: "os", value: os }] : []),
    ];
  }, [searchParamsObj]);

  const isEnabled = useCallback(
    (key: string) =>
      requestedFilters.includes(key) ||
      activeFilters.some((af) => af.key === key),
    [requestedFilters, activeFilters],
  );

  const links = useAnalyticsFilterOption("top_links", {
    enabled: isEnabled("link"),
  });
  const countries = useAnalyticsFilterOption("countries", {
    enabled: isEnabled("country"),
  });
  const cities = useAnalyticsFilterOption("cities", {
    enabled: isEnabled("city"),
  });
  const devices = useAnalyticsFilterOption("devices", {
    enabled: isEnabled("device"),
  });
  const browsers = useAnalyticsFilterOption("browsers", {
    enabled: isEnabled("browser"),
  });
  const os = useAnalyticsFilterOption("os", {
    enabled: isEnabled("os"),
  });

  const filters = useMemo(
    () => [
      ...(isPublicStatsPage
        ? []
        : [
            {
              key: "domain",
              icon: Globe,
              label: "Domain",
              options: domains.map((domain) => ({
                value: domain.slug,
                label: domain.slug,
                icon: (
                  <BlurImage
                    src={`${GOOGLE_FAVICON_URL}${domain.slug}`}
                    alt={domain.slug}
                    className="h-4 w-4 rounded-full"
                    width={16}
                    height={16}
                  />
                ),
              })),
            },
            {
              key: "link",
              icon: Hyperlink,
              label: "Link",
              options:
                links?.map(
                  ({
                    domain,
                    key,
                    url,
                    count,
                  }: LinkProps & { count?: number }) => ({
                    value: linkConstructor({ domain, key }),
                    label: linkConstructor({ domain, key, pretty: true }),
                    icon: (
                      <LinkLogo
                        apexDomain={getApexDomain(url)}
                        className="h-4 w-4 sm:h-4 sm:w-4"
                      />
                    ),
                    right: nFormatter(count, { full: true }),
                  }),
                ) ?? null,
            },
            {
              key: "tagId",
              icon: Tag,
              label: "Tag",
              options:
                tags?.map((tag) => ({
                  value: tag.id,
                  icon: (
                    <div
                      className={cn(
                        "rounded-md p-1.5",
                        COLORS_LIST.find(({ color }) => color === tag.color)
                          ?.css,
                      )}
                    >
                      <Tag className="h-2.5 w-2.5" />
                    </div>
                  ),
                  label: tag.name,
                })) ?? null,
            },
          ]),
      {
        key: "qr",
        icon: CursorRays,
        label: "Trigger",
        options: [
          {
            value: false,
            label: "Link click",
            icon: CursorRays,
          },
          {
            value: true,
            label: "QR Scan",
            icon: QRCode,
          },
        ],
      },
      {
        key: "country",
        icon: FlagWavy,
        label: "Country",
        options:
          countries?.map(({ country, count }) => ({
            value: country,
            label: COUNTRIES[country],
            icon: (
              <img
                alt={country}
                src={`https://flag.vercel.app/m/${country}.svg`}
                className="h-2.5 w-4"
              />
            ),
            right: nFormatter(count, { full: true }),
          })) ?? null,
      },
      {
        key: "city",
        icon: OfficeBuilding,
        label: "City",
        options:
          cities?.map(({ city, country, count }) => ({
            value: city,
            label: city,
            icon: (
              <img
                alt={country}
                src={`https://flag.vercel.app/m/${country}.svg`}
                className="h-2.5 w-4"
              />
            ),
            right: nFormatter(count, { full: true }),
          })) ?? null,
      },
      {
        key: "device",
        icon: MobilePhone,
        label: "Device",
        options:
          devices?.map(({ device, count }) => ({
            value: device,
            label: device,
            icon: (
              <DeviceIcon display={device} tab="devices" className="h-4 w-4" />
            ),
            right: nFormatter(count, { full: true }),
          })) ?? null,
      },
      {
        key: "browser",
        icon: Window,
        label: "Browser",
        options:
          browsers?.map(({ browser, count }) => ({
            value: browser,
            label: browser,
            icon: (
              <DeviceIcon
                display={browser}
                tab="browsers"
                className="h-4 w-4"
              />
            ),
            right: nFormatter(count, { full: true }),
          })) ?? null,
      },
      {
        key: "os",
        icon: Cube,
        label: "OS",
        options:
          os?.map(({ os, count }) => ({
            value: os,
            label: os,
            icon: <DeviceIcon display={os} tab="os" className="h-4 w-4" />,
            right: nFormatter(count, { full: true }),
          })) ?? null,
      },
    ],
    [
      isPublicStatsPage,
      domains,
      links,
      tags,
      countries,
      cities,
      devices,
      browsers,
      os,
    ],
  );

  return (
    <>
      <div
        className={cn(
          "sticky top-[6.85rem] z-10 mb-5 bg-gray-50 py-3 md:py-3",
          {
            "top-14": isPublicStatsPage,
            "top-0": admin,
            "top-16": demo,
            "shadow-md": scrolled,
          },
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-screen-xl flex-col gap-2 px-2.5 lg:px-20",
            {
              "md:h-10": key,
            },
          )}
        >
          <div
            className={cn(
              "flex w-full flex-col items-center justify-between gap-2 md:flex-row",
              {
                "flex-col md:flex-row": !key,
                "items-center": key,
              },
            )}
          >
            {isPublicStatsPage ? (
              <a
                className="group flex items-center text-lg font-semibold text-gray-800"
                href={linkConstructor({ domain, key })}
                target="_blank"
                rel="noreferrer"
              >
                <BlurImage
                  alt={url || "Dub.co"}
                  src={
                    url
                      ? `${GOOGLE_FAVICON_URL}${getApexDomain(url)}`
                      : DUB_LOGO
                  }
                  className="mr-2 h-6 w-6 flex-shrink-0 overflow-hidden rounded-full"
                  width={48}
                  height={48}
                />
                <p className="max-w-[192px] truncate sm:max-w-[400px]">
                  {linkConstructor({
                    domain,
                    key,
                    pretty: true,
                  })}
                </p>
                <ExpandingArrow className="h-5 w-5" />
              </a>
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight text-black">
                Analytics
              </h1>
            )}
            <div
              className={cn("flex items-center gap-2", {
                "w-full flex-col min-[550px]:flex-row md:w-auto": !key,
                "w-full md:w-auto": key,
              })}
            >
              {!isPublicStatsPage && key && <SharePopover />}
              <Filter.Select
                className="w-full"
                filters={filters}
                activeFilters={activeFilters}
                onSelect={(key, value) =>
                  queryParams({
                    set:
                      key === "link"
                        ? {
                            domain: new URL(value).hostname,
                            key: new URL(value).pathname.slice(1) || "_root",
                          }
                        : {
                            [key]: value,
                          },
                  })
                }
                onRemove={(key) =>
                  queryParams({
                    del: key === "link" ? ["domain", "key"] : key,
                  })
                }
                onOpenFilter={(key) =>
                  setRequestedFilters((rf) =>
                    rf.includes(key) ? rf : [...rf, key],
                  )
                }
              />
              <div
                className={cn("flex w-full items-center gap-2", {
                  "min-[550px]:w-auto": !key,
                  "justify-end": key,
                })}
              >
                <DateRangePicker
                  className="w-full sm:min-w-[200px]"
                  align="end"
                  defaultValue={
                    start && end
                      ? {
                          from: start,
                          to: end,
                        }
                      : undefined
                  }
                  defaultPresetId={
                    !start || !end ? interval ?? "24h" : undefined
                  }
                  onChange={(range, preset) => {
                    if (preset) {
                      queryParams({
                        del: ["start", "end"],
                        set: {
                          interval: preset.id,
                        },
                      });

                      return;
                    }

                    // Regular range
                    if (!range || !range.from || !range.to) return;

                    queryParams({
                      del: "preset",
                      set: {
                        start: range.from.toISOString(),
                        end: range.to.toISOString(),
                      },
                    });
                  }}
                  presets={INTERVAL_DISPLAYS.map(({ display, value }) => {
                    const start = INTERVAL_DATA[value].startDate;
                    const end = new Date();

                    const requiresUpgrade =
                      admin || demo
                        ? false
                        : !validDateRangeForPlan({
                            plan,
                            start,
                            end,
                          });

                    return {
                      id: value,
                      label: display,
                      dateRange: {
                        from: start,
                        to: end,
                      },
                      requiresUpgrade,
                      tooltipContent: requiresUpgrade ? (
                        <UpgradeTooltip
                          rangeLabel={display}
                          plan={plan}
                          isPublicStatsPage={isPublicStatsPage}
                        />
                      ) : undefined,
                    };
                  })}
                />
                {!isPublicStatsPage && <ExportButton />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
        <Filter.List
          filters={filters}
          activeFilters={activeFilters}
          onRemove={(key) =>
            queryParams({
              del: key === "link" ? ["domain", "key"] : key,
            })
          }
          onRemoveAll={() =>
            queryParams({
              del: ["domain", "key", ...VALID_ANALYTICS_FILTERS],
            })
          }
        />
        <div
          className={cn(
            "transition-[height] duration-[300ms]",
            activeFilters.length ? "h-6" : "h-0",
          )}
        />
      </div>
    </>
  );
}

function UpgradeTooltip({
  rangeLabel,
  plan,
  isPublicStatsPage,
}: {
  rangeLabel: string;
  plan?: string;
  isPublicStatsPage: boolean;
}) {
  const { queryParams } = useRouterStuff();

  const { setIsOpen } = useContext(DatePickerContext);

  const isAllTime = rangeLabel === "All Time";

  return (
    <TooltipContent
      title={`${rangeLabel} can only be viewed on a ${isAllTime ? "Business" : getNextPlan(plan).name} plan or higher. Upgrade now to view more stats.`}
      cta={`Upgrade to ${isAllTime ? "Business" : getNextPlan(plan).name}`}
      {...(isPublicStatsPage
        ? {
            href: APP_DOMAIN,
          }
        : {
            onClick: () => {
              setIsOpen(false);
              queryParams({
                set: {
                  upgrade: isAllTime
                    ? "business"
                    : getNextPlan(plan).name.toLowerCase(),
                },
              });
            },
          })}
    />
  );
}
