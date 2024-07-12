"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { OAuthAuthorizedAppProps } from "@/lib/types";
import { useDeleteAppModal } from "@/ui/modals/delete-oauth-app-modal";
import EmptyState from "@/ui/shared/empty-state";
import { Delete } from "@/ui/shared/icons";
import {
  BlurImage,
  Button,
  LoadingSpinner,
  Popover,
  TokenAvatar,
} from "@dub/ui";
import { Key } from "@dub/ui/src/icons";
import { fetcher, formatDate } from "@dub/utils";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

export default function AuthorizedAppsPageClient() {
  const { id: workspaceId } = useWorkspace();
  const { data: apps, isLoading } = useSWR<OAuthAuthorizedAppProps[]>(
    `/api/oauth-apps/authorized?workspaceId=${workspaceId}`,
    fetcher,
  );

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col items-center justify-between gap-4 space-y-3 border-b border-gray-200 p-5 sm:flex-row sm:space-y-0 sm:p-10">
          <div className="flex max-w-screen-sm flex-col space-y-3">
            <h2 className="text-xl font-medium">Integrations Enabled</h2>
            <p className="text-sm text-gray-500">
              Applications that have access to your workspace resources.
            </p>
          </div>
        </div>
        {isLoading || !apps ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-20">
            <LoadingSpinner className="h-6 w-6 text-gray-500" />
            <p className="text-sm text-gray-500">
              Fetching authorized applications...
            </p>
          </div>
        ) : apps.length > 0 ? (
          <div>
            <div className="grid grid-cols-5 border-b border-gray-200 px-5 py-2 text-sm font-medium text-gray-500 sm:px-10">
              <div className="col-span-3">Name</div>
            </div>
            <div className="divide-y divide-gray-200">
              {apps.map((app) => (
                <AppRow key={app.id} {...app} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-y-4 py-20">
            <EmptyState
              icon={Key}
              title="You haven’t authorized any applications to access Dub workspace on your behalf."
            />
          </div>
        )}
      </div>
    </>
  );
}

const AppRow = (app: OAuthAuthorizedAppProps) => {
  const [openPopover, setOpenPopover] = useState(false);

  const { DeleteAppModal, setShowDeleteAppModal } = useDeleteAppModal({
    app: {
      clientId: app.clientId,
      name: app.name,
    },
    appType: "authorized",
  });

  return (
    <>
      <DeleteAppModal />
      <div className="relative grid grid-cols-5 items-center px-5 py-3 sm:px-10">
        <div className="col-span-3 flex items-center space-x-3">
          {app.logo ? (
            <BlurImage
              src={app.logo}
              alt={`Logo for ${app.name}`}
              className="h-10 w-10 rounded-full border border-gray-200"
              width={20}
              height={20}
            />
          ) : (
            <TokenAvatar id={app.clientId} />
          )}
          <div className="flex flex-col space-y-px">
            <p className="font-semibold text-gray-700">{app.name}</p>
            <div className="flex items-center gap-x-2">
              <p className="text-sm text-gray-500" suppressHydrationWarning>
                Authorized by {app.user.name} on {formatDate(app.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <Popover
          content={
            <div className="w-full sm:w-48">
              <div className="grid gap-px p-2">
                <Button
                  text="Disconnect"
                  variant="danger-outline"
                  icon={<Delete className="h-4 w-4" />}
                  className="h-9 justify-start px-2 font-medium"
                  onClick={() => {
                    setOpenPopover(false);
                    setShowDeleteAppModal(true);
                  }}
                />
              </div>
            </div>
          }
          align="end"
          openPopover={openPopover}
          setOpenPopover={setOpenPopover}
        >
          <button
            onClick={() => {
              setOpenPopover(!openPopover);
            }}
            className="absolute right-4 rounded-md px-1 py-2 transition-all duration-75 hover:bg-gray-100 active:bg-gray-200"
          >
            <MoreVertical className="h-5 w-5 text-gray-500" />
          </button>
        </Popover>
      </div>
    </>
  );
};
