import { prisma } from "@/lib/prisma";
import { getClickEvent, recordCustomer, recordLead } from "@/lib/tinybird";
import { dispatchWebhook } from "@/lib/webhook/publish-edge";
import { clickEventSchemaTB } from "@/lib/zod/schemas/clicks";
import { nanoid } from "@dub/utils";
import { waitUntil } from "@vercel/functions";
import type Stripe from "stripe";

// Handle event "customer.created"
export async function customerCreated(event: Stripe.Event) {
  const stripeCustomer = event.data.object as Stripe.Customer;
  const stripeAccountId = event.account as string;
  const externalId = stripeCustomer.metadata?.dubCustomerId;
  const clickId = stripeCustomer.metadata?.dubClickId;

  // The client app should always send dclid via metadata
  if (!clickId) {
    return "Click ID not found in Stripe customer metadata, skipping...";
  }

  // Find click
  const clickEvent = await getClickEvent({ clickId });
  if (!clickEvent || clickEvent.data.length === 0) {
    return `Click event with ID ${clickId} not found, skipping...`;
  }

  // Check the customer is not already created
  // Find customer using projectConnectId and externalId (the customer's ID in the client app)
  const customerFound = await prisma.customer.findFirst({
    where: {
      projectConnectId: stripeAccountId,
      externalId,
    },
  });

  if (customerFound) {
    return `Customer with external ID ${externalId} already exists, skipping...`;
  }

  // Create customer
  const customerId = nanoid(16);
  const customer = await prisma.customer.create({
    data: {
      id: customerId,
      name: stripeCustomer.name,
      email: stripeCustomer.email,
      stripeCustomerId: stripeCustomer.id,
      projectConnectId: stripeAccountId,
      externalId,
      project: {
        connect: {
          stripeConnectId: stripeAccountId,
        },
      },
    },
  });

  const clickData = clickEventSchemaTB
    .omit({ timestamp: true })
    .parse(clickEvent.data[0]);

  const leadData = {
    ...clickData,
    event_id: nanoid(16),
    event_name: "New customer",
    customer_id: customer.id,
  };

  await Promise.all([
    // Record customer
    recordCustomer({
      workspace_id: customer.projectId,
      customer_id: customer.id,
      name: customer.name || "",
      email: customer.email || "",
      avatar: customer.avatar || "",
    }),

    // Record lead
    recordLead(leadData),

    // update link leads count
    prisma.link.update({
      where: {
        id: clickData.link_id,
      },
      data: {
        leads: {
          increment: 1,
        },
      },
    }),
  ]);

  waitUntil(
    (async () => {
      const workspace = await prisma.project.findUniqueOrThrow({
        where: {
          id: customer.projectId,
        },
        select: {
          id: true,
          webhookEnabled: true,
        },
      });

      dispatchWebhook("lead.created", {
        workspace,
        data: {
          ...customer,
          ...leadData,
        },
      });
    })(),
  );

  return `Customer created: ${customer.id}`;
}
