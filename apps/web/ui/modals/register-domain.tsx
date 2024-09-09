import useWorkspace from "@/lib/swr/use-workspace";
import { Button, Modal, SimpleTooltipContent, useMediaQuery } from "@dub/ui";
import { cn } from "@dub/utils";
import { CircleCheck, Search } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProBadgeTooltip } from "../shared/pro-badge-tooltip";

interface RegisterDomainProps {
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
}

interface DomainSearchResult {
  domain: string;
  available: boolean;
  price: string;
}

const RegisterDomain = ({ showModal, setShowModal }: RegisterDomainProps) => {
  const workspace = useWorkspace();
  const { isMobile } = useMediaQuery();
  const [isSearching, setIsSearching] = useState(false);
  const [slug, setSlug] = useState<string | undefined>(undefined);
  const [searchedDomains, setSearchedDomains] = useState<DomainSearchResult[]>(
    [],
  );

  useEffect(() => {
    setSlug(workspace.slug);
  }, [workspace.slug]);

  // Search for domain availability
  const searchDomainAvailability = async () => {
    setIsSearching(true);

    const response = await fetch(
      `/api/domains/search-availability?domain=${slug}.link&workspaceId=${workspace.id}`,
    );

    setIsSearching(false);

    if (!response.ok) {
      toast.error("Failed to search for domain availability.");
      return;
    }

    setSearchedDomains(await response.json());
  };

  // Register domain
  const registerDomain = async (domain: string) => {
    const response = await fetch(
      `/api/domains/register?domain=${domain}&workspaceId=${workspace.id}`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      toast.error("Failed to register domain.");
      return;
    }

    const data = await response.json();

    console.log(data);

    toast.success("Domain registered successfully!");
  };

  const searchedDomain = searchedDomains.find(
    (d) => d.domain === `${slug}.link`,
  );

  const availableDomains = searchedDomains.filter(
    (d) => d.domain !== `${slug}.link` && d.available,
  );

  return (
    <Modal showModal={showModal} setShowModal={setShowModal}>
      <h3 className="border-b border-gray-200 px-4 py-4 text-lg font-medium sm:px-6">
        Claim .link domain
      </h3>
      <form
        className="flex flex-col space-y-6 bg-white px-4 pb-8 pt-6 text-left sm:px-6"
        onSubmit={async (e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <p className="block text-sm font-medium text-gray-800">
              Search domains
            </p>

            {workspace.plan != "free" && (
              <ProBadgeTooltip
                content={
                  <SimpleTooltipContent
                    title="Search for a free .link domain to use for your short links."
                    cta="Learn more."
                    href="https://dub.co/help/article/how-to-add-custom-domain" // TODO: Update this link
                  />
                }
              />
            )}
          </div>

          <div
            className={cn(
              "mt-2 flex rounded-md border border-gray-300",
              //  searchedDomain?.available ? "bg-[#def5c6]" : "bg-white",
              // !searchedDomain?.available ? "bg-[#F5E4C6]" : "bg-white",
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
              placeholder={workspace.slug}
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
              }}
            />
            <span className="inline-flex items-center rounded-md rounded-l-none bg-white px-3 font-medium text-gray-500 sm:text-sm">
              .link
            </span>
            <div className="p-0.5">
              <Button
                className="h-8 w-fit border-gray-300 px-2"
                icon={<Search className="mx-0.5 size-4" />}
                onClick={searchDomainAvailability}
                disabled={!slug || isSearching}
                loading={isSearching}
              />
            </div>
          </div>

          {searchedDomain &&
            (searchedDomain?.available ? (
              <div className="rounded-md bg-[#DEF5C6] p-2 text-sm">
                <strong>{searchedDomain.domain}</strong> is available. Claim
                your free domain before it's gone!
              </div>
            ) : (
              <div className="rounded-md bg-[#F5E4C6] p-2 text-sm">
                <strong>{searchedDomain?.domain}</strong> is not available.
              </div>
            ))}
        </div>

        {availableDomains.length > 0 && (
          <div>
            <h2 className="text-sm font-medium">Available alternatives</h2>
            <div className="mt-2 overflow-hidden rounded-md border border-gray-200">
              <div className="flex flex-col divide-y divide-gray-200">
                {availableDomains.map((alternative) => (
                  <div
                    key={alternative.domain}
                    className="flex items-center justify-between px-3 py-2 focus:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <CircleCheck className="size-5 fill-green-500 text-white" />
                      <span className="text-sm font-medium">
                        {alternative.domain}
                      </span>
                    </div>
                    <Button
                      text="Claim domain"
                      className="h-8 w-fit"
                      onClick={() => registerDomain(alternative.domain)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>
      <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-4 sm:px-6">
        <Button
          variant="secondary"
          text="Cancel"
          className="h-9 w-fit"
          onClick={() => setShowModal(false)}
        />
        <Button
          text="Claim domain"
          className="h-9 w-fit"
          disabled={!searchedDomain?.available}
        />
      </div>
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
