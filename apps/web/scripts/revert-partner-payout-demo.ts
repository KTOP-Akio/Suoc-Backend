import { prisma } from "@/lib/prisma";
import "dotenv-flow/config";

const payoutId = "po_z50ZzjiXigYwDGPEqhNATiJ2";

async function main() {
  const res = await Promise.all([
    prisma.payout.update({
      where: {
        id: payoutId,
      },
      data: {
        status: "pending",
        dotsTransferId: null,
      },
    }),
    prisma.sale.updateMany({
      where: {
        payoutId,
      },
      data: {
        status: "pending",
      },
    }),
  ]);

  console.log(res);
}

main();
