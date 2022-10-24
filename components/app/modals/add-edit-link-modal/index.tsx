import { useRouter } from "next/router";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { mutate } from "swr";
import { useDebounce } from "use-debounce";
import MenuIcon from "@/components/layout/app/menu-icon";
import BlurImage from "@/components/shared/blur-image";
import {
  AlertCircleFill,
  LoadingCircle,
  LoadingDots,
  PlusCircle,
  Random,
  Save,
  X,
} from "@/components/shared/icons";
import Modal from "@/components/shared/modal";
import Tooltip, { TooltipContent } from "@/components/shared/tooltip";
import useProject from "@/lib/swr/use-project";
import useUsage from "@/lib/swr/use-usage";
import { LinkProps } from "@/lib/types";
import { getApexDomain, getQueryString, linkConstructor } from "@/lib/utils";
import AdvancedSettings from "./advanced-settings";

function AddEditLinkModal({
  showAddEditLinkModal,
  setShowAddEditLinkModal,
  props,
}: {
  showAddEditLinkModal: boolean;
  setShowAddEditLinkModal: Dispatch<SetStateAction<boolean>>;
  props?: LinkProps;
}) {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const { project: { domain } = {} } = useProject();

  const [keyExistsError, setKeyExistsError] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<LinkProps>(
    props || {
      domain: domain || "",
      key: "",
      url: "",
      archived: false,
      expiresAt: null,
      password: null,

      title: null,
      description: null,
      image: null,

      clicks: 0,
      userId: "",
      createdAt: new Date(),
    },
  );
  const { id, key, url, archived, expiresAt } = data;

  const heroProps = useMemo(() => {
    if (props?.url) {
      const apexDomain = getApexDomain(props.url);
      return {
        avatar: `https://www.google.com/s2/favicons?sz=64&domain_url=${apexDomain}`,
        alt: apexDomain,
        copy: `Edit ${linkConstructor({
          key: props.key,
          domain,
          pretty: true,
        })}`,
      };
    } else {
      return {
        avatar: "/static/logo.png",
        alt: "Dub.sh",
        copy: "Add a new link",
      };
    }
  }, [props]);

  const [debouncedKey] = useDebounce(key, 500);
  useEffect(() => {
    if (debouncedKey.length > 0 && debouncedKey !== props?.key) {
      fetch(
        domain
          ? `/api/projects/${slug}/domains/${domain}/links/${debouncedKey}/exists`
          : `/api/links/${debouncedKey}/exists`,
      ).then(async (res) => {
        if (res.status === 200) {
          const exists = await res.json();
          setKeyExistsError(exists);
        }
      });
    }
  }, [debouncedKey]);

  const generateRandomSlug = useCallback(async () => {
    setGeneratingSlug(true);
    const res = await fetch(
      domain
        ? `/api/projects/${slug}/domains/${domain}/links/random`
        : `/api/links/random`,
    );
    const key = await res.json();
    setData((prev) => ({ ...prev, key }));
    setGeneratingSlug(false);
  }, []);

  const endpoint = useMemo(() => {
    if (props?.key) {
      return {
        method: "PUT",
        url: domain
          ? `/api/projects/${slug}/domains/${domain}/links/${props.key}`
          : `/api/links/${props.key}`,
      };
    } else {
      return {
        method: "POST",
        url: domain
          ? `/api/projects/${slug}/domains/${domain}/links`
          : `/api/links`,
      };
    }
  }, [props]);

  const expired = expiresAt && new Date() > new Date(expiresAt);

  return (
    <Modal
      showModal={showAddEditLinkModal}
      setShowModal={setShowAddEditLinkModal}
      closeWithX={true}
    >
      <div className="inline-block w-full sm:max-w-md max-h-[calc(100vh-50px)] overflow-scroll align-middle transition-all transform bg-white sm:border sm:border-gray-200 shadow-xl sm:rounded-2xl">
        <button
          onClick={() => setShowAddEditLinkModal(false)}
          className="hidden sm:block absolute top-0 right-0 p-2 m-3 rounded-full group hover:bg-gray-100 text-gray-500 focus:outline-none active:bg-gray-200 transition-all duration-75"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col justify-center items-center space-y-3 sm:px-16 px-4 pt-10 pb-8 border-b border-gray-200">
          <BlurImage
            src={heroProps.avatar}
            alt={heroProps.alt}
            className="w-10 h-10 rounded-full"
            width={20}
            height={20}
          />
          <h3 className="font-medium text-lg">{heroProps.copy}</h3>
        </div>

        {id && (
          <div className="absolute -mt-3.5 w-full flex justify-center space-x-2 [&>*]:flex [&>*]:items-center [&>*]:h-7 [&>*]:px-4 [&>*]:rounded-full [&>*]:text-xs [&>*]:text-white [&>*]:uppercase">
            {expired ? (
              <span className="bg-amber-500">Expired</span>
            ) : (
              <span className="bg-green-500">Active</span>
            )}
            {archived && <span className="bg-gray-400">Archived</span>}
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            fetch(endpoint.url, {
              method: endpoint.method,
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            }).then((res) => {
              setSaving(false);
              if (res.status === 200) {
                mutate(
                  domain
                    ? `/api/projects/${slug}/domains/${domain}/links${getQueryString(
                        router,
                      )}`
                    : `/api/links${getQueryString(router)}`,
                );
                setShowAddEditLinkModal(false);
              } else {
                setKeyExistsError(true);
              }
            });
          }}
          className="grid gap-6 bg-gray-50 py-8"
        >
          <div className="grid gap-6 sm:px-16 px-4">
            <div>
              <div className="flex justify-between items-center">
                <label
                  htmlFor="key"
                  className="block text-sm font-medium text-gray-700"
                >
                  Short Link
                </label>
                <button
                  className="hover:text-black active:scale-95 flex items-center space-x-2 text-gray-500 text-sm transition-all duration-75"
                  onClick={generateRandomSlug}
                  disabled={generatingSlug}
                  type="button"
                >
                  {generatingSlug ? (
                    <LoadingCircle />
                  ) : (
                    <Random className="w-3 h-3" />
                  )}
                  <p>{generatingSlug ? "Generating" : "Randomize"}</p>
                </button>
              </div>
              <div className="relative flex mt-1 rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-5 text-gray-500 sm:text-sm whitespace-nowrap">
                  {domain || "dub.sh"}
                </span>
                <input
                  type="text"
                  name="key"
                  id="key"
                  required
                  autoFocus={false}
                  pattern="[\p{Letter}\p{Mark}\d-]+" // Unicode regex to match characters from all languages and numbers (and omit all symbols except for dashes)
                  className={`${
                    keyExistsError
                      ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 text-gray-900 placeholder-gray-300 focus:border-gray-500 focus:ring-gray-500"
                  } pr-10 block w-full rounded-r-md focus:outline-none sm:text-sm`}
                  placeholder="github"
                  value={key}
                  onChange={(e) => {
                    setKeyExistsError(false);
                    setData({ ...data, key: e.target.value });
                  }}
                  aria-invalid="true"
                  aria-describedby="key-error"
                />
                {keyExistsError && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <AlertCircleFill
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>
              {keyExistsError && (
                <p className="mt-2 text-sm text-red-600" id="key-error">
                  Short link is already in use.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700"
              >
                Destination URL
              </label>
              <div className="flex mt-1 rounded-md shadow-sm">
                <input
                  name="url"
                  id="url"
                  type="url"
                  required
                  className="border-gray-300 text-gray-900 placeholder-gray-300 focus:border-gray-500 focus:ring-gray-500 block w-full rounded-md focus:outline-none sm:text-sm"
                  placeholder="https://github.com/steven-tey/dub"
                  value={url}
                  onChange={(e) => {
                    setData({ ...data, url: e.target.value });
                  }}
                  aria-invalid="true"
                />
              </div>
            </div>
          </div>

          <AdvancedSettings data={data} setData={setData} />

          <div className="sm:px-16 px-4">
            <button
              disabled={saving || keyExistsError}
              className={`${
                saving || keyExistsError
                  ? "cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400"
                  : "bg-black hover:bg-white hover:text-black border-black text-white"
              } flex justify-center items-center w-full text-sm h-10 rounded-md border transition-all focus:outline-none`}
            >
              {saving ? (
                <LoadingDots color="#808080" />
              ) : (
                <MenuIcon
                  icon={props && <Save className="h-5 w-5" />}
                  text={props ? "Save changes" : "Add link"}
                />
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function AddEditLinkButton({
  setShowAddEditLinkModal,
}: {
  setShowAddEditLinkModal: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };

  const { project, isOwner } = useProject();
  const { exceededUsage } = useUsage();

  return project && !project.domainVerified ? (
    <Tooltip
      content={
        <TooltipContent
          title="This domain is not correctly configured. Please configure your domain to
start adding links."
          cta="Configure Domain"
          ctaLink={`/${slug}/settings`}
        />
      }
    >
      <div className="text-gray-300 cursor-not-allowed font-medium text-sm px-5 py-2 border rounded-md border-gray-200 transition-all duration-75">
        Add
      </div>
    </Tooltip>
  ) : slug && exceededUsage ? ( // only show exceeded usage tooltip if user is on a project page
    <Tooltip
      content={
        <TooltipContent
          title={
            isOwner
              ? "You have exceeded your usage limit. We're still collecting data on your existing links, but you need to upgrade to add more links."
              : "The owner of this project has exceeded their usage limit. We're still collecting data on all existing links, but they need to upgrade their plan to add more links."
          }
          cta={isOwner && "Upgrade"}
          ctaLink={isOwner && "/settings"}
        />
      }
    >
      <div className="text-gray-300 cursor-not-allowed font-medium text-sm px-5 py-2 border rounded-md border-gray-200 transition-all duration-75">
        Add
      </div>
    </Tooltip>
  ) : (
    <button
      onClick={() => setShowAddEditLinkModal(true)}
      className="text-white hover:text-black bg-black hover:bg-white active:scale-95 font-medium text-sm px-5 py-2 border rounded-md border-black transition-all duration-75"
    >
      Add
    </button>
  );
}

export function useAddEditLinkModal({ props }: { props?: LinkProps }) {
  const [showAddEditLinkModal, setShowAddEditLinkModal] = useState(false);

  const AddEditLinkModalCallback = useCallback(() => {
    return (
      <AddEditLinkModal
        showAddEditLinkModal={showAddEditLinkModal}
        setShowAddEditLinkModal={setShowAddEditLinkModal}
        props={props}
      />
    );
  }, [showAddEditLinkModal, setShowAddEditLinkModal, props]);

  const AddEditLinkButtonCallback = useCallback(() => {
    return (
      <AddEditLinkButton setShowAddEditLinkModal={setShowAddEditLinkModal} />
    );
  }, [setShowAddEditLinkModal]);

  return useMemo(
    () => ({
      setShowAddEditLinkModal,
      AddEditLinkModal: AddEditLinkModalCallback,
      AddEditLinkButton: AddEditLinkButtonCallback,
    }),
    [
      setShowAddEditLinkModal,
      AddEditLinkModalCallback,
      AddEditLinkButtonCallback,
    ],
  );
}
