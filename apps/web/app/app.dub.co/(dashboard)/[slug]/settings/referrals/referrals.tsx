"use client";

import { EventType } from "@/lib/analytics/types";
import {
  REFERRAL_CLICKS_QUOTA_BONUS,
  REFERRAL_CLICKS_QUOTA_BONUS_MAX,
  REFERRAL_REVENUE_SHARE,
} from "@/lib/referrals/constants";
import { DubProvider } from "@dub/blocks";
import { Wordmark } from "@dub/ui";
import { Check } from "@dub/ui/src/icons";
import { nFormatter } from "@dub/utils";
import { Suspense } from "react";
import { EventTabs } from "./event-tabs";
import { Events } from "./events";
import { HeroBackground } from "./hero-background";
import ReferralLink, { ReferralLinkSkeleton } from "./referral-link";
import { Stats } from "./stats";

interface ReferralsProps {
  slug: string;
  event: EventType | undefined;
  page: string | undefined;
  publicToken: string | undefined | null;
}

export const Referrals = ({
  slug,
  event,
  page,
  publicToken,
}: ReferralsProps) => {
  if (!publicToken) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <h2 className="mb-2 text-2xl font-semibold text-gray-800">
          Unavailable
        </h2>
        <p className="text-gray-600">Sorry, the referral token is not found.</p>
      </div>
    );
  }

  return (
    <DubProvider publicToken={publicToken}>
      <div>
        <div className="relative">
          <div className="relative overflow-hidden rounded-xl border border-gray-200 p-4 sm:p-9">
            <Suspense>
              <HeroBackground slug={slug} />
            </Suspense>

            <div className="relative">
              <h1 className="text-xl font-semibold text-black sm:text-2xl">
                Refer and earn
              </h1>

              {/* Benefits */}
              <div className="mt-6 flex flex-col gap-6">
                {[
                  {
                    title: `${nFormatter(REFERRAL_REVENUE_SHARE * 100)}% recurring revenue`,
                    description: "per paying customer (up to 1 year)",
                  },
                  {
                    title: `${nFormatter(REFERRAL_CLICKS_QUOTA_BONUS)} extra clicks quota per month`,
                    description: `per signup (up to ${nFormatter(REFERRAL_CLICKS_QUOTA_BONUS_MAX, { full: true })} total)`,
                  },
                ].map(({ title, description }) => (
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full border border-gray-200 bg-gradient-to-t from-gray-100 to-white">
                      <div className="rounded-full bg-green-500 p-0.5">
                        <Check className="size-3.5 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-800">
                        {title}
                      </p>
                      <p className="text-xs text-gray-500">{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Referral link + invite button or empty/error states */}
              <Suspense fallback={<ReferralLinkSkeleton />}>
                <ReferralLink slug={slug} />
              </Suspense>
            </div>
          </div>

          {/* Powered by Dub Conversions */}
          <a
            href="https://d.to/conversions"
            target="_blank"
            className="mt-2 flex items-center justify-center gap-2 rounded-lg border-gray-100 bg-white p-2 transition-colors hover:border-gray-200 active:bg-gray-50 md:absolute md:bottom-3 md:right-3 md:mt-0 md:translate-x-0 md:border md:drop-shadow-sm"
          >
            <Wordmark className="h-4" />
            <p className="text-xs text-gray-800">
              Powered by <span className="font-medium">Dub Conversions</span>
            </p>
          </a>
        </div>

        {/* Stats */}
        <div className="mt-8">
          <Stats />
        </div>

        {/* Events */}
        <div className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Activity</h2>
            <EventTabs />
          </div>
          <Events event={event || "clicks"} page={page || "1"} />
        </div>
      </div>
    </DubProvider>
  );
};
