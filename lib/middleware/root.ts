import { NextRequest, NextFetchEvent, NextResponse } from "next/server";
import { recordClick } from "@/lib/upstash";
import { parse } from "./utils";

export default function RootMiddleware(req: NextRequest, ev: NextFetchEvent) {
  const { hostname } = parse(req);

  if (!hostname) {
    return NextResponse.next();
  }

  ev.waitUntil(recordClick(hostname, req)); // record clicks on root page

  if (
    hostname === "dub.sh" ||
    hostname === "preview.dub.sh" ||
    hostname.endsWith(".vercel.app")
  ) {
    return NextResponse.next();
  } else {
    const url = req.nextUrl;
    url.pathname = "/placeholder"; // rewrite to a /placeholder page unless the user defines a site to redirect to
    return NextResponse.rewrite(url);
  }
}
