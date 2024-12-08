import { prisma } from "@dub/prisma";
import { DubApiError } from "../errors";

export async function getProgramEnrollmentOrThrow({
  partnerId,
  programId,
}: {
  partnerId: string;
  programId: string;
}) {
  const programEnrollment = programId.startsWith("prog_")
    ? await prisma.programEnrollment.findUnique({
        where: {
          partnerId_programId: {
            partnerId,
            programId,
          },
        },
        include: {
          program: true,
          link: true,
        },
      })
    : await prisma.programEnrollment.findFirst({
        where: {
          partnerId,
          program: {
            slug: programId,
          },
        },
        include: {
          program: true,
          link: true,
        },
      });

  if (!programEnrollment || !programEnrollment.program) {
    throw new DubApiError({
      code: "not_found",
      message:
        "You are not enrolled in this program. Contact your program admin to get enrolled.",
    });
  }

  const { link } = programEnrollment;

  if (!link) {
    throw new DubApiError({
      code: "not_found",
      message:
        "You don't have a link for this program yet. Contact your program admin to get one.",
    });
  }

  return {
    ...programEnrollment,
    link,
  };
}
