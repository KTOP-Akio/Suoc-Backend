import { embedToken } from "@/lib/embed/embed-token";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const getEmbedData = async (token: string) => {
  const linkId = await embedToken.get(token);

  if (!linkId) {
    notFound();
  }

  const linkWithIncludes = await prisma.link.findUnique({
    where: {
      id: linkId,
    },
    include: {
      program: true,
      programEnrollment: true,
    },
  });

  if (!linkWithIncludes) {
    notFound();
  }

  const { program, programEnrollment, ...link } = linkWithIncludes;

  if (!program) {
    notFound();
  }

  return {
    program,
    programEnrollment,
    link,
    earnings:
      (program.commissionType === "percentage" ? link.saleAmount : link.sales) *
      (program.commissionAmount / 100),
  };
};
