import { DubApiError } from "@/lib/api/errors";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspaceEdge } from "@/lib/auth/workspace-edge";
import { prismaEdge } from "@/lib/prisma/edge";
import { getLeadEvent, recordSale } from "@/lib/tinybird";
import { sendLinkWebhookOnEdge } from "@/lib/webhook/publish-edge";
import { transformSaleEventData } from "@/lib/webhook/transform";
import { clickEventSchemaTB } from "@/lib/zod/schemas/clicks";
import { trackSaleRequestSchema } from "@/lib/zod/schemas/sales";
import { nanoid } from "@dub/utils";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";

export const runtime = "edge";

// POST /api/track/sale – Track a sale conversion event
export const POST = withWorkspaceEdge(
  async ({ req, workspace }) => {
    const {
      customerId: externalId,
      paymentProcessor,
      invoiceId,
      amount,
      currency,
      metadata,
      eventName,
    } = trackSaleRequestSchema.parse(await parseRequestBody(req));

    // Find customer
    const customer = await prismaEdge.customer.findUnique({
      where: {
        projectId_externalId: {
          projectId: workspace.id,
          externalId,
        },
      },
    });

    if (!customer) {
      throw new DubApiError({
        code: "not_found",
        message: `Customer not found for customerId: ${externalId}`,
      });
    }

    // Find lead
    const leadEvent = await getLeadEvent({ customerId: customer.id });

    if (!leadEvent || leadEvent.data.length === 0) {
      throw new DubApiError({
        code: "not_found",
        message: `Lead event not found for customerId: ${customer.id}`,
      });
    }

    const clickData = clickEventSchemaTB
      .omit({ timestamp: true })
      .parse(leadEvent.data[0]);

    const [_sale, link, _project] = await Promise.all([
      recordSale({
        ...clickData,
        event_id: nanoid(16),
        event_name: eventName,
        customer_id: customer.id,
        payment_processor: paymentProcessor,
        amount,
        currency,
        invoice_id: invoiceId || "",
        metadata: metadata ? JSON.stringify(metadata) : "",
      }),
      // update link sales count
      prismaEdge.link.update({
        where: {
          id: clickData.link_id,
        },
        data: {
          sales: {
            increment: 1,
          },
          saleAmount: {
            increment: amount,
          },
        },
      }),
      // update workspace sales usage
      prismaEdge.project.update({
        where: {
          id: workspace.id,
        },
        data: {
          usage: {
            increment: 1,
          },
          salesUsage: {
            increment: amount,
          },
        },
      }),
    ]);

    const sale = transformSaleEventData({
      ...clickData,
      link,
      eventName,
      paymentProcessor,
      invoiceId,
      amount,
      currency,
      customerId: customer.externalId,
      customerName: customer.name,
      customerEmail: customer.email,
      customerAvatar: customer.avatar,
    });

    waitUntil(
      sendLinkWebhookOnEdge({
        trigger: "sale.created",
        linkId: link.id,
        data: sale,
      }),
    );

    return NextResponse.json(sale);
  },
  {
    requiredAddOn: "conversion",
    requiredPermissions: ["conversions.write"],
  },
);
