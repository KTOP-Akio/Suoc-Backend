import { Domain, Link } from "@prisma/client";

type Input = Domain & {
  links: Pick<Link, "url" | "rewrite" | "clicks" | "expiredUrl" | "noindex">[];
};

export const transformDomain = (domain: Input) => {
  const { id, slug, verified, primary, archived, placeholder } = domain;
  const { url, rewrite, clicks, expiredUrl, noindex } = domain.links[0];

  return {
    id,
    slug,
    verified,
    primary,
    archived,
    noindex,
    placeholder,
    expiredUrl,
    target: url || null,
    url: url || null, // Deprecated
    type: rewrite ? "rewrite" : "redirect",
    clicks,
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
  };
};
