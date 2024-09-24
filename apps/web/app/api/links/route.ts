import { getDomainOrThrow } from "@/lib/api/domains/get-domain-or-throw";
import { DubApiError, ErrorCodes } from "@/lib/api/errors";
import { createLink, getLinksForWorkspace, processLink } from "@/lib/api/links";
import { throwIfLinksUsageExceeded } from "@/lib/api/links/usage-checks";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { getFolderWithUserOrThrow } from "@/lib/link-folder/get-folder";
import { throwIfNotAllowed } from "@/lib/link-folder/permissions";
import { ratelimit } from "@/lib/upstash";
import { sendWorkspaceWebhook } from "@/lib/webhook/publish";
import {
  createLinkBodySchema,
  getLinksQuerySchemaExtended,
  linkEventSchema,
} from "@/lib/zod/schemas/links";
import { LOCALHOST_IP, getSearchParamsWithArray } from "@dub/utils";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";

// GET /api/links – get all links for a workspace
export const GET = withWorkspace(
  async ({ req, headers, workspace, session }) => {
    const searchParams = getSearchParamsWithArray(req.url);

    const {
      domain,
      tagId,
      tagIds,
      folderId,
      search,
      sort,
      page,
      pageSize,
      userId,
      showArchived,
      withTags,
      includeUser,
    } = getLinksQuerySchemaExtended.parse(searchParams);

    if (domain) {
      await getDomainOrThrow({ workspace, domain });
    }

    if (folderId) {
      const { folder, folderUser } = await getFolderWithUserOrThrow({
        folderId,
        workspaceId: workspace.id,
        userId: session.user.id,
      });

      throwIfNotAllowed({
        folder,
        folderUser,
        requiredPermission: "folders.links.read",
      });
    }

    // TODO: @LinkFolder
    // Filter out the links that the user does not have access to based on the folders

    const response = await getLinksForWorkspace({
      workspaceId: workspace.id,
      domain,
      tagId,
      tagIds,
      folderId,
      search,
      sort,
      page,
      pageSize,
      userId,
      showArchived,
      withTags,
      includeUser,
    });

    return NextResponse.json(response, {
      headers,
    });
  },
  {
    requiredPermissions: ["links.read"],
  },
);

// POST /api/links – create a new link
export const POST = withWorkspace(
  async ({ req, headers, session, workspace }) => {
    if (workspace) {
      throwIfLinksUsageExceeded(workspace);
    }

    const body = createLinkBodySchema.parse(await parseRequestBody(req));

    if (!session) {
      const ip = req.headers.get("x-forwarded-for") || LOCALHOST_IP;
      const { success } = await ratelimit(10, "1 d").limit(ip);

      if (!success) {
        throw new DubApiError({
          code: "rate_limit_exceeded",
          message:
            "Rate limited – you can only create up to 10 links per day without an account.",
        });
      }
    }

    // Check if the user has edit access to the folder
    if (body.folderId) {
      const { folder, folderUser } = await getFolderWithUserOrThrow({
        folderId: body.folderId,
        workspaceId: workspace.id,
        userId: session.user.id,
      });

      throwIfNotAllowed({
        folder,
        folderUser,
        requiredPermission: "folders.links.write",
      });
    }

    const { link, error, code } = await processLink({
      payload: body,
      workspace,
      ...(session && { userId: session.user.id }),
    });

    if (error != null) {
      throw new DubApiError({
        code: code as ErrorCodes,
        message: error,
      });
    }

    try {
      const response = await createLink(link);

      if (response.projectId && response.userId) {
        waitUntil(
          sendWorkspaceWebhook({
            trigger: "link.created",
            workspace,
            data: linkEventSchema.parse(response),
          }),
        );
      }

      return NextResponse.json(response, { headers });
    } catch (error) {
      if (error.code === "P2002") {
        throw new DubApiError({
          code: "conflict",
          message: "A link with this externalId already exists.",
        });
      }

      throw new DubApiError({
        code: "unprocessable_entity",
        message: error.message,
      });
    }
  },
  {
    requiredPermissions: ["links.write"],
  },
);
