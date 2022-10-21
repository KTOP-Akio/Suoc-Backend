import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import useSWR from "swr";
import BlurImage from "@/components/shared/blur-image";
import CopyButton from "@/components/shared/copy-button";
import { Chart, LoadingDots, QR, ThreeDots } from "@/components/shared/icons";
import Tooltip, { TooltipContent } from "@/components/shared/tooltip";
import useProject from "@/lib/swr/use-project";
import useUsage from "@/lib/swr/use-usage";
import { LinkProps } from "@/lib/types";
import {
  fetcher,
  getApexDomain,
  linkConstructor,
  nFormatter,
  timeAgo,
} from "@/lib/utils";
import Popover from "../shared/popover";
import { useAddEditLinkModal } from "./modals/add-edit-link-modal";
import { useArchiveLinkModal } from "./modals/archive-link-modal";
import { useDeleteLinkModal } from "./modals/delete-link-modal";
import { useLinkQRModal } from "./modals/link-qr-modal";

export default function LinkCard({ props }: { props: LinkProps }) {
  const { key, url, createdAt, expiresAt } = props;

  const apexDomain = getApexDomain(url);

  const router = useRouter();
  const { slug } = router.query as { slug: string };

  const { project } = useProject();
  const { domain } = project || {};
  const { isOwner } = useProject();
  const { exceededUsage } = useUsage();

  const { data: clicks, isValidating } = useSWR<number>(
    domain
      ? `/api/projects/${slug}/domains/${domain}/links/${key}/clicks`
      : `/api/edge/links/${key}/clicks`,
    fetcher,
    {
      fallbackData: props.clicks,
    },
  );

  const { setShowLinkQRModal, LinkQRModal } = useLinkQRModal({
    props,
  });
  const { setShowAddEditLinkModal, AddEditLinkModal } = useAddEditLinkModal({
    props,
  });
  const { setShowArchiveLinkModal, ArchiveLinkModal } = useArchiveLinkModal({
    props,
  });
  const { setShowDeleteLinkModal, DeleteLinkModal } = useDeleteLinkModal({
    props,
  });
  const [openPopover, setOpenPopover] = useState(false);

  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-all">
      <LinkQRModal />
      <AddEditLinkModal />
      <ArchiveLinkModal />
      <DeleteLinkModal />
      <li className="relative flex justify-between items-center">
        {expiresAt && new Date() > new Date(expiresAt) ? (
          <div className="absolute top-0 left-0 rounded-t-lg w-full h-1.5 bg-amber-500" />
        ) : null}
        <div className="relative flex items-center space-x-4">
          <BlurImage
            src={`https://www.google.com/s2/favicons?sz=64&domain_url=${apexDomain}`}
            alt={apexDomain}
            className="w-10 h-10 rounded-full"
            width={20}
            height={20}
          />
          <div>
            <div className="flex items-center space-x-2 max-w-fit">
              <a
                className="text-blue-800 text-sm sm:text-base font-semibold truncate w-32 sm:w-full"
                href={linkConstructor({ key, domain })}
                target="_blank"
                rel="noreferrer"
              >
                {linkConstructor({ key, domain, pretty: true })}
              </a>
              <CopyButton url={linkConstructor({ key, domain })} />
              <button
                onClick={() => setShowLinkQRModal(true)}
                className="group p-1.5 rounded-full bg-gray-100 hover:bg-blue-100 hover:scale-105 active:scale-95 transition-all duration-75"
              >
                <span className="sr-only">Download QR</span>
                <QR className="text-gray-700 group-hover:text-blue-800 transition-all" />
              </button>
              <Link href={`${router.asPath}/${encodeURI(key)}`}>
                <a className="flex items-center space-x-1 rounded-md bg-gray-100 px-2 py-0.5 hover:scale-105 active:scale-95 transition-all duration-75">
                  <Chart className="w-4 h-4" />
                  <p className="text-sm text-gray-500 whitespace-nowrap">
                    {isValidating ? (
                      <LoadingDots color="#71717A" />
                    ) : (
                      nFormatter(clicks)
                    )}
                    <span className="hidden sm:inline-block ml-1">clicks</span>
                  </p>
                </a>
              </Link>
            </div>
            <h3 className="text-sm font-medium text-gray-700 line-clamp-1">
              {url}
            </h3>
          </div>
        </div>

        <div className="flex items-center">
          <p className="text-sm hidden sm:block text-gray-500 whitespace-nowrap mr-3">
            Added {timeAgo(createdAt)}
          </p>
          <p className="text-sm sm:hidden text-gray-500 whitespace-nowrap mr-3">
            {timeAgo(createdAt, true)}
          </p>
          <Popover
            content={
              <div className="w-full sm:w-40 p-2 grid gap-1">
                {slug && exceededUsage ? (
                  <Tooltip
                    content={
                      <TooltipContent
                        title={
                          isOwner
                            ? "You have exceeded your usage limit. We're still collecting data on your existing links, but you need to upgrade to edit them."
                            : "The owner of this project has exceeded their usage limit. We're still collecting data on all existing links, but they need to upgrade their plan to edit them."
                        }
                        cta={isOwner && "Upgrade"}
                        ctaLink={isOwner && "/settings"}
                      />
                    }
                  >
                    <div className="w-full text-gray-300 cursor-not-allowed font-medium text-sm p-2 text-left transition-all duration-75">
                      Edit
                    </div>
                  </Tooltip>
                ) : (
                  <button
                    onClick={() => {
                      setOpenPopover(false);
                      setShowAddEditLinkModal(true);
                    }}
                    className="w-full font-medium text-sm text-gray-500 p-2 text-left rounded-md hover:bg-gray-100 transition-all duration-75"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => {
                    setOpenPopover(false);
                    setShowArchiveLinkModal(true);
                  }}
                  className="w-full font-medium text-sm text-gray-500 p-2 text-left rounded-md hover:bg-gray-100 transition-all duration-75"
                >
                  Archive
                </button>
                <button
                  onClick={() => {
                    setOpenPopover(false);
                    setShowDeleteLinkModal(true);
                  }}
                  className="w-full font-medium text-sm text-red-600 hover:bg-red-600 hover:text-white p-2 text-left rounded-md transition-all duration-75"
                >
                  Delete
                </button>
              </div>
            }
            align="end"
            openPopover={openPopover}
            setOpenPopover={setOpenPopover}
          >
            <button className="rounded-md px-1 py-2 hover:bg-gray-100 active:bg-gray-200 transition-all duration-75">
              <ThreeDots className="w-5 h-5 text-gray-500" />
            </button>
          </Popover>
        </div>
      </li>
    </div>
  );
}
