import { getEvents } from "@/lib/analytics/get-events";
import { getCustomerOrThrow } from "@/lib/api/customers/get-customer-or-throw";
import { withWorkspace } from "@/lib/auth";
import { CustomerActivity, SaleEvent } from "@/lib/types";
import { customerActivityResponseSchema } from "@/lib/zod/schemas/customers";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// GET /api/customers/[id]/activity - get a customer's activity
export const GET = withWorkspace(async ({ workspace, params }) => {
  const { id: customerId } = params;

  const customer = await getCustomerOrThrow({
    workspaceId: workspace.id,
    id: customerId,
  });

  const [events, link] = await Promise.all([
    getEvents({
      customerId: customer.id,
      event: "sales",
      order: "desc",
      sortBy: "timestamp",
      interval: "1y",
      page: 1,
      limit: 50,
    }),

    prisma.link.findUnique({
      where: {
        id: customer.linkId!,
      },
      select: {
        id: true,
        domain: true,
        key: true,
        shortLink: true,
      },
    }),
  ]);

  const activity: CustomerActivity[] = events.map((event: SaleEvent) => {
    return {
      timestamp: new Date(event.timestamp),
      event: "sale",
      event_name: event.eventName,
      metadata: {
        amount: event.sale.amount,
        payment_processor: event.sale.paymentProcessor,
      },
    };
  });

  // Add lead event to activities
  activity.push({
    timestamp: customer.createdAt,
    event: "lead",
    event_name: "Account created",
    metadata: null,
  });

  // Add click event to activities
  activity.push({
    timestamp: customer.clickedAt!,
    event: "click",
    event_name: "Link click",
    metadata: null,
  });

  // Find the LTV of the customer
  const ltv = activity.reduce((acc, { event, metadata }) => {
    if (event === "sale" && metadata) {
      acc += Number(metadata.amount);
    }

    return acc;
  }, 0);

  // Find the time to lead of the customer
  const timeToLead =
    customer.clickedAt && customer.createdAt
      ? customer.createdAt.getTime() - customer.clickedAt.getTime()
      : null;

  // Find the time to first sale of the customer
  const firstSale = activity.filter(({ event }) => event === "sale").pop();

  const timeToSale =
    firstSale && customer.createdAt
      ? new Date(firstSale.timestamp).getTime() - customer.createdAt.getTime()
      : null;

  return NextResponse.json(
    customerActivityResponseSchema.parse({
      ltv,
      timeToLead,
      timeToSale,
      customer,
      activity,
      link,
    }),
  );
});
