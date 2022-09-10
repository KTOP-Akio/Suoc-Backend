import Modal from "@/components/shared/modal";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import BlurImage from "@/components/shared/blur-image";
import LoadingDots from "@/components/shared/icons/loading-dots";
import { LinkProps } from "@/lib/types";
import { linkConstructor, timeAgo } from "@/lib/utils";
import { AlertCircleFill } from "@/components/shared/icons";
import { useDebounce } from "use-debounce";
import TextareaAutosize from "react-textarea-autosize";
import { mutate } from "swr";

function EditModalHelper({
  showEditModal,
  setShowEditModal,
  props,
  slug,
}: {
  showEditModal: boolean;
  setShowEditModal: Dispatch<SetStateAction<boolean>>;
  props: LinkProps;
  slug?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [buttonText, setButtonText] = useState("Save changes");
  const [keyExistsError, setKeyExistsError] = useState(false);
  const urlHostname = new URL(props.url).hostname;

  const [data, setData] = useState<LinkProps>(props);
  const { key, url, title, timestamp } = data;
  const [debouncedKey] = useDebounce(key, 1000);

  useEffect(() => {
    if (debouncedKey.length > 0 && debouncedKey !== props.key) {
      fetch(
        slug
          ? `/api/projects/${slug}/links/${debouncedKey}/exists`
          : `/api/edge/links/${debouncedKey}/exists`
      ).then(async (res) => {
        if (res.status === 200) {
          const exists = await res.json();
          setKeyExistsError(exists === 1);
        }
      });
    }
  }, [debouncedKey]);

  return (
    <Modal showModal={showEditModal} setShowModal={setShowEditModal}>
      <div className="inline-block w-full max-w-md overflow-hidden align-middle transition-all transform bg-white shadow-xl rounded-2xl">
        <div className="flex flex-col justify-center items-center space-y-3 sm:px-16 px-4 pt-8 py-4 border-b border-gray-200">
          <BlurImage
            src={`https://logo.clearbit.com/${urlHostname}`}
            alt={urlHostname}
            className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600"
            width={20}
            height={20}
          />
          <h3 className="font-medium text-lg">
            Edit {linkConstructor(props.key, true)}
          </h3>
          <p className="text-sm text-gray-500">Added {timeAgo(timestamp)}</p>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            fetch(
              slug
                ? `/api/projects/${slug}/links/${props.key}`
                : `/api/links/${props.key}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
              }
            ).then((res) => {
              setSaving(false);
              if (res.status === 200) {
                setButtonText("Saved!");
                mutate(slug ? `/api/projects/${slug}` : `/api/links`);
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
              Short Link
            </label>
            <div className="relative flex mt-1 rounded-md shadow-sm">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-5 text-gray-500 sm:text-sm">
                {slug || "dub.sh"}
              </span>
              <input
                type="text"
                name="key"
                id="key"
                required
                autoFocus={false}
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

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <div className="flex mt-1 rounded-md shadow-sm">
              <TextareaAutosize
                name="title"
                id="title"
                required
                minRows={3}
                className="border-gray-300 text-gray-900 placeholder-gray-300 focus:border-gray-500 focus:ring-gray-500 pr-10 block w-full rounded-md focus:outline-none sm:text-sm"
                placeholder="Dub - an open-source link shortener with built-in analytics + free custom domains."
                value={title}
                onChange={(e) => {
                  setData({ ...data, title: e.target.value });
                }}
                aria-invalid="true"
              />
            </div>
          </div>

          <button
            disabled={saving || keyExistsError}
            className={`${
              saving || keyExistsError
                ? "cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400"
                : "bg-black hover:bg-white hover:text-black border-black text-white"
            } flex justify-center items-center w-full text-sm h-10 rounded-md border transition-all focus:outline-none`}
          >
            {saving ? <LoadingDots color="#808080" /> : <p>{buttonText}</p>}
          </button>
        </form>
      </div>
    </Modal>
  );
}

export function useEditModal({
  props,
  slug,
}: {
  props: LinkProps;
  slug?: string;
}) {
  const [showEditModal, setShowEditModal] = useState(false);

  const EditModal = useCallback(() => {
    return (
      <EditModalHelper
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        props={props}
        slug={slug}
      />
    );
  }, [showEditModal, setShowEditModal, props, slug]);

  return useMemo(
    () => ({ setShowEditModal, EditModal }),
    [setShowEditModal, EditModal]
  );
}
