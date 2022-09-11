import Modal from "@/components/shared/modal";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import { useRouter } from "next/router";
import BlurImage from "@/components/shared/blur-image";
import LoadingDots from "@/components/shared/icons/loading-dots";
import { AlertCircleFill } from "@/components/shared/icons";
import { useDebounce } from "use-debounce";
import { mutate } from "swr";

function EditDomainModalHelper({
  showEditDomainModal,
  setShowEditDomainModal,
  domain,
}: {
  showEditDomainModal: boolean;
  setShowEditDomainModal: Dispatch<SetStateAction<boolean>>;
  domain: string;
}) {
  const router = useRouter();
  const { slug } = router.query;
  const [saving, setSaving] = useState(false);
  const [buttonText, setButtonText] = useState("Confirm domain change");
  const [domainExistsError, setdomainExistsError] = useState(false);

  const [data, setData] = useState(domain);
  const [debouncedDomain] = useDebounce(domain, 1000);

  useEffect(() => {
    if (debouncedDomain.length > 0 && debouncedDomain !== domain) {
      fetch(`/api/domains/${debouncedDomain}/exists`).then(async (res) => {
        if (res.status === 200) {
          const exists = await res.json();
          setdomainExistsError(exists === 1);
        }
      });
    }
  }, [debouncedDomain]);

  return (
    <Modal
      showModal={showEditDomainModal}
      setShowModal={setShowEditDomainModal}
    >
      <div className="inline-block w-full max-w-md overflow-hidden align-middle transition-all transform bg-white shadow-xl rounded-2xl">
        <div className="flex flex-col justify-center items-center space-y-3 sm:px-16 px-4 pt-8 py-4 border-b border-gray-200">
          <BlurImage
            src={`https://logo.clearbit.com/${domain}`}
            alt={domain}
            className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600"
            width={20}
            height={20}
          />
          <h3 className="font-medium text-lg">Change Domain</h3>
          <p className="text-sm text-gray-500">
            Warning: Changing your project's domain will break all existing
            short links.
          </p>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            fetch(`/api/projects/${slug}/domains`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            }).then((res) => {
              setSaving(false);
              if (res.status === 200) {
                setButtonText("Saved!");
                mutate(`/api/projects/${slug}`);
                setTimeout(() => {
                  setButtonText("Save changes");
                });
              }
            });
          }}
          className="flex flex-col space-y-6 text-left bg-gray-50 sm:px-16 px-4 py-8"
        >
          <div>
            <label
              htmlFor="key"
              className="block text-sm font-medium text-gray-700"
            >
              Domain
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                type="text"
                name="key"
                id="key"
                required
                autoFocus={false}
                className={`${
                  domainExistsError
                    ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 text-gray-900 placeholder-gray-300 focus:border-gray-500 focus:ring-gray-500"
                } pr-10 block w-full rounded-md focus:outline-none sm:text-sm`}
                placeholder="github"
                value={data}
                onChange={(e) => {
                  setdomainExistsError(false);
                  setData(e.target.value);
                }}
                aria-invalid="true"
                aria-describedby="key-error"
              />
              {domainExistsError && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <AlertCircleFill
                    className="h-5 w-5 text-red-500"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
            {domainExistsError && (
              <p className="mt-2 text-sm text-red-600" id="key-error">
                Domain is already in use.
              </p>
            )}
          </div>

          <button
            disabled={saving || domainExistsError}
            className={`${
              saving || domainExistsError
                ? "cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400"
                : "bg-red-600 hover:bg-white hover:text-red-600 border-red-600 text-white"
            } flex justify-center items-center w-full text-sm h-10 rounded-md border transition-all focus:outline-none`}
          >
            {saving ? <LoadingDots color="#808080" /> : <p>{buttonText}</p>}
          </button>
        </form>
      </div>
    </Modal>
  );
}

export function useEditDomainModal({ domain }: { domain: string }) {
  const [showEditDomainModal, setShowEditDomainModal] = useState(false);

  const EditDomainModal = useCallback(() => {
    return (
      <EditDomainModalHelper
        showEditDomainModal={showEditDomainModal}
        setShowEditDomainModal={setShowEditDomainModal}
        domain={domain}
      />
    );
  }, [showEditDomainModal, setShowEditDomainModal, domain]);

  return useMemo(
    () => ({ setShowEditDomainModal, EditDomainModal }),
    [setShowEditDomainModal, EditDomainModal]
  );
}
