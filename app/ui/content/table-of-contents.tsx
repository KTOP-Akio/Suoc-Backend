"use client";

import useCurrentAnchor from "#/lib/hooks/use-current-anchor";
import { cn } from "#/lib/utils";
import Link from "next/link";

export default function TableOfContents({
  items,
}: {
  items: {
    title: string;
    slug: string;
  }[];
}) {
  const currentAnchor = useCurrentAnchor();

  return (
    <div className="sticky top-20 col-span-1 hidden gap-4 self-start border-l-2 border-gray-200 sm:grid">
      {items.map((item, idx) => (
        <Link
          key={item.slug}
          href={`#${item.slug}`}
          className={cn("-ml-0.5 pl-4 text-sm text-gray-500", {
            "border-l-2 border-black text-black": currentAnchor
              ? currentAnchor === item.slug
              : idx === 0,
          })}
        >
          {item.title}
        </Link>
      ))}
    </div>
  );
}
