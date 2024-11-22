import { APP_DOMAIN } from "@dub/utils";
import { useEffect } from "react";

interface DubDashboardProps {
  linkToken: string;
  onTokenExpired?: () => void;
  url?: string;
}

const iframeStyles = {
  width: "100%",
  height: "100%",
  border: "none",
  credentialssupport: "",
  allow: "same-origin",
  crossOrigin: "use-credentials",
};

export const DubDashboard = ({
  linkToken,
  onTokenExpired,
  url = `${APP_DOMAIN}/embed/dashboard`,
}: DubDashboardProps) => {
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

  // If no link token is provided
  if (!linkToken) {
    console.error("[Dub] A link token is required to embed the dashboard.");
    return null;
  }

  const dashboardUrl = `${url}?token=${linkToken}`;

  return <iframe src={dashboardUrl} style={iframeStyles} />;
};
