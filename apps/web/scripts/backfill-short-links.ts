import { prisma } from "@/lib/prisma";
import { linkConstructor } from "@dub/utils";
import "dotenv-flow/config";

async function main() {
  const batchSize = 1000;
  let processedCount = 0;

  while (true) {
    const links = await prisma.link.findMany({
      where: {
        shortLink: null,
      },
      select: {
        id: true,
        domain: true,
        key: true,
      },
      take: batchSize,
    });

    if (links.length === 0) {
      break;
    }

    await prisma.$transaction(
      links.map((link) =>
        prisma.link.update({
          where: { id: link.id },
          data: {
            shortLink: linkConstructor({ domain: link.domain, key: link.key }),
          },
        }),
      ),
    );

    processedCount += links.length;
    console.log(`Processed ${processedCount} links`);
  }

  console.log("Backfill complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
