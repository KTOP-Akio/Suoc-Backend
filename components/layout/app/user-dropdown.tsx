import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Logout } from "@/components/shared/icons";
import Popover from "@/components/shared/popover";
import IconMenu from "../../shared/icon-menu";
import Image from "next/image";
import va from "@vercel/analytics";
import Link from "next/link";
import { Settings } from "lucide-react";

export default function UserDropdown() {
  const { data: session } = useSession();
  const [openPopover, setOpenPopover] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <Popover
        content={
          <div className="w-full rounded-md bg-white p-2 sm:w-52">
            <Link
              href="/settings"
              className="block w-full rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100"
            >
              <IconMenu
                text="Settings"
                icon={<Settings className="h-4 w-4" />}
              />
            </Link>
            <button
              className="w-full rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100"
              onClick={() => {
                signOut();
                // track logout event
                va.track("Logout");
              }}
            >
              <IconMenu text="Logout" icon={<Logout className="h-4 w-4" />} />
            </button>
          </div>
        }
        align="end"
        openPopover={openPopover}
        setOpenPopover={setOpenPopover}
      >
        <button
          onClick={() => setOpenPopover(!openPopover)}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-300 transition-all duration-75 focus:outline-none active:scale-95 sm:h-10 sm:w-10"
        >
          {session && (
            <Image
              alt={session?.user?.email || "Avatar for logged in user"}
              src={
                session?.user?.image ||
                `https://avatars.dicebear.com/api/micah/${session?.user?.email}.svg`
              }
              width={40}
              height={40}
            />
          )}
        </button>
      </Popover>
    </div>
  );
}
