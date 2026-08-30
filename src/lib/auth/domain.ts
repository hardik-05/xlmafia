import { env } from "@/lib/env";

export const ALLOWED_DOMAIN = env.allowedDomain;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Basic shape check + exact domain match (case-insensitive). */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_RE.test(trimmed)) return false;
  return trimmed.endsWith(`@${ALLOWED_DOMAIN}`);
}

/** Throws a descriptive error when the email is not in the allowed domain. */
export function assertAllowedEmail(email: string | null | undefined): string {
  if (!isAllowedEmail(email)) {
    throw new Error(
      `Access is restricted to @${ALLOWED_DOMAIN} email addresses.`,
    );
  }
  return email!.trim().toLowerCase();
}
