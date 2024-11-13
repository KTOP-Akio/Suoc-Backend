import { prisma } from "@/lib/prisma";
import {
  programLanderBlockSchema,
  programLanderSchema,
} from "@/lib/zod/schemas/programs";
import { AccordionBlock } from "@/ui/partners/lander-blocks/AccordionBlock";
import { FilesBlock } from "@/ui/partners/lander-blocks/FilesBlock";
import { ImageBlock } from "@/ui/partners/lander-blocks/ImageBlock";
import { TextBlock } from "@/ui/partners/lander-blocks/TextBlock";
import { Button, Calendar6, MoneyBills2 } from "@dub/ui";
import { currencyFormatter } from "@dub/utils";
import { notFound } from "next/navigation";
import { CSSProperties } from "react";
import { z } from "zod";
import { Header } from "./header";

const BLOCK_COMPONENTS: Record<
  z.infer<typeof programLanderBlockSchema>["type"],
  any
> = {
  image: ImageBlock,
  text: TextBlock,
  files: FilesBlock,
  accordion: AccordionBlock,
};

export default async function ApplyPage({
  params,
}: {
  params: { programSlug: string };
}) {
  const { programSlug } = params;
  const program = await prisma.program.findUnique({
    select: {
      lander: true,
      name: true,
      logo: true,
      wordmark: true,
      brandColor: true,
      commissionType: true,
      commissionAmount: true,
      isLifetimeRecurring: true,
    },
    where: {
      slug: programSlug,
    },
  });

  if (!program || !program.lander) notFound();

  const lander = programLanderSchema.parse(program.lander);
  if (!lander) notFound();

  return (
    <div
      className="relative"
      style={
        {
          "--brand": program.brandColor || "#3b82f6",
          "--brand-ring": "rgb(from var(--brand) r g b / 0.4)",
        } as CSSProperties
      }
    >
      <Header program={{ logo: program.logo, wordmark: program.wordmark }} />
      <div className="p-6">
        {/* Hero section */}
        <div className="grid grid-cols-1 gap-5 sm:pt-20">
          <p className="font-mono text-xs font-medium uppercase text-[var(--brand)]">
            Affiliate Program
          </p>
          <h1 className="text-4xl font-semibold">
            Join the {program.name} affiliate program
          </h1>
          <p className="text-base text-neutral-700">
            Share {program.name} with your audience and for each subscription
            generated through your referral, you'll earn a share of the revenue
            on any plans they purchase.
          </p>
          {/* <p className="text-xs text-neutral-500">
              Read our{" "}
              <a
                href="#"
                className="underline transition-colors duration-100 hover:text-neutral-600"
              >
                Terms of Service
              </a>{" "}
              for more details.
            </p> */}
        </div>

        {/* Program details grid */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              icon: MoneyBills2,
              title: "Commission",
              value:
                program.commissionType === "percentage"
                  ? `${program.commissionAmount}%`
                  : currencyFormatter(program.commissionAmount / 100, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
            },
            {
              icon: Calendar6,
              title: "Duration",
              value: program.isLifetimeRecurring ? "Lifetime" : "Recurring",
            },
          ].map(({ icon: Icon, title, value }) => (
            <div className="rounded-xl bg-neutral-100 p-4">
              <Icon className="size-5 text-gray-500" />
              <div className="mt-6">
                <p className="font-mono text-xl text-neutral-900">{value}</p>
                <p className="mt-0.5 text-sm text-gray-500">{title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-col gap-2">
          <Button
            type="button"
            text="Apply today"
            className="border-[var(--brand)] bg-[var(--brand)] hover:bg-[var(--brand)] hover:ring-[var(--brand-ring)]"
          />
          {/* <Button type="button" variant="secondary" text="Learn more" /> */}
        </div>

        {/* Content blocks */}
        <div className="mt-16 grid grid-cols-1 gap-10">
          {lander.blocks.map((block, idx) => {
            const Component = BLOCK_COMPONENTS[block.type];
            return Component ? (
              <Component key={idx} block={block} logo={program.logo} />
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}
