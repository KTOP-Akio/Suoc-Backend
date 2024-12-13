"use server";

import { stripe } from "@/lib/stripe";
import { APP_DOMAIN_WITH_NGROK } from "@dub/utils";
import { authPartnerActionClient } from "../safe-action";

export const createAccountLinkAction = authPartnerActionClient.action(
  async ({ ctx, parsedInput }) => {
    const { partner } = ctx;

    if (!partner.stripeConnectId) {
      throw new Error("Partner does not have a Stripe Connect account.");
    }

    const stripeConnectVerified = true;

    const { url } = stripeConnectVerified
      ? await stripe.accounts.createLoginLink(partner.stripeConnectId)
      : await stripe.accountLinks.create({
          account: partner.stripeConnectId,
          refresh_url: `${APP_DOMAIN_WITH_NGROK}/settings`,
          return_url: `${APP_DOMAIN_WITH_NGROK}/settings`,
          type: "account_onboarding",
          collect: "eventually_due",
        });

    return {
      url,
    };
  },
);
