import { useAddEditLinkModal } from "@/ui/modals/add-edit-link-modal";
import { useArchiveLinkModal } from "@/ui/modals/archive-link-modal";
import { useDeleteLinkModal } from "@/ui/modals/delete-link-modal";
import { useLinkQRModal } from "@/ui/modals/link-qr-modal";
import {
  Button,
  IconMenu,
  PenWriting,
  Popover,
  SimpleTooltipContent,
  useIntersectionObserver,
} from "@dub/ui";
import { CircleCheck, Copy, QRCode } from "@dub/ui/src/icons";
import { cn, isDubDomain, nanoid, punycode } from "@dub/utils";
import { Archive, CopyPlus, Delete, FolderInput } from "lucide-react";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import { useTransferLinkModal } from "../modals/transfer-link-modal";
import { ThreeDots } from "../shared/icons";
import { ResponseLink } from "./links-container";

export function LinkControls({ link }: { link: ResponseLink }) {
  const { slug } = useParams() as { slug?: string };

  const ref = useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(ref, {});
  const isVisible = !!entry?.isIntersecting;

  const [openPopover, setOpenPopover] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState(false);

  const copyLinkId = () => {
    navigator.clipboard.writeText(link.id);
    setCopiedLinkId(true);
    toast.success("Link ID copied!");
    setTimeout(() => setCopiedLinkId(false), 3000);
  };

  const { setShowArchiveLinkModal, ArchiveLinkModal } = useArchiveLinkModal({
    props: link,
  });
  const { setShowTransferLinkModal, TransferLinkModal } = useTransferLinkModal({
    props: link,
  });
  const { setShowDeleteLinkModal, DeleteLinkModal } = useDeleteLinkModal({
    props: link,
  });
  const { setShowLinkQRModal, LinkQRModal } = useLinkQRModal({
    props: link,
  });
  const { setShowAddEditLinkModal, AddEditLinkModal } = useAddEditLinkModal({
    props: link,
  });

  // Duplicate link Modal
  const {
    id: _,
    createdAt: __,
    updatedAt: ___,
    userId: ____,
    ...propsToDuplicate
  } = link;
  const {
    setShowAddEditLinkModal: setShowDuplicateLinkModal,
    AddEditLinkModal: DuplicateLinkModal,
  } = useAddEditLinkModal({
    // @ts-expect-error
    duplicateProps: {
      ...propsToDuplicate,
      key: link.key === "_root" ? nanoid(7) : `${punycode(link.key)}-copy`,
      clicks: 0,
    },
  });

  return (
    <div ref={ref} className="flex justify-end sm:w-[124px]">
      <div
        className={cn(
          "flex items-center justify-end divide-x divide-gray-200 overflow-hidden rounded-md border border-gray-200",
          "sm:divide-transparent sm:border-transparent sm:group-hover/row:divide-gray-200 sm:group-hover/row:border-gray-200", // Only show divider on mobile or when hovered
          "w-[43px] transition-[width] duration-300 sm:group-hover/row:w-[124px]",
        )}
      >
        {isVisible && (
          <>
            <LinkQRModal />
            <AddEditLinkModal />
            <DuplicateLinkModal />
            <ArchiveLinkModal />
            <TransferLinkModal />
            <DeleteLinkModal />
          </>
        )}
        <Button
          icon={<PenWriting className={cn("h-4 w-4 shrink-0")} />}
          variant="outline"
          className="h-8 rounded-none border-0 px-3"
          onClick={() => setShowAddEditLinkModal(true)}
        />
        <Button
          icon={<QRCode className={cn("h-4 w-4 shrink-0")} />}
          variant="outline"
          className="h-8 rounded-none border-0 px-3"
          onClick={() => setShowLinkQRModal(true)}
        />
        <Popover
          content={
            <div className="w-full sm:w-48">
              <div className="grid gap-px p-2">
                <Button
                  text="Edit"
                  variant="outline"
                  onClick={() => {
                    setOpenPopover(false);
                    setShowAddEditLinkModal(true);
                  }}
                  icon={<PenWriting className="h-4 w-4" />}
                  shortcut="E"
                  className="h-9 px-2 font-medium"
                />
                <Button
                  text="QR Code"
                  variant="outline"
                  onClick={() => {
                    setOpenPopover(false);
                    setShowLinkQRModal(true);
                  }}
                  icon={<QRCode className="h-4 w-4" />}
                  shortcut="Q"
                  className="h-9 px-2 font-medium"
                />
                <Button
                  text="Duplicate"
                  variant="outline"
                  onClick={() => {
                    setOpenPopover(false);
                    setShowDuplicateLinkModal(true);
                  }}
                  icon={<CopyPlus className="h-4 w-4" />}
                  shortcut="D"
                  className="h-9 px-2 font-medium"
                />
                <Button
                  text="Copy Link ID"
                  variant="outline"
                  onClick={() => copyLinkId()}
                  icon={
                    copiedLinkId ? (
                      <CircleCheck className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )
                  }
                  shortcut="I"
                  className="h-9 px-2 font-medium"
                />
              </div>
              <div className="border-t border-gray-200" />
              <div className="grid gap-px p-2">
                <Button
                  text={link.archived ? "Unarchive" : "Archive"}
                  variant="outline"
                  onClick={() => {
                    setOpenPopover(false);
                    setShowArchiveLinkModal(true);
                  }}
                  icon={<Archive className="h-4 w-4" />}
                  shortcut="A"
                  className="h-9 px-2 font-medium"
                />
                <Button
                  text="Transfer"
                  variant="outline"
                  onClick={() => {
                    setOpenPopover(false);
                    setShowTransferLinkModal(true);
                  }}
                  icon={<FolderInput className="h-4 w-4" />}
                  shortcut="T"
                  className="h-9 px-2 font-medium"
                  {...(!isDubDomain(link.domain) && {
                    disabledTooltip: (
                      <SimpleTooltipContent
                        title="Since this is a custom domain link, you can only transfer it to another workspace if you transfer the domain as well."
                        cta="Learn more."
                        href="https://dub.co/help/article/how-to-transfer-domains"
                      />
                    ),
                  })}
                />
                {link.key !== "_root" && (
                  <Button
                    text="Delete"
                    variant="danger-outline"
                    onClick={() => {
                      setOpenPopover(false);
                      setShowDeleteLinkModal(true);
                    }}
                    icon={<Delete className="h-4 w-4" />}
                    shortcut="X"
                    className="h-9 px-2 font-medium"
                  />
                )}
                {!slug && ( // this is only shown in admin mode (where there's no slug)
                  <button
                    onClick={() => {
                      window.confirm(
                        "Are you sure you want to ban this link? It will blacklist the domain and prevent any links from that domain from being created.",
                      ) &&
                        (setOpenPopover(false),
                        toast.promise(
                          fetch(`/api/admin/links/ban?key=${link.key}`, {
                            method: "DELETE",
                          }).then(async () => {
                            await mutate(
                              (key) =>
                                typeof key === "string" &&
                                key.startsWith("/api/admin/links/ban"),
                              undefined,
                              { revalidate: true },
                            );
                          }),
                          {
                            loading: "Banning link...",
                            success: "Link banned!",
                            error: "Error banning link.",
                          },
                        ));
                    }}
                    className="group flex w-full items-center justify-between rounded-md p-2 text-left text-sm font-medium text-red-600 transition-all duration-75 hover:bg-red-600 hover:text-white"
                  >
                    <IconMenu
                      text="Ban"
                      icon={<Delete className="h-4 w-4" />}
                    />
                    <kbd className="hidden rounded bg-red-100 px-2 py-0.5 text-xs font-light text-red-600 transition-all duration-75 group-hover:bg-red-500 group-hover:text-white sm:inline-block">
                      B
                    </kbd>
                  </button>
                )}
              </div>
            </div>
          }
          align="end"
          openPopover={openPopover}
          setOpenPopover={setOpenPopover}
        >
          <Button
            variant="outline"
            className="h-8 rounded-none border-0 px-2.5 transition-[border-color] duration-200"
            icon={<ThreeDots className="h-5 w-5 shrink-0" />}
            onClick={() => {
              setOpenPopover(!openPopover);
            }}
          />
        </Popover>
      </div>
    </div>
  );
}
