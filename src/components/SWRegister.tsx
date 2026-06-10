"use client";

import { useEffect } from "react";

/** Registers the hand-written service worker (production only — it would fight HMR in dev). */
export function SWRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => console.warn("Service worker registration failed:", error));
  }, []);

  return null;
}
