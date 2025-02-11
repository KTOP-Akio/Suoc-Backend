import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      id: "ceaef6d9-767e-49aa-a6ab-46c02aa79604",
      created_at: "2021-11-24T06:31:06.672Z",
      updated_at: "2022-02-22T23:17:55.119Z",
      name: "Best Friends of Rewardful",
      url: "https://rewardful.com/",
      private: false,
      private_tokens: false,
      commission_amount_cents: null,
      commission_amount_currency: null,
      minimum_payout_cents: 0,
      max_commission_period_months: null,
      max_commissions: null,
      days_before_referrals_expire: 30,
      days_until_commissions_are_due: 30,
      affiliate_dashboard_text: "",
      custom_reward_description: "",
      welcome_text: "",
      customers_visible_to_affiliates: false,
      sale_description_visible_to_affiliates: true,
      parameter_type: "query",
      stripe_coupon_id: "jo45MTj3",
      default: false,
      reward_type: "percent",
      commission_percent: 30.0,
      minimum_payout_currency: "USD",
      visitors: 150,
      leads: 39,
      conversions: 7,
      affiliates: 12,
    },
  ]);
}
