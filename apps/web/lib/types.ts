import { DirectorySyncProviders } from "@boxyhq/saml-jackson";

import z from "@/lib/zod";
import { PlanSchema } from "prisma/zod";
import { createLinkBodySchema } from "./zod/schemas/links";
import { tagColorSchema } from "./zod/schemas/tags";

export { type Link as LinkProps } from "@prisma/client";
export interface SimpleLinkProps {
  domain: string;
  key: string;
  url: string;
}

export interface QRLinkProps {
  domain: string;
  key?: string;
  url?: string;
}

export interface RedisLinkProps {
  id: string;
  url: string;
  password?: boolean;
  proxy?: boolean;
  rewrite?: boolean;
  iframeable?: boolean;
  expiresAt?: Date;
  ios?: string;
  android?: string;
  geo?: object;
  projectId?: string;
}

export interface TagProps {
  id: string;
  name: string;
  color: TagColorProps;
}

export type TagColorProps = z.infer<typeof tagColorSchema>;

export type PlanProps = z.infer<typeof PlanSchema>;

export interface ProjectProps {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  usage: number;
  usageLimit: number;
  linksUsage: number;
  linksLimit: number;
  domainsLimit: number;
  tagsLimit: number;
  usersLimit: number;
  plan: PlanProps;
  stripeId: string | null;
  billingCycleStart: number;
  createdAt: Date;
  domains: {
    slug: string;
    primary: boolean;
  }[];
  users: {
    role: "owner" | "member";
  }[];
  metadata?: {
    defaultDomains?: string[];
  };
}

export interface ProjectWithDomainProps extends ProjectProps {
  domains: DomainProps[];
  primaryDomain?: DomainProps;
}

export interface UserProps {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  role: "owner" | "member";
  projects?: { projectId: string }[];
}

export type DomainVerificationStatusProps =
  | "Valid Configuration"
  | "Invalid Configuration"
  | "Conflicting DNS Records"
  | "Pending Verification"
  | "Domain Not Found"
  | "Unknown Error";

export interface DomainProps {
  id: string;
  slug: string;
  verified: boolean;
  primary: boolean;
  archived: boolean;
  target?: string;
  type: string;
  placeholder?: string;
  clicks: number;
  projectId: string;
}
export interface RedisDomainProps {
  id: string;
  url?: string;
  rewrite?: boolean;
  iframeable?: boolean;
  projectId: string;
}

export interface BitlyGroupProps {
  guid: string;
  bsds: string[]; // custom domains
  tags: string[];
}

export interface ImportedDomainCountProps {
  id: number;
  domain: string;
  links: number;
}

export interface SAMLProviderProps {
  name: string;
  logo: string;
  saml: "okta" | "azure" | "google";
  samlModalCopy: string;
  scim: keyof typeof DirectorySyncProviders;
  scimModalCopy: {
    url: string;
    token: string;
  };
}

export type NewLinkProps = z.infer<typeof createLinkBodySchema>;
