import { NextApiRequest, NextApiResponse } from "next";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/api/auth";
import { LinkProps } from "@/lib/api/types";

// This is a special route for creating custom dub.sh links.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  if (!session?.user.id) return res.status(401).end("Unauthorized");

  // GET /api/links – get all dub.sh links created by the user
  if (req.method === "GET") {
    const keys = await redis.zrange<string[]>(
      `dub.sh:links:timestamps:${session?.user.id}`,
      0,
      -1,
      { rev: true }
    );
    const metadata = (await redis.hmget(`dub.sh:links`, ...keys)) as {
      [key: string]: Omit<LinkProps, "key">;
    };
    // probably can just convert metadata from an object to an array tho
    const response = keys.map((key) => ({
      key,
      ...metadata[key],
    }));
    return res.status(200).json(response);

    // POST /api/links – create a new link
  } else if (req.method === "POST") {
    let { key, url } = req.body;
    if (!key || !url) {
      return res.status(400).json({ error: "Missing key or url" });
    }
    const response = await redis.hsetnx(`dub.sh:links`, key, url);
    if (response === 1) {
      await redis.zadd(`dub.sh:metadata:${session?.user.id}`, {
        score: Date.now(),
        member: key,
      });
      return res.status(200).json({
        key,
        url,
      });
    } else {
      return res.status(500).json({
        error: "Failed to save link",
      });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
