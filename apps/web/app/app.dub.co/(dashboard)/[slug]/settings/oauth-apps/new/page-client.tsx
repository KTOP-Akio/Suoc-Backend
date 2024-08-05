"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import AddOAuthAppForm from "@/ui/oauth-apps/add-edit-app-form";
import { MaxWidthWrapper } from "@dub/ui";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function NewOAuthAppPageClient() {
  const { slug, flags } = useWorkspace();

  if (!flags?.integrations) {
    redirect(`/${slug}/settings`);
  }

  return (
    <>
      <MaxWidthWrapper className="grid max-w-screen-lg gap-8">
        <Link
          href={`/${slug}/settings/oauth-apps`}
          className="flex items-center gap-x-1"
        >
          <ChevronLeft className="size-4" />
          <p className="text-sm font-medium text-gray-500">
            Back to OAuth Apps
          </p>
        </Link>
      </MaxWidthWrapper>

      <MaxWidthWrapper className="max-w-screen-lg space-y-6">
        <AddOAuthAppForm oAuthApp={null} />
      </MaxWidthWrapper>
    </>
  );
}
