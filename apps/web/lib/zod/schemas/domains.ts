import z from "@/lib/zod";
import { getUrlFromString } from "@dub/utils";
import { parseUrlSchema } from "./utils";

export const DomainSchema = z.object({
  id: z.string().describe("The unique identifier of the domain."),
  slug: z
    .string()
    .describe("The domain name.")
    .openapi({ example: "acme.com" }),
  verified: z
    .boolean()
    .default(false)
    .describe("Whether the domain is verified."),
  primary: z
    .boolean()
    .default(false)
    .describe("Whether the domain is the primary domain for the workspace."),
  archived: z
    .boolean()
    .describe("Whether the domain is archived.")
    .default(false),
  placeholder: z
    .string()
    .transform((v) => getUrlFromString(v))
    .describe(
      "Provide context to your teammates in the link creation modal by showing them an example of a link to be shortened.",
    )
    .default("https://dub.co/help/article/what-is-dub")
    .openapi({ example: "https://dub.co/help/article/what-is-dub" }),
  expiredUrl: z
    .string()
    .transform((v) => getUrlFromString(v))
    .nullish()
    .describe(
      "The URL to redirect to when a link under this domain has expired.",
    )
    .openapi({ example: "https://acme.com/expired" }),
  createdAt: z.date().describe("The date the domain was created."),
  updatedAt: z.date().describe("The date the domain was last updated."),
});

export const createDomainBodySchema = z.object({
  slug: z
    .string({ required_error: "slug is required" })
    .min(1, "slug cannot be empty.")
    .describe("Name of the domain.")
    .openapi({ example: "acme.com" }),
  expiredUrl: parseUrlSchema
    .nullish()
    .describe(
      "Redirect users to a specific URL when any link under this domain has expired.",
    )
    .openapi({ example: "https://acme.com/expired" }),
  archived: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Whether to archive this domain. `false` will unarchive a previously archived domain.",
    )
    .openapi({ example: false }),
  placeholder: parseUrlSchema
    .nullish()
    .default("https://dub.co/help/article/what-is-dub")
    .describe(
      "Provide context to your teammates in the link creation modal by showing them an example of a link to be shortened.",
    )
    .openapi({ example: "https://dub.co/help/article/what-is-dub" }),
});

export const updateDomainBodySchema = createDomainBodySchema.partial();

export const transferDomainBodySchema = z.object({
  newWorkspaceId: z
    .string({ required_error: "New workspace ID is required." })
    .min(1, "New workspace ID cannot be empty.")
    .transform((v) => v.replace("ws_", ""))
    .describe("The ID of the new workspace to transfer the domain to."),
});
