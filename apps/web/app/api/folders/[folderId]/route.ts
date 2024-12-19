import { DubApiError } from "@/lib/api/errors";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import { checkFolderPermission } from "@/lib/folder/permissions";
import { recordLink } from "@/lib/tinybird";
import { FolderSchema, updateFolderSchema } from "@/lib/zod/schemas/folders";
import { prisma } from "@dub/prisma";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";

// GET /api/folders/[folderId] - get information about a folder
export const GET = withWorkspace(
  async ({ params, workspace, session }) => {
    const { folderId } = params;

    const folder = await checkFolderPermission({
      folderId,
      workspaceId: workspace.id,
      userId: session.user.id,
      requiredPermission: "folders.read",
    });

    return NextResponse.json(FolderSchema.parse(folder));
  },
  {
    requiredPermissions: ["folders.read"],
  },
);

// PATCH /api/folders/[folderId] – update a folder for a workspace
export const PATCH = withWorkspace(
  async ({ req, params, workspace, session }) => {
    const { folderId } = params;

    const { name, accessLevel } = updateFolderSchema.parse(
      await parseRequestBody(req),
    );

    await checkFolderPermission({
      folderId,
      workspaceId: workspace.id,
      userId: session.user.id,
      requiredPermission: "folders.write",
    });

    try {
      const updatedFolder = await prisma.folder.update({
        where: {
          id: folderId,
          projectId: workspace.id,
        },
        data: {
          name,
          accessLevel,
        },
      });

      return NextResponse.json(FolderSchema.parse(updatedFolder));
    } catch (error) {
      if (error.code === "P2002") {
        throw new DubApiError({
          code: "conflict",
          message: `A folder with the name "${name}" already exists.`,
        });
      }

      throw error;
    }
  },
  {
    requiredPermissions: ["folders.write"],
  },
);

// DELETE /api/folders/[folderId] – delete a folder for a workspace
export const DELETE = withWorkspace(
  async ({ params, workspace, session }) => {
    const { folderId } = params;

    await checkFolderPermission({
      folderId,
      workspaceId: workspace.id,
      userId: session.user.id,
      requiredPermission: "folders.write",
    });

    const deletedFolder = await prisma.folder.delete({
      where: {
        id: folderId,
        projectId: workspace.id,
      },
      include: {
        links: {
          select: {
            id: true,
            domain: true,
            key: true,
            url: true,
            createdAt: true,
            tags: {
              select: {
                tagId: true,
              },
            },
          },
        },
      },
    });

    waitUntil(
      (async () => {
        if (deletedFolder.links.length > 0) {
          recordLink(
            deletedFolder.links.map((link) => ({
              link_id: link.id,
              domain: link.domain,
              key: link.key,
              url: link.url,
              tag_ids: link.tags.map((tag) => tag.tagId),
              folder_id: null,
              workspace_id: workspace.id,
              created_at: link.createdAt,
            })),
          );
        }
      })(),
    );

    return NextResponse.json({ id: folderId });
  },
  {
    requiredPermissions: ["folders.write"],
  },
);
