"use client";

import { APP_DOMAIN } from "@dub/utils";
import { useEffect } from "react";
import { destroy, init } from "./embed-core";
import { DubEmbedOptions, Options } from "./types";

export const DubWidget = ({
  token,
  onTokenExpired,
  ...options
}: DubEmbedOptions & Partial<Options>) => {
  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== APP_DOMAIN) {
        return;
      }

      if (event.data === "TOKEN_EXPIRED") {
        console.error("[Dub] Link token is expired.");
        onTokenExpired?.();
      }
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, [onTokenExpired]);

  useEffect(() => {
    init({ token, ...options });

    return () => destroy();
  }, []);

  // If no link token is provided
  if (!token) {
    console.error("[Dub] A link token is required to embed the dashboard.");
    return null;
  }

  return null;
};
