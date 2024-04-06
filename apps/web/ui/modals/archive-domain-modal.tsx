import useWorkspace from "@/lib/swr/use-workspace";
import { DomainProps } from "@/lib/types";
import { Button, Modal, useToastWithUndo } from "@dub/ui";
import { getApexDomain } from "@dub/utils";
import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import LinkLogo from "../links/link-logo";

const sendArchiveRequest = ({
  domain,
  archive,
  workspaceId,
}: {
  domain: string;
  archive: boolean;
  workspaceId?: string;
}) => {
  const baseUrl = `/api/domains/${domain}/archive`;
  return fetch(`${baseUrl}?workspaceId=${workspaceId}`, {
    method: archive ? "POST" : "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

function ArchiveDomainModal({
  showArchiveDomainModal,
  setShowArchiveDomainModal,
  props,
}: {
  showArchiveDomainModal: boolean;
  setShowArchiveDomainModal: Dispatch<SetStateAction<boolean>>;
  props: DomainProps;
}) {
  const toastWithUndo = useToastWithUndo();

  const { id: workspaceId } = useWorkspace();
  const [archiving, setArchiving] = useState(false);
  const domain = props.slug;
  const apexDomain = getApexDomain(domain);

  const handleArchiveRequest = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    setArchiving(true);
    const res = await sendArchiveRequest({
      domain,
      archive: !props.archived,
      workspaceId,
    });
    setArchiving(false);

    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error.message);
      return;
    }

    mutate(`/api/domains?workspaceId=${workspaceId}`);
    setShowArchiveDomainModal(false);
    toastWithUndo({
      id: "domain-archive-undo-toast",
      message: `Successfully ${props.archived ? "unarchived" : "archived"} domain!`,
      undo: undoAction,
      duration: 5000,
    });
  };

  const undoAction = () => {
    toast.promise(
      sendArchiveRequest({
        domain,
        archive: props.archived,
        workspaceId,
      }),
      {
        loading: "Undo in progress...",
        error: "Failed to roll back changes. An error occurred.",
        success: () => {
          mutate(`/api/domains?workspaceId=${workspaceId}`);
          return "Undo successful! Changes reverted.";
        },
      },
    );
  };

  return (
    <Modal
      showModal={showArchiveDomainModal}
      setShowModal={setShowArchiveDomainModal}
    >
      <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-4 pt-8 text-center sm:px-16">
        <LinkLogo apexDomain={apexDomain} />
        <h3 className="text-lg font-medium">
          {props.archived ? "Unarchive" : "Archive"} {domain}
        </h3>
        <p className="text-sm text-gray-500">
          {props.archived
            ? "By unarchiving this domain, it will show up in the link creation modal again."
            : "Archived domains will still work, but they won't show up in the link creation modal."}
        </p>
      </div>

      <div className="flex flex-col space-y-6 bg-gray-50 px-4 py-8 text-left sm:px-16">
        <Button
          onClick={handleArchiveRequest}
          autoFocus
          loading={archiving}
          text={`Confirm ${props.archived ? "unarchive" : "archive"}`}
        />
      </div>
    </Modal>
  );
}

export function useArchiveDomainModal({ props }: { props: DomainProps }) {
  const [showArchiveDomainModal, setShowArchiveDomainModal] = useState(false);

  const ArchiveDomainModalCallback = useCallback(() => {
    return props ? (
      <ArchiveDomainModal
        showArchiveDomainModal={showArchiveDomainModal}
        setShowArchiveDomainModal={setShowArchiveDomainModal}
        props={props}
      />
    ) : null;
  }, [showArchiveDomainModal, setShowArchiveDomainModal]);

  return useMemo(
    () => ({
      setShowArchiveDomainModal,
      ArchiveDomainModal: ArchiveDomainModalCallback,
    }),
    [setShowArchiveDomainModal, ArchiveDomainModalCallback],
  );
}
