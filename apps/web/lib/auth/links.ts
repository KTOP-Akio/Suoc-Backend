import { authOptions } from "./options";
import { NextApiRequest, NextApiResponse } from "next";
import { API_DOMAIN } from "@dub/utils";
import { ratelimit } from "../upstash";
import { Session, hashToken } from ".";
import { Link as LinkProps } from "@prisma/client";
import { PlanProps, ProjectProps } from "../types";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

interface WithLinksAuthNextApiHandler {
  (
    req: NextApiRequest,
    res: NextApiResponse,
    session: Session,
    project?: ProjectProps,
    domain?: string,
    link?: LinkProps,
  ): any;
}

/* 
      This is the auth handler for all link-related actions.
    
      In the future, we might want to combine this with other endpoints as well (e.g. /projects, /domains, etc.)
      
      Here's an outline of the flow:
      1. Check if user is logged in, if not, return 401 right away.
      2. Check if there's a `slug` in the query params:
        a. If there is no slug, it means that it's the generic dub.sh links
          i. Make sure the domain is `dub.sh` (prevent query injection)
          ii. If link `key` is provided, make sure user is the owner of the link
        b. If there is a slug, it means that it's a custom project
          i. Make sure the project exists
          ii. Make sure the user is part of the project
          iii. Make sure the project is within its usage limits
          iv. Make sure the action is allowed for the project's plan
          v. Make sure the domain is part of the project (prevent query injection)
    */

const withLinksAuth =
  (
    handler: WithLinksAuthNextApiHandler,
    {
      needNotExceededUsage, // if the action needs the user to not have exceeded their usage
      excludeGet, // if the action doesn't need to be gated for GET requests
      requiredPlan = ["free", "pro", "enterprise"], // if the action needs a specific plan
      skipKeyCheck, // if the action doesn't need to check if the user is the owner of the link (/exists endpoint)
    }: {
      needNotExceededUsage?: boolean;
      excludeGet?: boolean;
      requiredPlan?: Array<PlanProps>;
      skipKeyCheck?: boolean;
    } = {},
  ) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const { slug, domain, key } = req.query as {
      slug?: string; // project slug (query param)
      domain?: string; // link domain (query param)
      key?: string; // link key (path param)
    };

    // if slug is misconfgured
    if (slug && typeof slug !== "string") {
      return res.status(400).end("Missing or misconfigured project slug.");
    }

    let session: Session | undefined;

    const authorizationHeader = req.headers.authorization;
    if (authorizationHeader) {
      if (!authorizationHeader.includes("Bearer ")) {
        return res
          .status(400)
          .end(
            "Misconfigured authorization header. Did you forget to add 'Bearer '? Learn more: https://dub.sh/auth ",
          );
      }
      const apiKey = authorizationHeader.replace("Bearer ", "");
      // if there is no slug, it's the default dub.sh link
      if (!slug) {
        return res
          .status(403)
          .end("Unauthorized: API is not supported for dub.sh links yet.");
      }

      const url = new URL(req.url || "", API_DOMAIN);

      if (url.pathname.includes("/stats/")) {
        return res.status(403).end("Unauthorized: Invalid route.");
      }

      const hashedKey = hashToken(apiKey, {
        noSecret: true,
      });

      const user = await prisma.user.findFirst({
        where: {
          tokens: {
            some: {
              hashedKey,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
      if (!user) {
        return res.status(401).end("Unauthorized: Invalid API key.");
      }

      const { success, limit, reset, remaining } = await ratelimit(
        10,
        "1 s",
      ).limit(apiKey);
      res.setHeader("X-RateLimit-Limit", limit.toString());
      res.setHeader("X-RateLimit-Remaining", remaining.toString());
      res.setHeader("X-RateLimit-Reset", reset.toString());
      res.setHeader("Retry-After", reset.toString());

      if (!success) {
        return res.status(429).end("Too many requests.");
      }
      await prisma.token.update({
        where: {
          hashedKey,
        },
        data: {
          lastUsed: new Date(),
        },
      });
      session = {
        user: {
          id: user.id,
          name: user.name || "",
          email: user.email || "",
        },
      };
    } else {
      session = (await getServerSession(req, res, authOptions)) as Session;
      if (!session?.user.id) {
        return res.status(401).end("Unauthorized: Login required.");
      }
    }

    let project: ProjectProps | undefined;
    let link: LinkProps | undefined;

    // if there is no slug, it's the default dub.sh link
    if (!slug) {
      // prevent domain from being query injected by
      // making sure that all instances of `domain` are `dub.sh`
      if (
        (domain && domain !== "dub.sh") ||
        (req.body.domain && req.body.domain !== "dub.sh")
      ) {
        return res.status(403).end("Unauthorized: Invalid domain.");
      }

      // if project slug is defined, that means it's a custom project on Dub
    } else {
      project = (await prisma.project.findUnique({
        where: {
          slug,
        },
        include: {
          domains: {
            select: {
              slug: true,
            },
          },
          users: {
            where: {
              userId: session.user.id,
            },
            select: {
              role: true,
            },
          },
        },
      })) as ProjectProps;

      // if project doesn't exist
      if (!project) {
        return res.status(404).end("Project not found.");

        // if project exists but user is not part of it
      } else if (project.users && project.users.length === 0) {
        // TODO: check if user has pending invite
        return res.status(401).end("Unauthorized: Not part of project.");

        // project exists and user is part of it
      } else {
        // if the action requires the project to be within usage limits,
        // and the action is not a GET request with excludeGet set to true,
        // check if the project is within usage limits
        if (
          needNotExceededUsage &&
          !(req.method === "GET" && excludeGet) &&
          project.usage > project.usageLimit
        ) {
          return res.status(403).end("Unauthorized: Usage limits exceeded.");
        }

        if (requiredPlan && !requiredPlan.includes(project.plan)) {
          return res.status(403).end("Unauthorized: Need higher plan.");
        }

        // prevent unauthorized access to domains
        if (
          (domain && !project.domains?.find((d) => d.slug === domain)) ||
          (req.body.domain &&
            !project.domains?.find((d) => d.slug === req.body.domain))
        ) {
          return res.status(403).end("Unauthorized: Invalid domain.");
        }
      }
    }

    if (key) {
      if (typeof key !== "string") {
        return res.status(400).end("Missing or misconfigured link key.");
      }
      link =
        (await prisma.link.findUnique({
          where: {
            domain_key: {
              domain: domain || "dub.sh",
              key,
            },
          },
        })) || undefined;

      if (!link) {
        return res.status(404).end("Link not found.");

        // for dub.sh links, check if the user is the owner of the link
      } else if (!slug && link.userId !== session.user.id && !skipKeyCheck) {
        return res.status(404).end("Link not found.");
      }
    }

    return handler(req, res, session, project, domain, link);
  };

export { withLinksAuth };
