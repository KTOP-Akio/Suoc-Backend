import type { NextRequest } from "next/server";
import { getStats } from "@/lib/stats";
import { getLinkViaEdge } from "@/lib/planetscale";
import { isHomeHostname } from "@/lib/utils";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  if (req.method === "GET") {
    const key = req.nextUrl.searchParams.get("key");
    const interval = req.nextUrl.searchParams.get("interval") || "24h";
    const endpoint = req.nextUrl.searchParams.get("endpoint");
    let domain = req.headers.get("host");
    if (isHomeHostname(domain)) domain = "dub.sh";

    const data = await getLinkViaEdge(domain, key);
    if (!data?.publicStats) {
      return new Response(`Stats for this link are not public`, {
        status: 403,
      });
    }

    const response = await getStats({
      domain,
      key,
      endpoint,
      interval,
    });
    if (!response) {
      return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
    }

    return new Response(JSON.stringify(response), { status: 200 });
  } else {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  }
}
