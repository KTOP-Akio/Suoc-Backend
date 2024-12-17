import { getEvents } from "@/lib/analytics/get-events";
import { getCustomerOrThrow } from "@/lib/api/customers/get-customer-or-throw";
import { withWorkspace } from "@/lib/auth";
import { CustomerActivity } from "@/lib/types";
import { customerActivityResponseSchema } from "@/lib/zod/schemas/customers";
import { saleEventResponseSchema } from "@/lib/zod/schemas/sales";
import { NextResponse } from "next/server";
import { z } from "zod";

type SaleEvent = z.infer<typeof saleEventResponseSchema>;

// GET /api/customers/[id]/activities - get a customer's activity
export const GET = withWorkspace(async ({ workspace, params }) => {
  const { id: customerId } = params;

  const customer = await getCustomerOrThrow({
    workspaceId: workspace.id,
    id: customerId,
  });

  const events = await getEvents({
    customerId: customer.id,
    event: "sales",
    order: "desc",
    sortBy: "timestamp",
    interval: "1y",
    page: 1,
    limit: 50,
  });

  const activities: CustomerActivity[] = events.map((event: SaleEvent) => {
    return {
      timestamp: new Date(event.timestamp),
      event: "sale",
      event_name: "payment made", // event.eventName
      metadata: {
        amount: event.sale.amount,
        payment_processor: event.sale.paymentProcessor,
      },
    };
  });

  // Add lead event to activities
  activities.push({
    timestamp: customer.leadCreatedAt!,
    event: "lead",
    event_name: "Account created",
    metadata: null,
  });

  // Add click event to activities
  activities.push({
    timestamp: customer.clickedAt!,
    event: "click",
    event_name: "Link clicked",
    metadata: null,
  });

  // Find the LTV of the customer
  const ltv = activities.reduce((acc, { event, metadata }) => {
    if (event === "sale" && metadata) {
      acc += Number(metadata.amount);
    }

    return acc;
  }, 0);

  // Find the time to lead of the customer
  const timeToLead =
    customer.clickedAt && customer.leadCreatedAt
      ? customer.leadCreatedAt.getTime() - customer.clickedAt.getTime()
      : 0;

  // Find the time to first sale of the customer
  const firstSale = activities.filter(({ event }) => event === "sale").pop();

  const timeToSale =
    firstSale && customer.leadCreatedAt
      ? new Date(firstSale.timestamp).getTime() -
        customer.leadCreatedAt.getTime()
      : 0;

  return NextResponse.json(
    customerActivityResponseSchema.parse({
      ltv,
      timeToLead,
      timeToSale,
      customer,
      activities,
    }),
  );
});
