import { LoadingSpinner, Tooltip, TooltipContent } from "@dub/ui";
import zip from "jszip";
import { Download } from "lucide-react";
import { useContext, useState } from "react";
import { toast } from "sonner";
import { AnalyticsContext } from ".";
import { HOME_DOMAIN } from "@dub/utils";

export default function ExportButton() {
  const [loading, setLoading] = useState(false);
  const { totalClicks } = useContext(AnalyticsContext);
  const { baseApiPath, queryString } = useContext(AnalyticsContext);
  const exportableEndpoints = [
    "timeseries",
    "country",
    "top_urls",
    "device",
    "referer",
    "city",
    "browser",
    "os",
    "top_links",
  ];

  const exportData = async () => {
    const zipFile = new zip();

    try {
      for (const endpoint of exportableEndpoints) {
        const response = await fetch(
          `${baseApiPath}/${endpoint}/export?${queryString}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          if (response.status === 204) continue;

          const data = await response.blob();
          zipFile.file(`${endpoint}.csv`, data);
        } else {
          throw new Error("Failed to export");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }

    zipFile.generateAsync({ type: "blob" }).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Dub Analytics Export - ${new Date().toISOString()}.zip`;
      a.click();
      toast.success("Exported successfully");
    });
  };

  // show a tooltip to make the user aware that there is no data to export if there is no data
  return totalClicks === 0 || !totalClicks ? (
    <Tooltip
      content={
        <TooltipContent
          title="There's no data available for download. Try adjusting your filter or date range settings."
          cta="Learn more"
          href={`${HOME_DOMAIN}/help/article/how-to-export-analytics`}
        />
      }
    >
      <button
        disabled={true}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white transition-all disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white disabled:active:bg-white"
      >
        <Download className="h-4 w-4" />
      </button>
    </Tooltip>
  ) : (
    <button
      disabled={loading}
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white transition-all focus:border-gray-500 focus:ring-4 focus:ring-gray-200 disabled:cursor-progress disabled:text-gray-400 disabled:hover:bg-white disabled:active:bg-white"
      onClick={async () => {
        setLoading(true);
        await exportData();
        setLoading(false);
      }}
    >
      {loading ? (
        <LoadingSpinner className="h-4 w-4" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </button>
  );
}
