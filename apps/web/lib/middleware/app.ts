import { parse } from "@/lib/middleware/utils";
import { NextRequest, NextResponse } from "next/server";
import NewLinkMiddleware from "./new-link";
import { getDefaultWorkspace } from "./utils/get-default-workspace";
import { getOnboardingStep } from "./utils/get-onboarding-step";
import { getRefreshedUser } from "./utils/get-refreshed-user";
import { getUserViaToken } from "./utils/get-user-via-token";

export default async function AppMiddleware(req: NextRequest) {
  const { path, fullPath, searchParamsString } = parse(req);
  const user = await getUserViaToken(req);
  const isWorkspaceInvite = req.nextUrl.searchParams.get("invite");

  // if there's no user and the path isn't /login or /register, redirect to /login
  if (
    !user &&
    path !== "/login" &&
    path !== "/register" &&
    path !== "/auth/saml" &&
    !path.startsWith("/auth/reset-password/")
  ) {
    return NextResponse.redirect(
      new URL(
        `/login${path === "/" ? "" : `?next=${encodeURIComponent(fullPath)}`}`,
        req.url,
      ),
    );

    // if there's a user
  } else if (user) {
    const refreshedUser = await getRefreshedUser(user);

    // /new is a special path that creates a new link (or workspace if the user doesn't have one yet)
    if (path === "/new") {
      return NewLinkMiddleware(req, user);

      /* Onboarding redirects

        - User was created less than a day ago
        - User has no workspaces
        - User is not invited to a workspace (redirect straight to the workspace)
        - The path does not start with /onboarding
      */
    } else if (
      new Date(user.createdAt).getTime() > Date.now() - 60 * 60 * 24 * 1000 &&
      !path.startsWith("/onboarding")
    ) {
      const defaultWorkspace = await getDefaultWorkspace(user);

      let step = await getOnboardingStep(user);
      if (!step) {
        return NextResponse.redirect(new URL(`/onboarding`, req.url));
      } else if (step === "completed") {
        return NextResponse.rewrite(new URL(`/app.dub.co${fullPath}`, req.url));
      }

      if (defaultWorkspace) {
        // Skip workspace step if user already has a workspace (maybe there was an error updating the onboarding step)
        step = step === "workspace" ? "link" : step;
        return NextResponse.redirect(
          new URL(`/onboarding/${step}?slug=${defaultWorkspace}`, req.url),
        );
      } else {
        return NextResponse.redirect(new URL(`/onboarding/${step}`, req.url));
      }

      // if the path is / or /login or /register, redirect to the default workspace
    } else if (
      [
        "/",
        "/login",
        "/register",
        "/analytics",
        "/events",
        "/integrations",
        "/domains",
        "/settings",
      ].includes(path) ||
      path.startsWith("/integrations/") ||
      path.startsWith("/settings/")
    ) {
      const defaultWorkspace = await getDefaultWorkspace(user);

      if (defaultWorkspace) {
        let redirectPath = path;
        if (["/", "/login", "/register"].includes(path)) {
          redirectPath = "";
        } else if (
          path === "/integrations" ||
          path.startsWith("/integrations/")
        ) {
          redirectPath = `/settings/${path}`;
        }
        return NextResponse.redirect(
          new URL(
            `/${defaultWorkspace}${redirectPath}${searchParamsString}`,
            req.url,
          ),
        );
      } else {
        return NextResponse.redirect(new URL("/workspaces", req.url));
      }
    }
  }

  // otherwise, rewrite the path to /app
  return NextResponse.rewrite(new URL(`/app.dub.co${fullPath}`, req.url));
}
