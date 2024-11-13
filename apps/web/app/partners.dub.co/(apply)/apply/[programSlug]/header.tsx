"use client";

import { Button, useScroll, Wordmark } from "@dub/ui";
import { cn } from "@dub/utils";
import { Program } from "@prisma/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Header({
  program,
  slug,
  showLogin = true,
  showApply = true,
}: {
  program: Pick<Program, "wordmark" | "logo">;
  slug: string;
  showLogin?: boolean;
  showApply?: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();

  const scrolled = useScroll(0);

  return (
    <header
      className={
        "sticky top-0 mx-px flex items-center justify-between bg-white/90 px-6 py-4 backdrop-blur-sm"
      }
    >
      {/* Bottom border when scrolled */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 h-px bg-neutral-200 opacity-0 transition-opacity duration-300 [mask-image:linear-gradient(90deg,transparent,black,transparent)]",
          scrolled && "opacity-100",
        )}
      />

      <Link href={`/apply/${slug}`}>
        {program.wordmark || program.logo ? (
          <img
            className="h-7 max-w-32"
            src={(program.wordmark ?? program.logo) as string}
          />
        ) : (
          <Wordmark className="h-7" />
        )}
      </Link>

      <div className="flex items-center gap-2">
        {showLogin && !session?.user && (
          <Button
            type="button"
            variant="outline"
            text="Log in"
            className="text-neutral-600"
            onClick={() => router.push(`/login?next=/apply/${slug}`)}
          />
        )}
        {showApply && (
          <Button
            type="button"
            text="Apply"
            className="h-8 w-fit border-[var(--brand)] bg-[var(--brand)] hover:bg-[var(--brand)] hover:ring-[var(--brand-ring)]"
            onClick={() => router.push(`/apply/${slug}/application`)}
          />
        )}
      </div>
    </header>
  );
}
