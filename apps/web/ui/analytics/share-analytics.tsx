import {
  Copy,
  Switch,
  Tick,
  useCopyToClipboard,
  useOptimisticUpdate,
} from "@dub/ui";
import { linkConstructor } from "@dub/utils";
import { useContext } from "react";
import { toast } from "sonner";
import { AnalyticsContext } from "./analytics-provider";

export default function ShareAnalytics() {
  const { queryString, domain, key } = useContext(AnalyticsContext) as {
    queryString: string;
    domain: string;
    key: string; // coerce to string since <SharePopover is not shown if key is undefined)
  };

  const { data, isLoading, update } = useOptimisticUpdate<{
    publicStats: boolean;
  }>(`/api/analytics/public-stats?${queryString}`, {
    loading: "Updating...",
    success: "Successfully updated stats page visibility!",
    error: "Something went wrong",
  });

  const [copied, copyToClipboard] = useCopyToClipboard();

  const statsUrl = `https://${domain}/stats/${encodeURIComponent(key)}`;

  const copyStatsUrl = ({ notify }: { notify: boolean }) => {
    notify &&
      toast.promise(copyToClipboard(statsUrl), {
        success: "Copied to clipboard",
      });
  };

  const handleUpdate = async (checked: boolean) => {
    const res = await fetch(`/api/analytics/public-stats?${queryString}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicStats: checked,
      }),
    });
    if (!res.ok) {
      throw new Error("Failed to update email preferences");
    }
    if (res.status === 200) {
      checked && copyStatsUrl({ notify: false });
    }
    return { publicStats: checked };
  };

  return (
    <div className="w-full divide-y divide-gray-200 text-sm md:w-72">
      <div className="p-4">
        <p className="text-gray-500">Share analytics for</p>
        <p className="truncate font-semibold text-gray-800">
          {linkConstructor({ key, domain, pretty: true })}
        </p>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-semibold text-gray-800">Public Analytics Page</p>
          <Switch
            checked={data?.publicStats}
            loading={isLoading}
            fn={(checked: boolean) => {
              update(() => handleUpdate(checked), { publicStats: checked });
            }}
          />
        </div>
        <p className="text-gray-500">
          Making stats public will allow anyone with the link to see the
          analytics for this short link.
        </p>
      </div>
      <div className="p-4">
        <p className="font-semibold text-gray-800">Share Link</p>
        <div className="divide-x-200 mt-2 flex items-center justify-between divide-x overflow-hidden rounded-md border border-gray-200 bg-gray-100">
          <div className="scrollbar-hide overflow-scroll pl-2">
            <p className="whitespace-nowrap text-gray-600">{statsUrl}</p>
          </div>
          <button
            className="h-8 flex-none border-l bg-white px-2 hover:bg-gray-50 active:bg-gray-100"
            onClick={() => copyStatsUrl({ notify: true })}
          >
            {copied ? (
              <Tick className="h-4 w-4 text-gray-500" />
            ) : (
              <Copy className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
