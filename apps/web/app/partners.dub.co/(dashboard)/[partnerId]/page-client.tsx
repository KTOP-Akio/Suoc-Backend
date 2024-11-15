"use client";

import { ProgramInviteProps, ProgramProps } from "@/lib/types";
import { ProgramCard, ProgramCardSkeleton } from "@/ui/partners/program-card";
import { ProgramInviteCard } from "@/ui/partners/program-invite-card";
import { AnimatedEmptyState } from "@/ui/shared/animated-empty-state";
import { MaxWidthWrapper } from "@dub/ui";
import { CircleDollar, GridIcon } from "@dub/ui/src/icons";
import { fetcher } from "@dub/utils";
import { useParams } from "next/navigation";
import useSWR from "swr";

export function PartnersDashboardPageClient() {
  const { partnerId } = useParams() as {
    partnerId?: string;
  };

  const { data: programs, error } = useSWR<ProgramProps[]>(
    `/api/partners/${partnerId}/programs`,
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  const { data: invites } = useSWR<ProgramInviteProps[]>(
    `/api/partners/${partnerId}/programs/invites`,
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  return (
    <MaxWidthWrapper>
      {invites && invites.length > 0 && (
        <div className="mb-8 grid gap-4">
          {invites.map((invite) => (
            <ProgramInviteCard key={invite.id} invite={invite} />
          ))}
        </div>
      )}
      {programs === undefined ? (
        error ? (
          <div className="mt-8 text-center text-sm text-neutral-500">
            Failed to load programs
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <ProgramCardSkeleton key={idx} />
            ))}
          </div>
        )
      ) : programs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      ) : (
        <AnimatedEmptyState
          title="No programs found"
          description="Enroll in programs to start earning."
          cardContent={
            <>
              <GridIcon className="size-4 text-neutral-700" />
              <div className="h-2.5 w-24 min-w-0 rounded-sm bg-neutral-200" />
              <div className="xs:flex hidden grow items-center justify-end gap-1.5 text-gray-500">
                <CircleDollar className="size-3.5" />
              </div>
            </>
          }
          learnMoreHref="https://dub.co/help/article/dub-conversions"
        />
      )}
    </MaxWidthWrapper>
  );
}
