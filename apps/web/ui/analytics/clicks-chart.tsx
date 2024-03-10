import { fetcher } from "@dub/utils";
import { useCallback, useContext, useMemo } from "react";
import useSWR from "swr";
import { AnalyticsContext } from ".";
import Areas from "../charts/areas";
import TimeSeriesChart from "../charts/time-series-chart";
import XAxis from "../charts/x-axis";
import YAxis from "../charts/y-axis";

export default function ClicksChart() {
  const { baseApiPath, queryString, interval } = useContext(AnalyticsContext);

  const { data } = useSWR<{ start: Date; clicks: number }[]>(
    `${baseApiPath}/timeseries?${queryString}`,
    fetcher,
  );

  const chartData = useMemo(
    () =>
      data?.map(({ start, clicks }) => ({
        date: new Date(start),
        values: { clicks },
      })) ?? null,
    [data],
  );

  const formatDate = useCallback(
    (date: Date) => {
      switch (interval) {
        case "1h":
        case "24h":
          return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
          });
        case "90d":
        case "all":
          return date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
        default:
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
      }
    },
    [data, interval],
  );

  return (
    <div className="h-80 w-full">
      {chartData !== null && (
        <TimeSeriesChart
          key={queryString}
          data={chartData}
          series={[{ id: "clicks", accessorFn: (d) => d.values.clicks }]}
          tooltipContent={(d) => (
            <>
              <p className="text-gray-600">
                <strong className="text-gray-700">{d.values.clicks}</strong>{" "}
                clicks
              </p>
              <p className="text-sm text-gray-400">{formatDate(d.date)}</p>
            </>
          )}
        >
          <Areas />
          <XAxis tickFormat={formatDate} />
          <YAxis integerTicks showGridLines />
        </TimeSeriesChart>
      )}
    </div>
  );
}
