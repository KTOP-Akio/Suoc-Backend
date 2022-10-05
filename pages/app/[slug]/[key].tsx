import Link from "next/link";
import Stats from "@/components/stats";
import BlurImage from "@/components/shared/blur-image";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { Lock } from "@/components/shared/icons";
import AppLayout from "@/components/layout/app";
import useProject from "@/lib/swr/use-project";
import ErrorPage from "next/error";
import useUsage from "@/lib/swr/use-usage";

export default function StatsPage() {
  const { project, error } = useProject();
  const { exceededUsage } = useUsage();

  // handle error page
  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <AppLayout>
      {exceededUsage && (
        <MaxWidthWrapper>
          <div className="border border-gray-200 rounded-md bg-white my-10 py-12 flex flex-col justify-center items-center">
            <div className="bg-gray-100 rounded-full p-3">
              <Lock className="w-6 h-6 text-gray-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-700 my-3">
              Stats Locked
            </h1>
            <p className="text-gray-600 text-sm max-w-sm text-center z-10">
              You have exceeded your usage limits. We're still collecting data
              on your link, but you need to upgrade to view them.
            </p>
            <BlurImage
              src="/static/illustrations/video-park.svg"
              alt="No links yet"
              width={400}
              height={400}
              className="-my-8"
            />
            <Link href="/settings">
              <a className="text-white hover:text-black bg-black hover:bg-white font-medium text-sm px-10 py-2 border rounded-md border-black transition-all duration-75 z-10">
                Upgrade now
              </a>
            </Link>
          </div>
        </MaxWidthWrapper>
      )}
      {project && !exceededUsage && <Stats domain={project.domain} />}
    </AppLayout>
  );
}
