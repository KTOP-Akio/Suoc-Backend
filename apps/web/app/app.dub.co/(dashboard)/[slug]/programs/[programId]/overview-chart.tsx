import Areas from "@/ui/charts/areas";
import { ChartContext } from "@/ui/charts/chart-context";
import TimeSeriesChart from "@/ui/charts/time-series-chart";
import XAxis from "@/ui/charts/x-axis";
import YAxis from "@/ui/charts/y-axis";
import { LoadingSpinner } from "@dub/ui/src/icons";
import { currencyFormatter, formatDate } from "@dub/utils";
import { LinearGradient } from "@visx/gradient";
import { subDays } from "date-fns";
import { useId, useMemo } from "react";

const mockData = () =>
  [...Array(30)].map((_, i) => ({
    date: subDays(new Date(), 30 - i),
    values: {
      earnings: Math.round(Math.random() * 100_00) / 100,
    },
  }));

export function OverviewChart() {
  const id = useId();

  // TODO: [payouts] use actual data (note: this mock data is already divided by 100)
  const total = 1234_00;
  const data = useMemo(() => mockData(), []);

  const dataError = null;
  const totalError = null;

  const dataLoading = !data && !dataError;
  const totalLoading = total === undefined && !totalError;

  return (
    <div>
      <div className="flex flex-col gap-1 p-2">
        <span className="text-sm text-neutral-500">Revenue</span>
        {totalLoading ? (
          <div className="h-9 w-24 animate-pulse rounded-md bg-neutral-200" />
        ) : (
          <span className="text-3xl text-neutral-800">
            {totalError
              ? "-"
              : currencyFormatter(total / 100, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
          </span>
        )}
      </div>
      <div className="relative mt-4 h-72 md:h-96">
        {dataLoading ? (
          <div className="flex size-full items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <TimeSeriesChart
            data={data}
            series={[
              {
                id: "earnings",
                valueAccessor: (d) => d.values.earnings,
                colorClassName: "text-[#8B5CF6]",
                isActive: true,
              },
            ]}
            tooltipClassName="p-0"
            tooltipContent={(d) => {
              return (
                <>
                  <p className="border-b border-gray-200 px-4 py-3 text-sm text-gray-900">
                    {formatDate(d.date)}
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-sm bg-violet-500 shadow-[inset_0_0_0_1px_#0003]" />
                      <p className="capitalize text-gray-600">Revenue</p>
                    </div>
                    <p className="text-right font-medium text-gray-900">
                      {currencyFormatter(d.values.earnings, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </>
              );
            }}
          >
            <ChartContext.Consumer>
              {(context) => (
                <LinearGradient
                  id={`${id}-color-gradient`}
                  from="#8B5CF6"
                  to="#4C1D95"
                  x1={0}
                  x2={context?.width ?? 1}
                  gradientUnits="userSpaceOnUse"
                />
              )}
            </ChartContext.Consumer>

            <XAxis />
            <YAxis showGridLines />
            <Areas
              seriesStyles={[
                {
                  id: "earnings",
                  areaFill: `url(#${id}-color-gradient)`,
                  lineStroke: `url(#${id}-color-gradient)`,
                  lineClassName: "text-violet-500",
                },
              ]}
            />
          </TimeSeriesChart>
        )}
      </div>
    </div>
  );
}
