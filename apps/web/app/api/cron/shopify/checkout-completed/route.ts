import { DubApiError, handleAndReturnErrorResponse } from "@/lib/api/errors";
import { notifyPartnerSale } from "@/lib/api/partners/notify-partner-sale";
import { createSaleData } from "@/lib/api/sales/sale";
import { createId } from "@/lib/api/utils";
import { verifyQstashSignature } from "@/lib/cron/verify-qstash";
import { generateRandomName } from "@/lib/names";
import {
  getClickEvent,
  getLeadEvent,
  recordLead,
  recordSale,
} from "@/lib/tinybird";
import { redis } from "@/lib/upstash";
import z from "@/lib/zod";
import { prisma } from "@dub/prisma";
import { nanoid } from "@dub/utils";
import { Customer } from "@prisma/client";

export const dynamic = "force-dynamic";

const schema = z.object({
  clickId: z.string(),
  checkoutToken: z.string(),
});

const checkoutSchema = z.object({
  total_price: z.string(),
  currency: z.string(),
  confirmation_number: z.string(),
  workspaceId: z.string(),
  customer: z.object({
    id: z.number(),
  }),
});

// POST /api/cron/shopify/checkout-completed
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await verifyQstashSignature(req, body);

    const { clickId, checkoutToken } = schema.parse(body);

    // Find click event
    const clickEvent = await getClickEvent({ clickId });

    if (!clickEvent || clickEvent.data.length === 0) {
      return new Response(
        `[Shopify] Click event not found for clickId: ${clickId}`,
      );
    }

    // Find Shopify order
    const order = await redis.get(`shopify:checkout:${checkoutToken}`);

    if (!order) {
      throw new DubApiError({
        code: "bad_request",
        message: "Shopify order not found. Waiting for order...", // This will be retried by Qstash
      });
    }

    const parsedOrder = checkoutSchema.parse(order);
    const workspaceId = parsedOrder.workspaceId;
    const customerExternalId = parsedOrder.customer.id.toString();

    console.log("parsedOrder", parsedOrder);

    // Fetch customer
    let customer: Customer | null = await prisma.customer.findUnique({
      where: {
        projectId_externalId: {
          projectId: workspaceId,
          externalId: customerExternalId,
        },
      },
    });

    const clickData = clickEvent.data[0];
    const { link_id: linkId, country, timestamp } = clickData;

    // Handle the lead
    if (!customer) {
      // TODO:
      // Fetch customer from Shopify and use their email & name

      customer = await prisma.customer.create({
        data: {
          id: createId({ prefix: "cus_" }),
          name: generateRandomName(),
          externalId: customerExternalId,
          projectId: workspaceId,
          clickedAt: new Date(timestamp + "Z"),
          clickId,
          linkId,
          country,
        },
      });

      await Promise.all([
        // record lead
        recordLead({
          ...clickData,
          event_id: nanoid(16),
          event_name: "Account created",
          customer_id: customer.id,
        }),

        // update link leads count
        prisma.link.update({
          where: {
            id: linkId,
          },
          data: {
            leads: {
              increment: 1,
            },
          },
        }),

        // update workspace usage
        prisma.project.update({
          where: {
            id: workspaceId,
          },
          data: {
            usage: {
              increment: 1,
            },
          },
        }),
      ]);
    }

    // Find lead
    const leadEvent = await getLeadEvent({ customerId: customer.id });
    if (!leadEvent || leadEvent.data.length === 0) {
      return `[Shopify] Lead event with customer ID ${customer.id} not found, skipping...`;
    }

    // Handle the sale
    const eventId = nanoid(16);
    const amount = Number(parsedOrder.total_price) * 100;
    const currency = parsedOrder.currency;
    const invoiceId = parsedOrder.confirmation_number;
    const paymentProcessor = "shopify";

    const saleData = {
      ...leadEvent.data[0],
      event_id: nanoid(16),
      event_name: "Purchase",
      payment_processor: "shopify",
      amount,
      currency,
      invoice_id: invoiceId,
      metadata: JSON.stringify(parsedOrder),
    };

    const [_sale, link, _project] = await Promise.all([
      // record sale
      recordSale(saleData),

      // update link sales count
      prisma.link.update({
        where: {
          id: linkId,
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
      prisma.project.update({
        where: {
          id: workspaceId,
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

    // for program links
    if (link.programId) {
      const { program, partner } =
        await prisma.programEnrollment.findUniqueOrThrow({
          where: {
            linkId,
          },
          select: {
            program: true,
            partner: {
              select: {
                id: true,
              },
            },
          },
        });

      const saleRecord = createSaleData({
        customerId: customer.id,
        linkId,
        clickId,
        invoiceId,
        eventId,
        paymentProcessor,
        amount,
        currency,
        partnerId: partner.id,
        program,
        metadata: clickData,
      });

      await Promise.allSettled([
        prisma.sale.create({
          data: saleRecord,
        }),

        notifyPartnerSale({
          partner: {
            id: partner.id,
            referralLink: link.shortLink,
          },
          program,
          sale: {
            amount: saleRecord.amount,
            earnings: saleRecord.earnings,
          },
        }),
      ]);
    }

    // TODO:
    // Send webhook event

    await redis.del(`shopify:checkout:${checkoutToken}`);

    return new Response("[Shopify] Order event processed successfully.");
  } catch (error) {
    return handleAndReturnErrorResponse(error);
  }
}
