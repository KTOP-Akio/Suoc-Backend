import type { NextRequest } from "next/server";
import { redis } from "@/lib/upstash";
import { setRandomKey } from "@/lib/api/links";

export const config = {
  runtime: "experimental-edge",
};

export default async function handler(req: NextRequest) {
  if (req.method === "POST") {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return new Response(`Missing url or hostname`, { status: 400 });
    }
    const { response, key } = await setRandomKey(url);
    if (response === 1) {
      // if key was successfully added
      const pipeline = redis.pipeline();
      pipeline.zadd(`dub.sh:links:timestamps:generic`, {
        score: Date.now(),
        member: key,
      });
      pipeline.zadd(`dub.sh:links:clicks`, {
        score: 0,
        member: key,
      });
      await pipeline.exec();
      return new Response(
        JSON.stringify({
          key,
          url,
        }),
        { status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({
          error: "failed to save link",
        }),
        { status: 500 }
      );
    }
  } else {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  }
}
