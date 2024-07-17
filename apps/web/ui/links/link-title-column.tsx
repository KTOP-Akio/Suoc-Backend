"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { DomainProps, UserProps } from "@/lib/types";
import {
  ArrowTurnRight2,
  Avatar,
  CardList,
  CopyButton,
  LinkLogo,
  QRCode,
  Switch,
  Tooltip,
  TooltipContent,
  useIntersectionObserver,
  useMediaQuery,
} from "@dub/ui";
import {
  Apple,
  ArrowRight,
  Bolt,
  Cards,
  CircleHalfDottedClock,
  EarthPosition,
  EyeSlash,
  InputPassword,
  Page2,
  Robot,
} from "@dub/ui/src/icons";
import {
  cn,
  fetcher,
  formatDateTime,
  getApexDomain,
  isDubDomain,
  linkConstructor,
} from "@dub/utils";
import { formatDate } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Mail } from "lucide-react";
import { PropsWithChildren, useContext, useRef } from "react";
import useSWR from "swr";
import { useAddEditLinkModal } from "../modals/add-edit-link-modal";
import { useLinkQRModal } from "../modals/link-qr-modal";
import { ResponseLink } from "./links-container";

const quickViewSettings = [
  { label: "Custom Social Media Cards", icon: Cards, key: "proxy" },
  { label: "Link Cloaking", icon: EyeSlash, key: "rewrite" },
  { label: "Password Protection", icon: InputPassword, key: "password" },
  { label: "Link Expiration", icon: CircleHalfDottedClock, key: "expiresAt" },
  { label: "iOS Targeting", icon: Apple, key: "ios" },
  { label: "Android Targeting", icon: Robot, key: "android" },
  { label: "Geo Targeting", icon: EarthPosition, key: "geo" },
];

export function LinkTitleColumn({ link }: { link: ResponseLink }) {
  const { url, domain, key } = link;

  const { isMobile } = useMediaQuery();

  const { hovered } = useContext(CardList.Card.Context);

  const ref = useRef<HTMLDivElement>(null);

  // Use intersection observer for basic "virtualization" to improve transition performance
  const entry = useIntersectionObserver(ref, {});
  const isVisible = !!entry?.isIntersecting;

  const hasQuickViewSettings = quickViewSettings.some(({ key }) => link?.[key]);

  return (
    <div
      ref={ref}
      className="flex h-[32px] items-center gap-3 transition-[height] group-data-[variant=loose]/card-list:h-[60px]"
    >
      {isVisible && (
        <>
          <div className="relative hidden shrink-0 items-center justify-center sm:flex">
            {/* Link logo background circle */}
            <div className="absolute inset-0 shrink-0 rounded-full border border-gray-200 opacity-0 transition-opacity group-data-[variant=loose]/card-list:sm:opacity-100">
              <div className="h-full w-full rounded-full border border-white bg-gradient-to-t from-gray-100" />
            </div>
            <div className="relative pr-0.5 transition-[padding] group-data-[variant=loose]/card-list:sm:p-2">
              <LinkLogo
                apexDomain={getApexDomain(url)}
                className="h-4 w-4 shrink-0 transition-[width,height] sm:h-6 sm:w-6 group-data-[variant=loose]/card-list:sm:h-5 group-data-[variant=loose]/card-list:sm:w-5"
              />
            </div>
          </div>
          <div className="h-[24px] min-w-0 overflow-hidden transition-[height] group-data-[variant=loose]/card-list:h-[44px]">
            <div className="flex items-center gap-2">
              <div className="min-w-0 text-gray-950">
                <UnverifiedTooltip link={link}>
                  <div className="flex items-center font-medium">
                    <span
                      title={linkConstructor({ domain, key, pretty: true })}
                      className="truncate leading-6"
                    >
                      {linkConstructor({ domain, key, pretty: true })}
                    </span>

                    <AnimatePresence>
                      {(hovered || isMobile) && (
                        <motion.div
                          initial={{
                            width: 0,
                            opacity: 0,
                          }}
                          animate={{
                            width: "auto",
                            opacity: 1,
                          }}
                          exit={{
                            width: 0,
                            opacity: 0,
                          }}
                          transition={{ duration: 0.15 }}
                          className="-mt-px ml-1 flex translate-y-px items-center justify-end gap-1 overflow-visible [mask-image:linear-gradient(to_right,transparent,black_4px)]"
                        >
                          <div className="w-0" /> {/* Spacer for masking */}
                          {hasQuickViewSettings && (
                            <SettingsBadge link={link} />
                          )}
                          {link.comments && (
                            <CommentsBadge comments={link.comments} />
                          )}
                          <CopyButton
                            value={linkConstructor({
                              domain,
                              key,
                              pretty: false,
                            })}
                            variant="neutral"
                            className="p-1"
                          />
                          <QRCodeButton link={link} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </UnverifiedTooltip>
              </div>
              <Details link={link} compact />
            </div>

            <Details link={link} />
          </div>
        </>
      )}
    </div>
  );
}

function UnverifiedTooltip({
  link,
  children,
}: PropsWithChildren<{ link: ResponseLink }>) {
  const { id: workspaceId, slug } = useWorkspace();

  const { data: { verified } = {}, isLoading } = useSWR<DomainProps>(
    !isDubDomain(link.domain) &&
      workspaceId &&
      `/api/domains/${link.domain}?workspaceId=${workspaceId}`,
    fetcher,
  );

  return !isLoading && !isDubDomain(link.domain) && !verified ? (
    <Tooltip
      content={
        <TooltipContent
          title="Your branded links won't work until you verify your domain."
          cta="Verify your domain"
          href={`/${slug}/settings/domains`}
        />
      }
    >
      <div className="text-gray-500 line-through">{children}</div>
    </Tooltip>
  ) : (
    children
  );
}

function SettingsBadge({ link }: { link: ResponseLink }) {
  const settings = quickViewSettings.filter(({ key }) => link?.[key]);

  const { AddEditLinkModal, setShowAddEditLinkModal } = useAddEditLinkModal({
    props: link,
  });

  return (
    <div className="hidden sm:block">
      <AddEditLinkModal />
      <Tooltip
        content={({ setOpen }) => (
          <div className="flex w-[340px] flex-col p-3 text-sm">
            {settings.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  setShowAddEditLinkModal(true);
                }}
                className="flex items-center justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-950">{label}</span>
                </div>
                <Switch checked />
              </button>
            ))}
          </div>
        )}
        side="bottom"
      >
        <div className="rounded-full bg-gray-100 p-1 hover:bg-gray-200">
          <Bolt className="h-3.5 w-3.5" />
        </div>
      </Tooltip>
    </div>
  );
}

function CommentsBadge({ comments }: { comments: string }) {
  return (
    <div className="hidden sm:block">
      <Tooltip
        content={
          <div className="divide-y-gray-200 divide-y text-sm">
            <div className="flex items-center gap-2 px-4 py-3">
              <Page2 className="h-3.5 w-3.5" />
              <span className="text-gray-500">Link comments</span>
            </div>
            <p className="max-w-[300px] px-5 py-3 text-gray-700">{comments}</p>
          </div>
        }
        side="bottom"
      >
        <div className="rounded-full bg-gray-100 p-1 hover:bg-gray-200">
          <Page2 className="h-3.5 w-3.5" />
        </div>
      </Tooltip>
    </div>
  );
}

function QRCodeButton({ link }: { link: ResponseLink }) {
  const { setShowLinkQRModal, LinkQRModal } = useLinkQRModal({
    props: link,
  });

  return (
    <div className="sm:block">
      <LinkQRModal />
      <button
        type="button"
        onClick={() => setShowLinkQRModal(true)}
        className="rounded-full bg-gray-100 p-[5px] hover:bg-gray-200"
      >
        <QRCode className="h-3 w-3" />
      </button>
    </div>
  );
}

function Details({ link, compact }: { link: ResponseLink; compact?: boolean }) {
  const { url, user, createdAt } = link;
  return (
    <div
      className={cn(
        "min-w-0 items-center gap-1.5 text-sm transition-[opacity,display] delay-[0s,150ms] duration-[150ms,0s] md:gap-3",
        compact
          ? "hidden opacity-0 group-data-[variant=compact]/card-list:flex group-data-[variant=compact]/card-list:opacity-100"
          : "hidden opacity-0 group-data-[variant=loose]/card-list:flex group-data-[variant=loose]/card-list:opacity-100",
      )}
    >
      <div className="flex min-w-0 items-center gap-1">
        {compact ? (
          <ArrowRight className="mr-1 h-3 w-3 text-gray-400" />
        ) : (
          <ArrowTurnRight2 className="h-3 w-3 text-gray-400" />
        )}
        <span
          className={cn("truncate", url ? "text-gray-500" : "text-gray-400")}
          title={url}
        >
          {url?.replace(/^https?:\/\//, "") || "No URL configured"}
        </span>
      </div>
      <div className="hidden shrink-0 sm:block">
        <UserAvatar user={user} />
      </div>
      <div className="hidden sm:block">
        <Tooltip content={formatDateTime(createdAt)}>
          <span className="text-gray-400">
            {formatDate(createdAt, "MMM d")}
          </span>
        </Tooltip>
      </div>
    </div>
  );
}

function UserAvatar({ user }: { user: UserProps }) {
  const { slug } = useWorkspace();

  return (
    <Tooltip
      content={
        <div className="w-full p-3">
          <Avatar user={user} className="h-8 w-8" />
          <div className="mt-2 flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-700">
              {user?.name || user?.email || "Anonymous User"}
            </p>
            {!slug && // this is only shown in admin mode (where there's no slug)
              user?.email && (
                <CopyButton
                  value={user.email}
                  icon={Mail}
                  className="[&>*]:h-3 [&>*]:w-3"
                />
              )}
          </div>
          {user?.name && user.email && (
            <p className="mt-1 text-xs text-gray-500">{user.email}</p>
          )}
        </div>
      }
    >
      <div>
        <Avatar user={user} className="h-4 w-4" />
      </div>
    </Tooltip>
  );
}
