import { constructMetadata } from "@dub/utils";
import { Divider } from "#/ui/shared/icons";
import { Logo, MaxWidthWrapper } from "@dub/ui";
import { HOME_DOMAIN } from "@dub/utils";
import Link from "next/link";
import { ReactNode, Suspense } from "react";
import UserDropdown from "#/ui/layout/user-dropdown";
import ProjectSelect, {
  ProjectSelectPlaceholder,
} from "#/ui/layout/project-select.tsx";
import NavTabs from "#/ui/layout/nav-tabs";
import UpgradeBanner from "#/ui/layout/upgrade-banner";

export const metadata = constructMetadata();

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="sticky left-0 right-0 top-0 z-20 border-b border-gray-200 bg-white">
        <MaxWidthWrapper>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/">
                <Logo className="h-8 w-8 transition-all duration-75 active:scale-95" />
              </Link>
              <Divider className="h-8 w-8 text-gray-200 sm:ml-3" />
              <Suspense fallback={<ProjectSelectPlaceholder />}>
                <ProjectSelect />
              </Suspense>
              <UpgradeBanner />
            </div>
            <div className="flex items-center space-x-6">
              <a
                href={`${HOME_DOMAIN}/changelog`}
                className="hidden text-sm text-gray-500 transition-colors hover:text-gray-700 sm:block"
                target="_blank"
              >
                Changelog
              </a>
              <a
                href={`${HOME_DOMAIN}/help`}
                className="hidden text-sm text-gray-500 transition-colors hover:text-gray-700 sm:block"
                target="_blank"
              >
                Help
              </a>
              <UserDropdown />
            </div>
          </div>
          <NavTabs />
        </MaxWidthWrapper>
      </div>
      {children}
    </div>
  );
}
