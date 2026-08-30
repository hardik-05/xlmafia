import { sessionPolicy } from "@/lib/env";

/** Cookie names for the absolute-session policy (separate from the sb-* auth cookies). */
export const LOGIN_AT_COOKIE = "sb_login_at";
export const STAY_COOKIE = "sb_stay";

const HOUR_MS = 60 * 60 * 1000;

export function absoluteWindowMs(stayLoggedIn: boolean): number {
  const h = stayLoggedIn
    ? sessionPolicy.absoluteHoursStay
    : sessionPolicy.absoluteHoursDefault;
  return h * HOUR_MS;
}

export const inactivityWindowMs = sessionPolicy.inactivityLogoutHours * HOUR_MS;

/**
 * True when the absolute session cap has been exceeded.
 * `loginAt` is epoch-ms as stored in the LOGIN_AT cookie.
 */
export function isAbsolutelyExpired(
  loginAt: number | null,
  stayLoggedIn: boolean,
  now: number = Date.now(),
): boolean {
  if (!loginAt || Number.isNaN(loginAt)) return true;
  return now - loginAt > absoluteWindowMs(stayLoggedIn);
}

export function parseLoginAt(value: string | undefined | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function baseCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
