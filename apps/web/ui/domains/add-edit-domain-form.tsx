import useWorkspace from "@/lib/swr/use-workspace";
import { DomainProps } from "@/lib/types";
import { createDomainBodySchema } from "@/lib/zod/schemas/domains";
import { AlertCircleFill, CheckCircleFill, Lock } from "@/ui/shared/icons";
import { UpgradeRequiredToast } from "@/ui/shared/upgrade-required-toast";
import {
  AnimatedSizeContainer,
  Badge,
  Button,
  InfoTooltip,
  LoadingSpinner,
  SimpleTooltipContent,
  Switch,
  useMediaQuery,
} from "@dub/ui";
import { cn } from "@dub/utils";
import { motion } from "framer-motion";
import {
  Binoculars,
  Crown,
  Milestone,
  QrCode,
  TextCursorInput,
} from "lucide-react";
import posthog from "posthog-js";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";

type FormData = z.infer<typeof createDomainBodySchema>;

export function AddEditDomainForm({
  props,
  onSuccess,
  showAdvancedOptions = true,
  className,
}: {
  props?: DomainProps;
  onSuccess?: (data: DomainProps) => void;
  showAdvancedOptions?: boolean;
  className?: string;
}) {
  const { id: workspaceId, plan } = useWorkspace();
  const [lockDomain, setLockDomain] = useState(true);
  const [domainStatus, setDomainStatus] = useState<
    "checking" | "conflict" | "has site" | "available" | null
  >(props ? "available" : null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      slug: props?.slug,
      logo: props?.logo,
      expiredUrl: props?.expiredUrl,
      notFoundUrl: props?.notFoundUrl,
      placeholder: props?.placeholder,
    },
  });

  const domain = watch("slug");

  const saveDisabled = useMemo(() => {
    return isSubmitting || domainStatus !== "available" || (props && !isDirty);
  }, [isSubmitting, domainStatus, props, isDirty]);

  const endpoint = useMemo(() => {
    if (props) {
      return {
        method: "PATCH",
        url: `/api/domains/${domain}?workspaceId=${workspaceId}`,
        successMessage: "Successfully updated domain!",
      };
    } else {
      return {
        method: "POST",
        url: `/api/domains?workspaceId=${workspaceId}`,
        successMessage: "Successfully added domain!",
      };
    }
  }, [props, workspaceId]);

  const { isMobile } = useMediaQuery();

  const isDubProvisioned = !!props?.registeredDomain;

  const onSubmit = async (formData: FormData) => {
    console.log("formData", formData);

    try {
      const res = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await Promise.all([
          mutate(
            (key) => typeof key === "string" && key.startsWith("/api/domains"),
          ),
          mutate(
            (key) => typeof key === "string" && key.startsWith("/api/links"),
            undefined,
            { revalidate: true },
          ),
        ]);
        const data = await res.json();
        posthog.capture(props ? "domain_updated" : "domain_created", data);
        toast.success(endpoint.successMessage);
        onSuccess?.(data);
      } else {
        const { error } = await res.json();
        if (res.status === 422) {
          setDomainStatus("conflict");
        }
        if (error.message.includes("Upgrade to Pro")) {
          toast.custom(() => (
            <UpgradeRequiredToast
              title="You've discovered a Pro feature!"
              message={error.message}
            />
          ));
        } else {
          toast.error(error.message);
        }
      }
    } catch (error) {
      toast.error(`Failed to ${props ? "update" : "add"} domain`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-y-6 text-left", className)}
    >
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="domain" className="flex items-center gap-x-2">
            <h2 className="text-sm font-medium text-neutral-700">
              Your domain
            </h2>
            <InfoTooltip
              content={
                <SimpleTooltipContent
                  title="Not sure which domain to use?"
                  cta="Check out our guide"
                  href="https://dub.co/help/article/choosing-a-custom-domain"
                />
              }
            />
          </label>
          {props && lockDomain && !isDubProvisioned && (
            <button
              className="flex items-center gap-x-2 text-sm text-neutral-500 transition-all duration-75 hover:text-black active:scale-95"
              type="button"
              onClick={() => {
                window.confirm(
                  "Warning: Changing your workspace's domain will break all existing short links. Are you sure you want to continue?",
                ) && setLockDomain(false);
              }}
            >
              <Lock className="h-3 w-3" />
              <p>Unlock</p>
            </button>
          )}
        </div>
        {props && lockDomain ? (
          <div className="mt-2 cursor-not-allowed rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-500 shadow-sm">
            {domain}
          </div>
        ) : (
          <div className="mt-2">
            <div
              className={cn(
                "-m-1 rounded-[0.625rem] p-1",
                domainStatus === "conflict"
                  ? "bg-orange-100 text-orange-800"
                  : domainStatus === "available"
                    ? "bg-green-100 text-green-800"
                    : "bg-neutral-200 text-neutral-500",
              )}
            >
              <div className="flex rounded-md border border-neutral-300 bg-white">
                <input
                  {...register("slug", {
                    onChange: (e) => {
                      if (e.target.value.trim()) {
                        setDomainStatus("checking");
                      } else {
                        setDomainStatus(null);
                      }
                    },
                    onBlur: (e) => {
                      if (
                        e.target.value.length > 0 &&
                        e.target.value.toLowerCase() !==
                          props?.slug.toLowerCase()
                      ) {
                        fetch(`/api/domains/${e.target.value}/exists`).then(
                          async (res) => {
                            const exists = await res.json();
                            setDomainStatus(
                              exists === 1 ? "conflict" : "available",
                            );
                          },
                        );
                      }
                    },
                  })}
                  className="block w-full rounded-md border-0 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-0 sm:text-sm"
                  placeholder="go.acme.com"
                  autoFocus={!isMobile}
                />
              </div>

              <AnimatedSizeContainer
                height
                transition={{ ease: "easeInOut", duration: 0.1 }}
              >
                <div className="flex justify-between gap-3 p-2 text-sm">
                  <p>
                    {domainStatus === "checking" ? (
                      <>
                        Checking availability for{" "}
                        <strong className="font-semibold underline underline-offset-2">
                          {domain}
                        </strong>
                        ...
                      </>
                    ) : domainStatus === "conflict" ? (
                      <>
                        The domain{" "}
                        <span className="font-semibold underline underline-offset-2">
                          {domain}
                        </span>{" "}
                        is already in use.
                      </>
                    ) : domainStatus === "available" ? (
                      <>
                        The domain{" "}
                        <span className="font-semibold underline underline-offset-2">
                          {domain}
                        </span>{" "}
                        looks clear to connect.
                      </>
                    ) : (
                      "Your domain will be used for shortlinks on Dub, and cannot be used for anything else while connected."
                    )}
                  </p>
                  {domainStatus === "checking" ? (
                    <LoadingSpinner className="mr-0.5 mt-0.5 size-4 shrink-0" />
                  ) : domainStatus === "conflict" ? (
                    <AlertCircleFill className="size-5 shrink-0 text-orange-500" />
                  ) : domainStatus === "available" ? (
                    <CheckCircleFill className="size-5 shrink-0 text-green-500" />
                  ) : null}
                </div>
              </AnimatedSizeContainer>
            </div>
          </div>
        )}
      </div>

      {showAdvancedOptions && (
        <>
          <div className="h-0.5 w-full bg-neutral-200" />
          <div className="flex flex-col gap-y-6">
            {ADVANCED_OPTIONS.map(
              ({ id, title, description, icon: Icon, proFeature }) => {
                const [showOption, setShowOption] = useState(!!watch(id));
                return (
                  <div key={id}>
                    <label className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg border border-neutral-200 bg-white p-2">
                          <Icon className="size-5 text-neutral-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-medium text-neutral-900">
                              {title}
                            </h2>
                            {proFeature && plan === "free" && (
                              <Badge className="flex items-center space-x-1 bg-white">
                                <Crown size={12} />
                                <p className="uppercase">Pro</p>
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500">
                            {description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={showOption}
                        fn={(checked) => {
                          setShowOption(checked);
                          if (!checked) {
                            setValue(id, "", {
                              shouldDirty: true,
                            });
                          }
                        }}
                      />
                    </label>
                    <motion.div
                      animate={{ height: showOption ? "auto" : 0 }}
                      transition={{ duration: 0.1 }}
                      initial={false}
                      className="-m-1 overflow-hidden p-1"
                    >
                      <div className="relative mt-2 rounded-md shadow-sm">
                        <input
                          {...register(id)}
                          className="block w-full rounded-md border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 sm:text-sm"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </motion.div>
                  </div>
                );
              },
            )}
          </div>
        </>
      )}

      <Button
        text={props ? "Save changes" : "Add domain"}
        disabled={saveDisabled}
        loading={isSubmitting}
      />
    </form>
  );
}

const ADVANCED_OPTIONS: {
  id: keyof FormData;
  title: string;
  description: string;
  icon: any;
  proFeature?: boolean;
}[] = [
  {
    id: "logo",
    title: "Custom QR code logo",
    description: "Set a custom logo for shortlink QR codes",
    icon: QrCode,
    proFeature: true,
  },
  {
    id: "expiredUrl",
    title: "Default expiration URL",
    description: "Redirects when the shortlink has expired",
    icon: Milestone,
  },
  {
    id: "notFoundUrl",
    title: "Not found URL",
    description: "Redirects when the shortlink doesn't exist",
    icon: Binoculars,
  },
  {
    id: "placeholder",
    title: "Input placeholder URL",
    description: "Set a placeholder URL for the link builder",
    icon: TextCursorInput,
  },
];
