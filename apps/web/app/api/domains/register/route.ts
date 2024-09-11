import { DubApiError } from "@/lib/api/errors";
import { createLink } from "@/lib/api/links";
import { withWorkspace } from "@/lib/auth";
import { configureDNS } from "@/lib/dynadot/configure-dns";
import { registerDomain } from "@/lib/dynadot/register-domain";
import { prisma } from "@/lib/prisma";
import z from "@/lib/zod";
import { DEFAULT_LINK_PROPS } from "@dub/utils";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";

const schema = z.object({
  domain: z
    .string()
    .min(1)
    .endsWith(".link")
    .transform((domain) => domain.toLowerCase())
    .describe("We only support .link domains for now."),
});

// GET /api/domains/register - register a domain
export const POST = withWorkspace(
  async ({ searchParams, workspace, session }) => {
    if (workspace.plan === "free")
      throw new DubApiError({
        code: "forbidden",
        message: "Free workspaces cannot register .link domains.",
      });

    const { domain } = schema.parse(searchParams);

    const existingRegisteredDotLinkDomain =
      await prisma.registeredDomain.findFirst({
        where: {
          projectId: workspace.id,
          slug: {
            endsWith: ".link",
          },
        },
      });

    if (existingRegisteredDotLinkDomain)
      throw new DubApiError({
        code: "forbidden",
        message: "Workspace is limited to one free .link domain.",
      });

    const response = await registerDomain({ domain });
    const slug = response.RegisterResponse.DomainName;

    const totalDomains = await prisma.domain.count({
      where: {
        projectId: workspace.id,
      },
    });

    // Delete any matching unverified domain
    await prisma.domain.delete({
      where: {
        slug,
        verified: false,
      },
    });

    await Promise.all([
      // Create the workspace domain
      prisma.domain.create({
        data: {
          projectId: workspace.id,
          slug,
          verified: true,
          lastChecked: new Date(),
          primary: totalDomains === 0,
          registeredDomain: {
            create: {
              slug,
              expiresAt: new Date(response.RegisterResponse.Expiration || ""),
              projectId: workspace.id,
            },
          },
        },
      }),
      // Create the root link
      createLink({
        ...DEFAULT_LINK_PROPS,
        domain: slug,
        key: "_root",
        url: "",
        tags: undefined,
        userId: session.user.id,
        projectId: workspace.id,
      }),
    ]);

    // Configure the DNS in the background
    waitUntil(configureDNS({ domain: slug }));

    return NextResponse.json(response);
  },
  {
    requiredPermissions: ["domains.write"],
  },
);
