import {
  LOCALHOST_GEO_DATA,
  capitalize,
  getDomainWithoutWWW,
  LOCALHOST_IP,
} from "@dub/utils";
import { ipAddress } from "@vercel/edge";
import { NextRequest, userAgent } from "next/server";
import { conn, getDomainViaEdge, getLinkViaEdge } from "./planetscale";
import { ratelimit, updateRedisLink } from "./upstash";
import { detectBot } from "./middleware/utils";

/**
 * Recording clicks with geo, ua, referer and timestamp data
 * If key is not specified, record click as the root click ("_root", e.g. dub.sh, vercel.fyi)
 **/
export async function recordClick({
  req,
  domain,
  key,
  url,
  id,
  projectId,
}: {
  req: NextRequest;
  domain: string;
  key?: string;
  url?: string;
  id?: string;
  projectId?: string;
}) {
  const isBot = detectBot(req);
  if (isBot) {
    return null;
  }
  const geo = process.env.VERCEL === "1" ? req.geo : LOCALHOST_GEO_DATA;
  const ua = userAgent(req);
  const referer = req.headers.get("referer");
  const ip = ipAddress(req) || LOCALHOST_IP;
  // if in production / preview env, deduplicate clicks from the same IP, domain and key – only record 1 click per hour
  if (process.env.VERCEL === "1") {
    const { success } = await ratelimit(2, "1 h").limit(
      `recordClick:${ip}:${domain.toLowerCase()}:${
        key?.toLowerCase() || "_root"
      }`,
    );
    if (!success) {
      return null;
    }
  }
  let updateRedis = false;

  if (id || !projectId) {
    if (key) {
      const linkData = await getLinkViaEdge(domain, key);
      id = linkData?.id;
      projectId = linkData?.projectId || undefined;
    } else {
      const domainData = await getDomainViaEdge(domain);
      id = domainData?.id;
      projectId = domainData?.projectId || undefined;
    }
    updateRedis = true;
  }

  console.log({ id, projectId, domain, key, url });

  return await Promise.allSettled([
    fetch(
      "https://api.us-east.tinybird.co/v0/events?name=dub_click_events&wait=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.TINYBIRD_API_KEY}`,
        },
        body: JSON.stringify({
          link_id: id,
          project_id: projectId,
          domain,
          key: key || "_root",
          url,
          timestamp: new Date(Date.now()).toISOString(),
          alias: "", // "dub.sh/alias"
          country: geo?.country || "Unknown",
          city: geo?.city || "Unknown",
          region: geo?.region || "Unknown",
          latitude: geo?.latitude || "Unknown",
          longitude: geo?.longitude || "Unknown",
          device: ua.device.type ? capitalize(ua.device.type) : "Desktop",
          device_vendor: ua.device.vendor || "Unknown",
          device_model: ua.device.model || "Unknown",
          browser: ua.browser.name || "Unknown",
          browser_version: ua.browser.version || "Unknown",
          engine: ua.engine.name || "Unknown",
          engine_version: ua.engine.version || "Unknown",
          os: ua.os.name || "Unknown",
          os_version: ua.os.version || "Unknown",
          cpu_architecture: ua.cpu?.architecture || "Unknown",
          ua: ua.ua || "Unknown",
          bot: ua.isBot,
          referer: referer
            ? getDomainWithoutWWW(referer) || "(direct)"
            : "(direct)",
          referer_url: referer || "(direct)",
        }),
      },
    ).then((res) => res.json()),

    updateRedis &&
      updateRedisLink({
        domain,
        key,
        data: {
          id,
          projectId,
        },
      }),

    // increment the click count for the link if key is specified (not root click)
    // also increment the usage count for the project, and then we have a cron that will reset it at the start of new billing cycle
    key
      ? [
          conn.execute(
            "UPDATE Link SET clicks = clicks + 1, lastClicked = NOW() WHERE domain = ? AND `key` = ?",
            [domain, key],
          ),
          conn.execute(
            "UPDATE Project p JOIN Domain d ON p.id = d.projectId SET p.usage = p.usage + 1 WHERE d.slug = ?",
            [domain],
          ),
        ]
      : conn.execute(
          "UPDATE Domain SET clicks = clicks + 1, lastClicked = NOW() WHERE slug = ?",
          [domain],
        ),
  ]);
}

// WIP, still needs testing
export async function deleteClickData({
  domain,
  key,
}: {
  domain: string;
  key: string;
}) {
  if (!domain || !key) {
    return null;
  }
  const deleteCondition = `domain='${domain}' AND key='${key}'`;
  const response = await fetch(
    "https://api.tinybird.co/v0/datasources/click_events/delete",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TINYBIRD_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `delete_condition=${encodeURIComponent(deleteCondition)}`,
    },
  ).then((res) => res.json());
  console.log({ response });
  return response;
}
