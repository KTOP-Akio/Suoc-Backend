import { prisma } from "@/lib/prisma";
import { getLeadEvent, recordSale } from "@/lib/tinybird";
import { redis } from "@/lib/upstash";
import { nanoid } from "@dub/utils";
import type Stripe from "stripe";
import { retrieveSubscription } from "./subscription";

// Handle event "invoice.paid"
export async function invoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const stripeAccountId = event.account as string;
  const stripeCustomerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;
  const invoiceId = invoice.id;

  // Find customer
  const customer = await prisma.customer.findFirst({
    where: {
      projectConnectId: stripeAccountId,
      stripeCustomerId,
    },
  });

  if (!customer) {
    return;
  }

  // Find lead
  const leadEvent = await getLeadEvent({ customerId: customer.id });
  if (!leadEvent || leadEvent.data.length === 0) {
    return;
  }

  // Skip if invoice id is already processed
  const ok = await redis.set(`dub_sale_events:invoiceId:${invoiceId}`, 1, {
    ex: 60 * 60 * 24 * 7,
    nx: true,
  });

  if (!ok) {
    console.info(
      "[Stripe Webhook] Skipping already processed invoice.",
      invoiceId,
    );
    return;
  }

  // Retrieve subscription if available
  const subscription = await retrieveSubscription(subscriptionId);

  // Record sale
  await recordSale({
    ...leadEvent.data[0],
    event_id: nanoid(16),
    payment_processor: "stripe",
    amount: invoice.amount_paid,
    currency: invoice.currency,
    refunded: 0,
    invoice_id: invoiceId,
    recurring: subscription?.recurring || 0,
    product_id: subscription?.productId || "",
    recurring_interval: subscription?.recurringInterval || "",
    recurring_interval_count: subscription?.recurringIntervalCount || 0,
    metadata: JSON.stringify({
      invoice,
    }),
  });
}
