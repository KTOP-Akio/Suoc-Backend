import useSWR from "swr";
import { fetcher, nFormatter } from "@/lib/utils";
import { useRouter } from "next/router";
import { ProjectProps } from "@/lib/types";
import Tooltip from "@/components/shared/tooltip";
import { Divider, Infinity, QuestionCircle } from "@/components/shared/icons";
import { motion } from "framer-motion";

export default function PlanUsage({ project }: { project: ProjectProps }) {
  const router = useRouter();
  const { slug } = router.query as { slug: string };

  const { data: usage } = useSWR<number>(
    project && `/api/projects/${slug}/domains/${project.domain}/usage`,
    fetcher
  );

  const { data: linkCount } = useSWR<number>(
    project && `/api/projects/${slug}/domains/${project.domain}/links/count`,
    fetcher
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex flex-col space-y-3 p-10">
        <h2 className="text-xl font-medium">Plan &amp; Usage</h2>
        <p className="text-gray-500 text-sm">
          You are currently on the{" "}
          <span className="capitalize bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
            {project?.plan}
          </span>{" "}
          plan.
        </p>
      </div>
      <div className="border-b border-gray-200" />
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
        <div className="p-10 flex flex-col space-y-2">
          <div className="flex items-center">
            <h3 className="font-medium">Link Clicks</h3>
            <Tooltip content="Number of link clicks that your project has had this month.">
              <div className="flex justify-center w-8 h-4">
                <QuestionCircle className="w-4 h-4 text-gray-600" />
              </div>
            </Tooltip>
          </div>
          {usage && project ? (
            <p className="text-sm text-gray-600">
              {usage} / {project.usageLimit} clicks (
              {(usage / project.usageLimit) * 100}%)
            </p>
          ) : (
            <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse" />
          )}
          <div className="bg-gray-200 rounded-full h-3 w-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width:
                  project && usage
                    ? (usage / project.usageLimit) * 100 + "%"
                    : "0%",
              }}
              transition={{ duration: 0.5, type: "spring" }}
              className={`${
                usage > project?.usageLimit ? "bg-red-500" : "bg-blue-500"
              } rounded-full h-3`}
            />
          </div>
        </div>
        <div className="p-10">
          <h3 className="font-medium">Number of Links</h3>
          <div className="flex items-center mt-4">
            {linkCount ? (
              <p className="text-2xl font-semibold text-black">
                {nFormatter(linkCount)}
              </p>
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse" />
            )}
            <Divider className="w-8 h-8 text-gray-500" />
            <Infinity className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>
      <div className="border-b border-gray-200" />
      <div className="px-10 py-5 flex justify-between items-center">
        <p className="text-gray-500 text-sm">
          For{" "}
          <Tooltip content="1 million link clicks per month">
            <span className="font-medium text-gray-700 underline underline-offset-2 cursor-default hover:text-black">
              increased limits
            </span>
          </Tooltip>
          , upgrade to the Pro plan.
        </p>
        <button className="bg-blue-500 text-white border-blue-500 hover:text-blue-500 hover:bg-white h-9 w-24 text-sm border-solid border rounded-md focus:outline-none transition-all ease-in-out duration-150">
          Upgrade
        </button>
      </div>
    </div>
  );
}
