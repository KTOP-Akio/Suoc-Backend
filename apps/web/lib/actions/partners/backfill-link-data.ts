import { getEvents } from "@/lib/analytics/get-events";
import { createSaleData } from "@/lib/api/sales/sale";
import { SaleEvent } from "@/lib/types";
import { prisma } from "@dub/prisma";

export const backfillLinkData = async (programEnrollmentId: string) => {
  const programEnrollment = await prisma.programEnrollment.findUniqueOrThrow({
    where: {
      id: programEnrollmentId,
    },
    include: {
      program: {
        include: {
          workspace: true,
        },
      },
      link: true,
      partner: true,
    },
  });

  const { program, link, partner } = programEnrollment;
  const workspace = program.workspace;

  if (!link) {
    console.warn(
      `No link found for program enrollment ${programEnrollment.id}`,
    );
    return;
  }

  const alreadyBackfilled = await prisma.sale.count({
    where: {
      linkId: link.id,
    },
  });

  if (alreadyBackfilled > 0) {
    return;
  }

  const saleEvents = await getEvents({
    workspaceId: workspace.id,
    linkId: link.id,
    event: "sales",
    interval: "all",
    page: 1,
    limit: 5000,
    order: "desc",
    sortBy: "timestamp",
  });

  const data = saleEvents.map((e: SaleEvent) => ({
    ...createSaleData({
      customerId: e.customer.id,
      linkId: e.link.id,
      clickId: e.click.id,
      invoiceId: e.invoice_id,
      eventId: e.eventId,
      paymentProcessor: e.payment_processor,
      amount: e.sale.amount,
      currency: "usd",
      partnerId: partner.id,
      program,
      metadata: e.click,
    }),
    createdAt: new Date(e.timestamp),
  }));

  if (data.length > 0) {
    await prisma.sale.createMany({
      data,
      skipDuplicates: true,
    });
  }
};
