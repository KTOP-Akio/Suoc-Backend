import { detectBot, getFinalUrl, parse } from "@/lib/middleware/utils";
import { recordClick } from "@/lib/tinybird";
import { getRedisLink, ratelimit, redis } from "@/lib/upstash";
import {
  DUB_HEADERS,
  LEGAL_PROJECT_ID,
  LOCALHOST_GEO_DATA,
  LOCALHOST_IP,
} from "@dub/utils";
import { ipAddress } from "@vercel/edge";
import {
  NextFetchEvent,
  NextRequest,
  NextResponse,
  userAgent,
} from "next/server";
import { isBlacklistedReferrer } from "../edge-config";
import { getLinkViaEdge } from "../planetscale";
import { LinkProps, RedisDomainMetadataProps, RedisLinkProps } from "../types";

export default async function LinkMiddleware(
  req: NextRequest,
  ev: NextFetchEvent,
) {
  let { domain, fullKey: key } = parse(req);

  if (!domain || !key) {
    return NextResponse.next();
  }

  // links on Dub are case insensitive by default
  key = key.toLowerCase();

  if (
    process.env.NODE_ENV !== "development" &&
    domain === "dub.sh" &&
    key === "try"
  ) {
    if (await isBlacklistedReferrer(req.headers.get("referer"))) {
      return new Response("Don't DDoS me pls 🥺", { status: 429 });
    }
    const ip = ipAddress(req) || LOCALHOST_IP;
    const { success } = await ratelimit(10, "1 d").limit(
      `${ip}:${domain}:${key}`,
    );

    if (!success) {
      return new Response("Don't DDoS me pls 🥺", { status: 429 });
    }
  }

  const inspectMode = key.endsWith("+");
  if (inspectMode) {
    key = key.slice(0, -1);
  }

  const response = await redis.hmget<
    Record<string, RedisDomainMetadataProps | RedisLinkProps>
  >(
    domain,
    "_metadata",
    // if inspect mode is enabled, remove the trailing `+` from the key
    key,
  );

  let metadata = response
    ? (response._metadata as RedisDomainMetadataProps)
    : null;

  let link = response ? (response[key] as RedisLinkProps) : null;

  if (!metadata || !link) {
    const linkData = await getLinkViaEdge(domain, key);

    if (!linkData) {
      // short link not found, redirect to root
      return NextResponse.redirect(new URL("/", req.url), DUB_HEADERS);
    }

    let setMetadata = false;
    if (!metadata) {
      setMetadata = true;
      metadata = {
        projectId: linkData.projectId,
      };
    }
    link = await getRedisLink(linkData as any);

    await redis.hset(domain, {
      ...(setMetadata && { _metadata: metadata }),
      [key]: link,
    });
  }

  const {
    id,
    url: target,
    password,
    proxy,
    rewrite,
    iframeable,
    expiresAt,
    ios,
    android,
    geo,
  } = link;

  // only show inspect modal if the link is not password protected
  if (inspectMode && !password) {
    return NextResponse.rewrite(
      new URL(`/inspect/${domain}/${encodeURIComponent(key)}+`, req.url),
    );
  }

  // if the link is password protected
  if (password) {
    const pw = req.nextUrl.searchParams.get("pw");

    // rewrite to auth page (/protected/[domain]/[key]) if:
    // - no `pw` param is provided
    // - the `pw` param is incorrect
    // this will also ensure that no clicks are tracked unless the password is correct
    if (!pw || (await getLinkViaEdge(domain, key))?.password !== pw) {
      return NextResponse.rewrite(
        new URL(`/protected/${domain}/${encodeURIComponent(key)}`, req.url),
      );
    } else if (pw) {
      // strip it from the URL if it's correct
      req.nextUrl.searchParams.delete("pw");
    }
  }

  // if the link is banned
  if (metadata.projectId === LEGAL_PROJECT_ID) {
    return NextResponse.rewrite(new URL("/banned", req.url));
  }

  // if the link has expired
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return NextResponse.rewrite(new URL("/expired", req.url));
  }

  // only track the click when there is no `dub-no-track` header
  if (!req.headers.get("dub-no-track")) {
    ev.waitUntil(recordClick({ req, id, domain, key }));
  }

  const isBot = detectBot(req);

  const { country } =
    process.env.VERCEL === "1" && req.geo ? req.geo : LOCALHOST_GEO_DATA;

  // rewrite to proxy page (/_proxy/[domain]/[key]) if it's a bot and proxy is enabled
  if (isBot && proxy) {
    return NextResponse.rewrite(
      new URL(`/proxy/${domain}/${encodeURIComponent(key)}`, req.url),
    );

    // rewrite to target URL if link cloaking is enabled
  } else if (rewrite) {
    if (iframeable) {
      return NextResponse.rewrite(
        new URL(`/rewrite/${target}`, req.url),
        DUB_HEADERS,
      );
    } else {
      // if link is not iframeable, use Next.js rewrite instead
      return NextResponse.rewrite(decodeURIComponent(target), DUB_HEADERS);
    }

    // redirect to iOS link if it is specified and the user is on an iOS device
  } else if (ios && userAgent(req).os?.name === "iOS") {
    return NextResponse.redirect(getFinalUrl(ios, { req }), DUB_HEADERS);

    // redirect to Android link if it is specified and the user is on an Android device
  } else if (android && userAgent(req).os?.name === "Android") {
    return NextResponse.redirect(getFinalUrl(android, { req }), DUB_HEADERS);

    // redirect to geo-specific link if it is specified and the user is in the specified country
  } else if (geo && country && country in geo) {
    return NextResponse.redirect(
      getFinalUrl(geo[country], { req }),
      DUB_HEADERS,
    );

    // regular redirect
  } else {
    return NextResponse.redirect(getFinalUrl(target, { req }), DUB_HEADERS);
  }
}
