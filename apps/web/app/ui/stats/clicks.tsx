import { Chart } from "@/components/shared/icons";
import { fetcher, nFormatter } from "lib";
import { useContext } from "react";
import useSWR from "swr";
import { NumberTooltip } from "ui";
import { StatsContext } from ".";
import BarChart from "./bar-chart";

export default function Clicks() {
  const { endpoint, queryString } = useContext(StatsContext);

  const { data: totalClicks } = useSWR<number>(
    `${endpoint}/clicks${queryString}`,
    fetcher,
  );

  return (
    <div className="max-w-4xl border border-gray-200 bg-white p-5 sm:rounded-lg sm:border-gray-100 sm:p-10 sm:pr-20 sm:shadow-lg ">
      <div className="mb-5 text-left">
        <div className="flex items-end space-x-1">
          {totalClicks || totalClicks === 0 ? (
            <NumberTooltip value={totalClicks}>
              <h1 className="text-3xl font-bold sm:text-4xl">
                {nFormatter(totalClicks)}
              </h1>
            </NumberTooltip>
          ) : (
            <div className="h-10 w-12 animate-pulse rounded-md bg-gray-200" />
          )}
          <Chart className="mb-1 h-6 w-6 text-gray-600" />
        </div>
        <p className="text-sm font-medium uppercase text-gray-600">
          Total Clicks
        </p>
      </div>
      <BarChart />
    </div>
  );
}
