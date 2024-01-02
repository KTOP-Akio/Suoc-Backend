import { getStripe } from "@/lib/stripe/client";
import { CheckCircleFill } from "@/ui/shared/icons";
import { Badge, Button, Logo, Modal, useRouterStuff } from "@dub/ui";
import {
  HOME_DOMAIN,
  PLANS,
  STAGGER_CHILD_VARIANTS,
  capitalize,
} from "@dub/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Confetti from "react-dom-confetti";

function UpgradePlanModal({
  showUpgradePlanModal,
  setShowUpgradePlanModal,
  defaultPlan,
}: {
  showUpgradePlanModal: boolean;
  setShowUpgradePlanModal: Dispatch<SetStateAction<boolean>>;
  defaultPlan: "Pro" | "Business";
}) {
  const router = useRouter();
  const params = useParams() as { slug: string };
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const welcomeFlow = pathname === "/welcome";
  const slug = welcomeFlow ? searchParams?.get("slug") : params.slug;

  const [plan, setPlan] = useState<"Pro" | "Business">(defaultPlan);
  const [period, setPeriod] = useState<"monthly" | "yearly">("yearly");
  const currentPlan = PLANS.find((p) => p.name === plan) ?? PLANS[0];
  const features = PLANS.find((p) => p.name === plan)?.features ?? [];
  const [clicked, setClicked] = useState(false);
  const { queryParams } = useRouterStuff();

  return (
    <Modal
      showModal={showUpgradePlanModal}
      setShowModal={setShowUpgradePlanModal}
      className="max-w-lg"
      preventDefaultClose={welcomeFlow}
      onClose={() => {
        if (welcomeFlow) {
          router.back();
        } else {
          queryParams({
            del: "upgrade",
          });
        }
      }}
    >
      <motion.div
        variants={{
          show: {
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-8 sm:px-16"
      >
        <motion.div variants={STAGGER_CHILD_VARIANTS}>
          <Logo />
        </motion.div>
        <motion.h3
          className="text-lg font-medium"
          variants={STAGGER_CHILD_VARIANTS}
        >
          Upgrade to {plan}
        </motion.h3>
        <motion.p
          className="text-center text-sm text-gray-500"
          variants={STAGGER_CHILD_VARIANTS}
        >
          Enjoy higher limits and extra features with Dub.co {plan}
        </motion.p>
      </motion.div>
      <div className="bg-gray-50 px-4 py-8 text-left sm:px-16">
        <motion.div
          className="flex flex-col space-y-3"
          variants={STAGGER_CHILD_VARIANTS}
          initial="hidden"
          animate="show"
        >
          <div className="mb-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900">
                  {plan} {capitalize(period)}
                </h4>
                <Badge
                  variant="neutral"
                  className="text-sm font-normal normal-case"
                >
                  $
                  {(period === "yearly"
                    ? currentPlan.price[period]! * 12
                    : currentPlan.price[period]!
                  ).toString()}
                  /{period.replace("ly", "")}
                </Badge>
              </div>
              <Confetti
                active={period === "yearly"}
                config={{ elementCount: 200, spread: 90 }}
              />
              <button
                onClick={() => {
                  setPeriod(period === "monthly" ? "yearly" : "monthly");
                }}
                className="text-xs text-gray-500 underline underline-offset-4 transition-colors hover:text-gray-800"
              >
                {period === "monthly"
                  ? "🎁 Save 20% with yearly"
                  : "Switch to monthly"}
              </button>
            </div>
            <motion.div
              variants={{
                show: {
                  transition: {
                    staggerChildren: 0.08,
                  },
                },
              }}
              initial="hidden"
              animate="show"
              className="flex flex-col space-y-2"
            >
              {features.map(({ text }, i) => (
                <motion.div
                  key={i}
                  variants={STAGGER_CHILD_VARIANTS}
                  className="flex items-center space-x-2 text-sm text-gray-500"
                >
                  <CheckCircleFill className="h-5 w-5 text-green-500" />
                  <span>{text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <Button
            text={`Upgrade to ${plan} ${capitalize(period)}`}
            loading={clicked}
            onClick={() => {
              setClicked(true);
              fetch(
                `/api/projects/${slug}/billing/upgrade?plan=${plan.toLowerCase()}_${period}`,
                {
                  method: "POST",
                },
              )
                .then(async (res) => {
                  const data = await res.json();
                  const { id: sessionId } = data;
                  const stripe = await getStripe();
                  stripe?.redirectToCheckout({ sessionId });
                })
                .catch((err) => {
                  alert(err);
                  setClicked(false);
                });
            }}
          />
          {welcomeFlow ? (
            <Link
              href={`/${slug}`}
              className="text-center text-xs text-gray-500 underline underline-offset-4 transition-colors hover:text-gray-800"
            >
              Skip for now
            </Link>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => {
                  setPlan(plan === "Pro" ? "Business" : "Pro");
                }}
                className="text-center text-xs text-gray-500 underline-offset-4 transition-all hover:text-gray-800 hover:underline"
              >
                {process.env.NEXT_PUBLIC_APP_NAME}{" "}
                {plan === "Pro" ? "Business" : "Pro"}
              </button>
              <p className="text-gray-500">•</p>
              <a
                href={`${HOME_DOMAIN}/pricing`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-xs text-gray-500 underline-offset-4 transition-all hover:text-gray-800 hover:underline"
              >
                Compare plans
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </Modal>
  );
}

export function useUpgradePlanModal(
  { defaultPlan } = { defaultPlan: "Pro" } as {
    defaultPlan: "Pro" | "Business";
  },
) {
  const [showUpgradePlanModal, setShowUpgradePlanModal] = useState(false);
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("upgrade")) {
      setShowUpgradePlanModal(true);
    }
  }, [searchParams]);

  const UpgradePlanModalCallback = useCallback(() => {
    return (
      <UpgradePlanModal
        showUpgradePlanModal={showUpgradePlanModal}
        setShowUpgradePlanModal={setShowUpgradePlanModal}
        defaultPlan={
          (capitalize(searchParams?.get("upgrade")) as "Pro" | "Business") ||
          defaultPlan
        }
      />
    );
  }, [showUpgradePlanModal, setShowUpgradePlanModal, defaultPlan]);

  return useMemo(
    () => ({
      setShowUpgradePlanModal,
      UpgradePlanModal: UpgradePlanModalCallback,
    }),
    [setShowUpgradePlanModal, UpgradePlanModalCallback],
  );
}
