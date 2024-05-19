"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import DeleteWorkspace from "@/ui/workspaces/delete-workspace";
import UploadLogo from "@/ui/workspaces/upload-logo";
import WorkspaceId from "@/ui/workspaces/workspace-id";
import { Form } from "@dub/ui";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mutate } from "swr";
import { useSession } from "next-auth"

export default function WorkspaceSettingsClient() {
  const router = useRouter();
  const { id, name, slug, isOwner } = useWorkspace();
  const { update } = useSession()

  return (
    <>
      <Form
        title="Workspace Name"
        description={`This is the name of your workspace on ${process.env.NEXT_PUBLIC_APP_NAME}.`}
        inputAttrs={{
          name: "name",
          defaultValue: name,
          placeholder: "My Workspace",
          maxLength: 32,
        }}
        helpText="Max 32 characters."
        {...(!isOwner && {
          disabledTooltip:
            "Only workspace owners can change the workspace name.",
        })}
        handleSubmit={(updateData) =>
          fetch(`/api/workspaces/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          }).then(async (res) => {
            if (res.status === 200) {
              await Promise.all([
                mutate("/api/workspaces"),
                mutate(`/api/workspaces/${id}`),
              ]);
              toast.success("Successfully updated workspace name!");
            } else {
              const { error } = await res.json();
              toast.error(error.message);
            }
          })
        }
      />
      <Form
        title="Workspace Slug"
        description={`This is your workspace's unique slug on ${process.env.NEXT_PUBLIC_APP_NAME}.`}
        inputAttrs={{
          name: "slug",
          defaultValue: slug,
          placeholder: "my-workspace",
          pattern: "^[a-z0-9-]+$",
          maxLength: 48,
        }}
        helpText="Only lowercase letters, numbers, and dashes. Max 48 characters."
        {...(!isOwner && {
          disabledTooltip:
            "Only workspace owners can change the workspace slug.",
        })}
        handleSubmit={(data) =>
          fetch(`/api/workspaces/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }).then(async (res) => {
            if (res.status === 200) {
              const { slug: newSlug } = await res.json();
              await mutate("/api/workspaces");
              if (newSlug != slug) {
                router.push(`/${newSlug}/settings`);
                update()
              }
              toast.success("Successfully updated workspace slug!");
            } else {
              const { error } = await res.json();
              toast.error(error.message);
            }
          })
        }
      />
      <WorkspaceId />
      <UploadLogo />
      <DeleteWorkspace />
    </>
  );
}
