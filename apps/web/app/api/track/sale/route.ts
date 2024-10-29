import { DubApiError } from "@/lib/api/errors";
import { calculateCommissionEarned } from "@/lib/api/sales/commission";
import { createId, parseRequestBody } from "@/lib/api/utils";
import { withWorkspaceEdge } from "@/lib/auth/workspace-edge";
import { prismaEdge } from "@/lib/prisma/edge";
import { getLeadEvent, recordSale } from "@/lib/tinybird";
import { sendWorkspaceWebhookOnEdge } from "@/lib/webhook/publish-edge";
import { transformSaleEventData } from "@/lib/webhook/transform";
import { clickEventSchemaTB } from "@/lib/zod/schemas/clicks";
import {
  trackSaleRequestSchema,
  trackSaleResponseSchema,
} from "@/lib/zod/schemas/sales";
import { nanoid } from "@dub/utils";
import { SaleStatus } from "@prisma/client";
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
        message: `Lead event not found for customerId: ${externalId}`,
      });
    }

    const clickData = clickEventSchemaTB
      .omit({ timestamp: true })
      .parse(leadEvent.data[0]);

    const programEnrollment = await prismaEdge.programEnrollment.findFirst({
      where: {
        linkId: clickData.link_id,
      },
      include: {
        program: true,
      },
    });

    waitUntil(
      (async () => {
        const eventId = nanoid(16);

        if (programEnrollment) {
          console.log("Commission earned", calculateCommissionEarned({
            program: programEnrollment.program,
            sale: { amount },
          }));
        }

        const [_sale, link, _project] = await Promise.all([
          recordSale({
            ...clickData,
            event_id: eventId,
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

          ...(programEnrollment
            ? [
                prismaEdge.sale.create({
                  data: {
                    id: createId({ prefix: "sal_" }),
                    linkId: clickData.link_id,
                    clickId: clickData.click_id,
                    customerId: customer.id,
                    invoiceId,
                    eventId,
                    eventName,
                    paymentProcessor,
                    amount,
                    currency,
                    status: SaleStatus.pending,
                    partnerId: programEnrollment.partnerId,
                    programId: programEnrollment.program.id,
                    commissionAmount:
                      programEnrollment.program.commissionAmount,
                    commissionType: programEnrollment.program.commissionType,
                    commissionEarned: calculateCommissionEarned({
                      program: programEnrollment.program,
                      sale: { amount },
                    }),
                    recurringCommission: false,
                    isLifetimeRecurring: false,
                  },
                }),
              ]
            : []),
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

        await sendWorkspaceWebhookOnEdge({
          trigger: "sale.created",
          data: sale,
          workspace,
        });
      })(),
    );

    const sale = trackSaleResponseSchema.parse({
      eventName,
      customer: {
        id: customer.externalId,
        name: customer.name,
        email: customer.email,
        avatar: customer.avatar,
      },
      sale: {
        amount,
        currency,
        invoiceId,
        paymentProcessor,
        metadata,
      },
    });

    return NextResponse.json({
      ...sale,
      // for backwards compatibility – will remove soon
      customerId: externalId,
      amount,
      currency,
      invoiceId,
      paymentProcessor,
      metadata,
    });
  },
  {
    requiredAddOn: "conversion",
    requiredPermissions: ["conversions.write"],
  },
);
