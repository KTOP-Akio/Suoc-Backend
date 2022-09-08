import { NextApiRequest, NextApiResponse } from "next";
import { redis } from "@/lib/redis";
import { setKey } from "@/lib/api/links";
import { getSession } from "@/lib/api/auth";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  if (!session?.user.id) return res.status(401).end("Unauthorized");

  const { slug } = req.query;
  if (!slug || typeof slug !== "string") {
    return res
      .status(400)
      .json({ error: "Missing or misconfigured project slug" });
  }

  const isProjectOwner = await prisma.project.count({
    where: {
      slug,
      users: {
        some: {
          userId: session.user.id,
        },
      },
    },
  });
  if (!isProjectOwner) return res.status(401).end("Unauthorized");

  // POST /api/links – create a new link
  if (req.method === "POST") {
    let { hostname, key, url } = req.body;
    if (!hostname || !key || !url) {
      return res.status(400).json({ error: "Missing hostname, key or url" });
    }

    const response = await setKey(hostname, key, url);
    if (response === 1) {
      const pipeline = redis.pipeline();
      pipeline.zadd(`${hostname}:links:timestamps`, {
        score: Date.now(),
        member: key,
      });
      pipeline.zadd(`${hostname}:links:clicks`, {
        score: 0,
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
