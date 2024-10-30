import { prisma } from "@/lib/prisma";
import "dotenv-flow/config";

async function main() {
  const userId = "cm1ypncqa0000tc44pfgxp6qs";
  const programId = "cm2ugxodx00015eqrtlgczd6m";
  const linkId = "cm2q86tm4000hgopgg0b54jfi";

  // Create a partner account
  const partner = await prisma.partner.create({
    data: {
      name: "Kiran (Partner)",
      status: "approved",
    },
  });

  // Enrol them in a program
  await prisma.programEnrollment.create({
    data: {
      partnerId: partner.id,
      programId,
      linkId,
    },
  });

  // Add some dummy payouts
  await prisma.payout.createMany({
    data: [
      {
        programId,
        partnerId: partner.id,
        subtotal: 1000,
        taxes: 0,
        total: 1000,
        payoutFee: 0,
        netTotal: 1000,
        due: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
      {
        programId,
        partnerId: partner.id,
        subtotal: 2000,
        taxes: 0,
        total: 2000,
        payoutFee: 0,
        netTotal: 2000,
        due: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
      {
        programId,
        partnerId: partner.id,
        subtotal: 3000,
        taxes: 0,
        total: 3000,
        payoutFee: 0,
        netTotal: 3000,
        due: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    ],
  });
}

main();
