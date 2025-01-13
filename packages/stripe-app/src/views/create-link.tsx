import {
  Box,
  Button,
  FormFieldGroup,
  Link,
  TextField,
} from "@stripe/ui-extension-sdk/ui";
import { showToast } from "@stripe/ui-extension-sdk/utils";
import { useState } from "react";
import { createLink } from "../utils/create-link";
import { Workspace } from "../utils/types";

export const CreateLink = ({ workspace }: { workspace: Workspace | null }) => {
  const [url, setUrl] = useState("");
  const [shortLink, setShortLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateLink = async () => {
    setIsSubmitting(true);

    try {
      const link = await createLink({
        url,
        isPublic: !workspace,
      });

      showToast("Link created", { type: "success" }); // TODO: This is not working
      setShortLink(link.shortLink);
      setUrl("");
    } catch (error: any) {
      console.error(error);
      showToast(error.message, { type: "caution" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      css={{
        padding: "large",
        keyline: "neutral",
        borderRadius: "small",
        stack: "y",
        gap: "large",
      }}
    >
      <FormFieldGroup
        legend="Destination URL"
        description="Enter a long URL to shorten"
      >
        <TextField
          label="Destination URL"
          placeholder="https://dub.co/help/article/what-is-dub"
          hiddenElements={["label"]}
          onChange={(e) => setUrl(e.target.value)}
          value={url}
        />
        <Button
          type="primary"
          onPress={handleCreateLink}
          disabled={isSubmitting || !url}
        >
          {isSubmitting ? "Shortening..." : "Shorten link"}
        </Button>
      </FormFieldGroup>
      {shortLink && (
        <Link href={shortLink} target="_blank">
          {shortLink}
        </Link>
      )}
      <Box
        css={{
          borderTopColor: "neutral",
        }}
      >
        Want to claim your links and track conversions for them? Connect your
        Dub workspace.
      </Box>
    </Box>
  );
};
