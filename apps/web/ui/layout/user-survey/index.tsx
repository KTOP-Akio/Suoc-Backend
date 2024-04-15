"use client";

import { Popup, PopupContext, useResizeObserver } from "@dub/ui";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { createContext, useContext, useRef, useState } from "react";
import { toast } from "sonner";
import SurveyForm from "./survey-form";

type UserSurveyStatus = "idle" | "loading" | "success";

export const UserSurveyContext = createContext<{ status: UserSurveyStatus }>({
  status: "idle",
});

export default function UserSurveyPopup() {
  const { data: session } = useSession();

  // @ts-ignore
  return session?.user.source !== null ? null : (
    <Popup hiddenCookieId="hideUserSurveyPopup">
      <UserSurveyPopupInner />
    </Popup>
  );
}

export function UserSurveyPopupInner() {
  const { hidePopup } = useContext(PopupContext);

  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const resizeObserverEntry = useResizeObserver(contentWrapperRef);

  const [status, setStatus] = useState<UserSurveyStatus>("idle");

  return (
    <motion.div
      animate={{
        height: resizeObserverEntry?.borderBoxSize[0].blockSize ?? "auto",
      }}
      transition={{ ease: "easeInOut", duration: 0.1 }}
      className="fixed bottom-4 z-50 mx-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md sm:left-4 sm:mx-auto sm:max-w-sm"
    >
      <div className="p-4" ref={contentWrapperRef}>
        <button
          className="absolute right-2.5 top-2.5 rounded-full p-1 transition-colors hover:bg-gray-100 active:scale-90"
          onClick={hidePopup}
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
        <UserSurveyContext.Provider value={{ status }}>
          <SurveyForm
            onSubmit={async (source) => {
              setStatus("loading");
              try {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                await fetch("/api/user", {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ source }),
                });
                setStatus("success");
                setTimeout(hidePopup, 2000);
              } catch (e) {
                toast.error("Failed to do it!");
                setStatus("idle");
              }
            }}
          />
          <AnimatePresence>
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-white text-sm"
              >
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-gray-500">Thank you!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </UserSurveyContext.Provider>
      </div>
    </motion.div>
  );
}
