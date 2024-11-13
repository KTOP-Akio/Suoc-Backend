import { DOTS_API_KEY, DOTS_API_URL, DOTS_CLIENT_ID } from "./env";

type DotsRequestConfig = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  dotsAppId?: string;
  body?: any;
};

export const dotsFetch = async (
  endpoint: string,
  { method, dotsAppId, body }: DotsRequestConfig,
) => {
  const response = await fetch(`${DOTS_API_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${DOTS_CLIENT_ID}:${DOTS_API_KEY}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(dotsAppId ? { "Api-App-Id": dotsAppId } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Dots API error: ${response.status} ${response.statusText}. ${error}`,
    );
  }

  return response.json();
};
