import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { CookieToSet } from "@/lib/supabase/cookies";
import { isAllowedEmail } from "@/lib/auth/domain";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  LOGIN_AT_COOKIE,
  STAY_COOKIE,
  absoluteWindowMs,
  baseCookieOptions,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * OAuth / Magic-Link landing. Exchanges the code for a session, then
 * independently re-checks the email domain and, on mismatch, signs the user
 * out and best-effort deletes the account. Sets the absolute-session cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  const stay = searchParams.get("stay") === "1";
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  // The response we will ultimately return; the Supabase client writes auth
  // cookies onto it directly.
  let response = NextResponse.redirect(`${origin}${next}`);

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

  let failed = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = Boolean(error);
  } else if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      type: otpType as "email" | "magiclink" | "recovery" | "invite",
      token_hash: tokenHash,
    });
    failed = Boolean(error);
  } else {
    failed = true;
  }

  if (failed) {
    return NextResponse.redirect(`${origin}/login?reason=auth_error`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedEmail(user.email)) {
    await supabase.auth.signOut();
    if (user) {
      try {
        await createSupabaseAdminClient().auth.admin.deleteUser(user.id);
      } catch {
        // service role key may be absent in some environments; sign-out still applied
      }
    }
    const denied = NextResponse.redirect(`${origin}/login?reason=domain`);
    return denied;
  }

  const maxAge = Math.floor(absoluteWindowMs(stay) / 1000);
  response.cookies.set(
    LOGIN_AT_COOKIE,
    String(Date.now()),
    baseCookieOptions(maxAge),
  );
  response.cookies.set(
    STAY_COOKIE,
    stay ? "1" : "0",
    baseCookieOptions(maxAge),
  );

  return response;
}
