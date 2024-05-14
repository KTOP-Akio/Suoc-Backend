import useWorkspace from "@/lib/swr/use-workspace";
import { LinkProps } from "@/lib/types";
import {
  Facebook,
  ImageDrop,
  LinkedIn,
  LoadingCircle,
  Photo,
  Popover,
  SimpleTooltipContent,
  Tooltip,
  Twitter,
  useRouterStuff,
} from "@dub/ui";
import { Button } from "@dub/ui/src/button";
import { getDomainWithoutWWW, resizeImage } from "@dub/utils";
import { Edit2, Link2, Upload } from "lucide-react";
import {
  ChangeEvent,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDebounce } from "use-debounce";
import { usePromptModal } from "../prompt-modal";

export default function Preview({
  data,
  setData,
  generatingMetatags,
}: {
  data: LinkProps;
  setData: Dispatch<SetStateAction<LinkProps>>;
  generatingMetatags: boolean;
}) {
  const { title, description, image, url, password } = data;
  const [debouncedUrl] = useDebounce(url, 500);
  const hostname = useMemo(() => {
    if (password) return "dub.co";
    return getDomainWithoutWWW(debouncedUrl);
  }, [password, debouncedUrl]);

  const onImageChange = (image: string) =>
    setData((prev) => ({ ...prev, image }));

  return (
    <div>
      <div className="sticky top-0 z-10 flex h-14 items-center justify-center border-b border-gray-200 bg-white px-5 sm:h-24">
        <h2 className="text-lg font-medium">Social Previews</h2>
      </div>
      <div className="grid gap-5 p-5">
        {/* Twitter */}
        <div>
          <div className="relative mb-2">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <div className="flex items-center space-x-2 bg-white px-3">
                <Twitter className="h-3 w-3" />
                <p className="text-sm text-gray-400">Twitter</p>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-gray-300">
            <ImagePreview
              image={image}
              onImageChange={onImageChange}
              generatingMetatags={generatingMetatags}
            />
            {title && (
              <div className="absolute bottom-2 left-2 rounded-md bg-[#414142] px-1.5 py-px">
                <h3 className="max-w-sm truncate text-sm text-white">
                  {title}
                </h3>
              </div>
            )}
          </div>
          {hostname && (
            <p className="mt-2 text-[0.8rem] text-[#606770]">{hostname}</p>
          )}
        </div>

        {/* Facebook */}
        <div>
          <div className="relative mb-2">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <div className="flex items-center space-x-2 bg-white px-3">
                <Facebook className="h-4 w-4" />
                <p className="text-sm text-gray-400">Facebook</p>
              </div>
            </div>
          </div>
          <div className="relative border border-gray-300">
            <ImagePreview
              image={image}
              onImageChange={onImageChange}
              generatingMetatags={generatingMetatags}
            />
            <div className="grid gap-1 border-t border-gray-300 bg-[#f2f3f5] p-3">
              {hostname ? (
                <p className="text-[0.8rem] uppercase text-[#606770]">
                  {hostname}
                </p>
              ) : (
                <div className="mb-1 h-4 w-24 rounded-md bg-gray-200" />
              )}
              {title ? (
                <h3 className="truncate font-semibold text-[#1d2129]">
                  {title}
                </h3>
              ) : (
                <div className="mb-1 h-5 w-full rounded-md bg-gray-200" />
              )}
              {description ? (
                <p className="line-clamp-2 text-sm text-[#606770]">
                  {description}
                </p>
              ) : (
                <div className="grid gap-2">
                  <div className="h-4 w-full rounded-md bg-gray-200" />
                  <div className="h-4 w-48 rounded-md bg-gray-200" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LinkedIn */}
        <div>
          <div className="relative mb-2">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <div className="flex items-center space-x-2 bg-white px-3">
                <LinkedIn className="h-4 w-4 text-[#0077b5]" />
                <p className="text-sm text-gray-400">LinkedIn</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.15),0_2px_3px_rgba(0,0,0,0.2)]">
            <ImagePreview
              image={image}
              onImageChange={onImageChange}
              generatingMetatags={generatingMetatags}
            />
            <div className="grid gap-1 border-t border-gray-300 bg-white p-3">
              {title ? (
                <h3 className="truncate font-semibold text-[#000000E6]">
                  {title}
                </h3>
              ) : (
                <div className="mb-1 h-5 w-full rounded-md bg-gray-200" />
              )}
              {hostname ? (
                <p className="text-xs text-[#00000099]">{hostname}</p>
              ) : (
                <div className="mb-1 h-4 w-24 rounded-md bg-gray-200" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ImagePreview = ({
  image,
  onImageChange,
  generatingMetatags,
}: {
  image: string | null;
  onImageChange: (image: string) => void;
  generatingMetatags?: boolean;
}) => {
  const { plan } = useWorkspace();
  const isFreePlan = plan === "free";

  const inputFileRef = useRef<HTMLInputElement>(null);

  const [openPopover, setOpenPopover] = useState(false);
  const [resizing, setResizing] = useState(false);

  const { setShowPromptModal, PromptModal } = usePromptModal({
    title: "Use image from URL",
    description:
      "Paste an image URL to use for your link's social media cards.",
    label: "Image URL",
    inputProps: {
      placeholder: "https://example.com/og.png",
    },
    onSubmit: (image) => {
      if (image) onImageChange(image);
    },
  });

  const onInputFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      setResizing(true);

      const src = await resizeImage(file);
      onImageChange(src);

      // Delay to prevent flickering
      setTimeout(() => {
        setResizing(false);
      }, 500);
    },
    [],
  );

  const previewImage = useMemo(() => {
    if (generatingMetatags || resizing) {
      return (
        <div className="flex h-[250px] w-full flex-col items-center justify-center space-y-4 bg-gray-100">
          <LoadingCircle />
        </div>
      );
    }
    if (image) {
      return (
        <ImageDrop
          variant="plain"
          src={image}
          onChange={onImageChange}
          loading={generatingMetatags}
          clickToUpload={false}
          showHoverOverlay={false}
        />
      );
    } else {
      return (
        <div className="flex h-[250px] w-full flex-col items-center justify-center space-y-4 bg-gray-100">
          <Photo className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-400">
            Enter a link to generate a preview.
          </p>
        </div>
      );
    }
  }, [image, generatingMetatags, resizing]);

  return (
    <>
      <Popover
        align="end"
        content={
          <div className="grid w-full gap-px p-2">
            <Button
              text="Upload image"
              variant="outline"
              icon={<Upload className="h-4 w-4" />}
              className="h-9 justify-start px-2 font-medium disabled:border-none disabled:bg-transparent"
              onClick={() => {
                inputFileRef.current?.click();
                setOpenPopover(false);
              }}
            />
            <Button
              text="Use image from URL"
              variant="outline"
              icon={<Link2 className="h-4 w-4" />}
              className="h-9 justify-start px-2 font-medium"
              onClick={() => setShowPromptModal(true)}
            />
          </div>
        }
        openPopover={openPopover}
        setOpenPopover={setOpenPopover}
      >
        <div className="absolute right-2 top-2 z-10">
          <ProGuard isFreePlan={isFreePlan}>
            <div>
              <Button
                variant="secondary"
                onClick={() => setOpenPopover(!openPopover)}
                icon={<Edit2 className="h-3 w-3" />}
                className="h-8 w-8 rounded-md p-0 transition-all hover:bg-gray-100"
                disabled={isFreePlan}
              />
            </div>
          </ProGuard>
        </div>
      </Popover>
      {previewImage}
      <input
        ref={inputFileRef}
        onChange={onInputFileChange}
        type="file"
        className="hidden"
      />
      <PromptModal />
    </>
  );
};

const ProGuard = ({
  isFreePlan,
  children,
}: PropsWithChildren<{ isFreePlan: boolean }>) => {
  const { queryParams } = useRouterStuff();

  return isFreePlan ? (
    <Tooltip
      content={
        <SimpleTooltipContent
          title="Custom Social Media Cards are a Pro feature."
          cta="Upgrade to Pro"
          href={
            queryParams({
              set: {
                upgrade: "pro",
              },
              getNewPath: true,
            }) as string
          }
        />
      }
    >
      {children}
    </Tooltip>
  ) : (
    children
  );
};
