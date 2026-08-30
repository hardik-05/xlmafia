"use client";

import { useEffect, useRef } from "react";
import {
  inactivityWindowMs,
  absoluteWindowMs,
} from "@/lib/auth/session";

const LS_KEY = "xlri:lastActivity";
const CHECK_EVERY_MS = 30_000;
const THROTTLE_MS = 5_000;
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "wheel",
] as const;

/**
 * Enforces the two client-side session rules:
 *  - 4h inactivity auto-logout (activity listeners reset the timer)
 *  - absolute cap: 4h normally, 48h when "stay logged in" was chosen
 * Server middleware enforces the absolute cap too; this is the in-tab path
 * plus the only path for pure inactivity.
 */
export default function SessionGuard({
  loginAt,
  stayLoggedIn,
}: {
  loginAt: number;
  stayLoggedIn: boolean;
}) {
  const lastActivity = useRef<number>(Date.now());

  useEffect(() => {
    // Restore the idle clock from a previous tab/reload so a fresh page load
    // does not silently extend the inactivity window.
    try {
      const stored = Number(localStorage.getItem(LS_KEY));
      if (Number.isFinite(stored) && stored > 0) {
        lastActivity.current = Math.max(stored, Date.now() - inactivityWindowMs);
      } else {
        localStorage.setItem(LS_KEY, String(lastActivity.current));
      }
    } catch {
      /* localStorage unavailable - fall back to in-memory only */
    }

    let lastWrite = 0;
    const markActivity = () => {
      const now = Date.now();
      lastActivity.current = now;
      if (now - lastWrite > THROTTLE_MS) {
        lastWrite = now;
        try {
          localStorage.setItem(LS_KEY, String(now));
        } catch {
          /* ignore */
        }
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY && e.newValue) {
        const v = Number(e.newValue);
        if (Number.isFinite(v)) lastActivity.current = Math.max(
          lastActivity.current,
          v,
        );
      }
    };

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, markActivity, { passive: true });
    }
    window.addEventListener("storage", onStorage);

    const signOut = (reason: string) => {
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        /* ignore */
      }
      window.location.href = `/auth/signout?reason=${reason}`;
    };

    const tick = () => {
      const now = Date.now();
      if (now - lastActivity.current >= inactivityWindowMs) {
        signOut("idle");
        return;
      }
      if (
        !loginAt ||
        now - loginAt >= absoluteWindowMs(stayLoggedIn)
      ) {
        signOut("expired");
      }
    };

    const timer = window.setInterval(tick, CHECK_EVERY_MS);
    tick();

    return () => {
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, markActivity);
      }
      window.removeEventListener("storage", onStorage);
      window.clearInterval(timer);
    };
  }, [loginAt, stayLoggedIn]);

  return null;
}
