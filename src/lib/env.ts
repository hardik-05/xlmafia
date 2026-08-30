/**
 * Centralised environment access. Throws early (at import) if a required
 * public var is missing so misconfiguration fails loudly in the build/boot,
 * not deep inside a request.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000",
  allowedDomain: (
    process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ||
    process.env.ALLOWED_EMAIL_DOMAIN ||
    "astra.xlri.ac.in"
  )
    .toLowerCase()
    .trim(),
};

/** Server-only. Do not import from a client component. */
export function serviceRoleKey(): string {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

const hours = (name: string, fallback: number): number => {
  const raw = process.env[name];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const sessionPolicy = {
  inactivityLogoutHours: hours("NEXT_PUBLIC_INACTIVITY_LOGOUT_HOURS", 4),
  absoluteHoursDefault: hours("NEXT_PUBLIC_ABSOLUTE_SESSION_HOURS_DEFAULT", 4),
  absoluteHoursStay: hours("NEXT_PUBLIC_ABSOLUTE_SESSION_HOURS_STAY", 48),
};
