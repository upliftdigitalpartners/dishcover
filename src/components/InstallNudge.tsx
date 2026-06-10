"use client";

import { useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<unknown>;
}

const DISMISS_KEY = "dishcover-install-dismissed";

/**
 * Dismissible install hint, shown alongside results (the moment the app has
 * proven useful). Chromium: captures beforeinstallprompt and offers a real
 * install button. iOS Safari: shows the manual Share → Add to Home Screen
 * steps, since iOS has no install prompt. Hidden when already installed.
 */
function isEligible(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(DISMISS_KEY)) return false;
  } catch {
    return false; // storage blocked — don't nag on every visit
  }
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  return !standalone;
}

export function InstallNudge() {
  // Mounts client-side only (inside results), so detecting in the initializer
  // is hydration-safe; Chromium upgrades "hidden" → "prompt" via the event.
  const [mode, setMode] = useState<"hidden" | "prompt" | "ios">(() =>
    isEligible() && /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "hidden",
  );
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      if (!isEligible()) return;
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setMode("prompt");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (mode === "hidden") return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // best effort
    }
    setMode("hidden");
  };

  return (
    <div className="animate-pop-in flex items-start gap-3 rounded-2xl border border-line bg-card p-3 shadow-card">
      <span className="text-xl" aria-hidden>
        📲
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Keep Dishcover in your pocket</p>
        {mode === "ios" ? (
          <p className="mt-0.5 text-muted">
            Tap <span aria-hidden>⎙</span>
            <span className="font-medium text-ink"> Share</span>, then{" "}
            <span className="font-medium text-ink">Add to Home Screen</span>.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              void deferredPrompt.current?.prompt();
              dismiss();
            }}
            className="press mt-1.5 min-h-9 rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-deep"
          >
            Install app
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install hint"
        className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-cream"
      >
        ✕
      </button>
    </div>
  );
}
