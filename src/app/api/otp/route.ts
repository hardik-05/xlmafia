import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { isAllowedEmail, ALLOWED_DOMAIN } from "@/lib/auth/domain";
import { otpRequestSchema } from "@/lib/validation";
import type { CookieToSet } from "@/lib/supabase/cookies";

export const dynamic = "force-dynamic";

/** Resolve this deployment's own origin without relying on a build-time env var. */
function resolveOrigin(request: NextRequest): string {
  const hdr = request.headers.get("origin");
  if (hdr && /^https?:\/\//.test(hdr)) return hdr.replace(/\/$/, "");
  try {
    return new URL(request.url).origin;
  } catch {
    return env.siteUrl;
  }
}

/**
 * Sends a Magic Link ONLY when the email is in the allowed domain.
 * The link returns to /auth/callback. The PKCE code verifier that
 * signInWithOtp generates is written back as a cookie on THIS response so
 * /auth/callback can complete exchangeCodeForSession.
 */
export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = otpRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email address" },
      { status: 400 },
    );
  }

  const { email, stay, next } = parsed.data;

  if (!isAllowedEmail(email)) {
    return NextResponse.json(
      { error: `Only @${ALLOWED_DOMAIN} email addresses are allowed.` },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const redirectTo =
    `${resolveOrigin(request)}/auth/callback?stay=${stay ? "1" : "0"}` +
    (next ? `&next=${encodeURIComponent(next)}` : "");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not send the sign-in link. Try again in a minute." },
      { status: 502 },
    );
  }

  return response;
}
