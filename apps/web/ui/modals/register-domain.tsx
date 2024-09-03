import useWorkspace from "@/lib/swr/use-workspace";
import { Button, Modal, SimpleTooltipContent, useMediaQuery } from "@dub/ui";
import { cn } from "@dub/utils";
import { Search } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProBadgeTooltip } from "../shared/pro-badge-tooltip";
import { CircleCheck } from "@dub/ui/src/icons";

interface RegisterDomainProps {
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
}

const RegisterDomain = ({ showModal, setShowModal }: RegisterDomainProps) => {
  const workspace = useWorkspace();
  const { isMobile } = useMediaQuery();
  const [domain, setDomain] = useState<string | undefined>(undefined);
  const [isDomainAvailable, setIsDomainAvailable] = useState<boolean>(false);

  useEffect(() => {
    setDomain(`${workspace.slug}.link`);
  }, [workspace]);

  // Search for domain availability
  const searchDomainAvailability = async () => {
    const response = await fetch(
      `/api/domains/search-availability?domain=${domain}&workspaceId=${workspace.id}`,
    );

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error.message);
      return;
    }

    setIsDomainAvailable(data.available);
  };

  // Register domain
  const registerDomain = async () => {
    const response = await fetch(
      `/api/domains/claim?domain=${domain}&workspaceId=${workspace.id}`,
    );
  };

  return (
    <Modal showModal={true} setShowModal={setShowModal}>
      <h3 className="border-b border-gray-200 px-8 py-4 text-lg font-medium">
        Claim .link domain
      </h3>
      <form
        className="flex flex-col space-y-6 bg-gray-50 px-4 py-8 text-left sm:px-8"
        onSubmit={async (e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <p className="block text-sm font-medium text-gray-700">
              Search domains
            </p>

            <ProBadgeTooltip
              content={
                <SimpleTooltipContent
                  title="Redirect users to a specific URL when any link under this domain has expired."
                  cta="Learn more."
                  href="https://dub.co/help/article/link-expiration#setting-a-default-expiration-url-for-all-links-under-a-domain"
                />
              }
            />
          </div>

          <div
            className={cn(
              "mt-2 flex rounded-md border border-gray-300 p-1.5",
              isDomainAvailable ? "bg-[#def5c6]" : "bg-white",
              !isDomainAvailable ? "bg-[#F5E4C6]" : "bg-white",
            )}
          >
            <input
              name="domain"
              id="domain"
              type="text"
              required
              autoComplete="off"
              className="block w-full rounded-md rounded-r-none border-0 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
              aria-invalid="true"
              autoFocus={!isMobile}
              placeholder={domain}
              value={domain?.split(".")[0]}
              onChange={(e) => setDomain(e.target.value)}
            />
            <span className="inline-flex items-center rounded-md rounded-l-none bg-white px-3 font-medium text-gray-500 sm:text-sm">
              .link
            </span>
            <Button
              className="w-fit border-gray-300"
              icon={<Search className="h-4 w-4" />}
              onClick={searchDomainAvailability}
            />
          </div>

          {isDomainAvailable ? (
            <div className="rounded-md bg-[#DEF5C6] p-2 text-sm">
              <strong>{domain}</strong> is available. Claim your free domain
              before it's gone!
              <CircleCheck className="w-4 h-4" />
            </div>
          ) : (
            <div className="rounded-md bg-[#F5E4C6] p-2 text-sm">
              <strong>{domain}</strong> is not available.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            text="Cancel"
            onClick={() => setShowModal(false)}
          />
          <Button text="Claim domain" disabled={!isDomainAvailable} />
        </div>
      </form>
    </Modal>
  );
};

export function useRegisterDomainModal() {
  const [showRegisterDomainModal, setShowRegisterDomainModal] = useState(false);

  const RegisterDomainModal = useCallback(() => {
    return (
      <RegisterDomain
        showModal={showRegisterDomainModal}
        setShowModal={setShowRegisterDomainModal}
      />
    );
  }, [showRegisterDomainModal, setShowRegisterDomainModal]);

  return useMemo(
    () => ({ setShowRegisterDomainModal, RegisterDomainModal }),
    [setShowRegisterDomainModal, RegisterDomainModal],
  );
}
