import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { LOGIN_AT_COOKIE, STAY_COOKIE } from "@/lib/auth/session";
import type { CookieToSet } from "@/lib/supabase/cookies";

export const dynamic = "force-dynamic";

const SUPABASE_COOKIE_RE = /^sb-.*-auth-token/;

async function handle(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const reason = searchParams.get("reason");
  // Manual sign-out -> home. Automatic timeout -> sign-in with an explanation.
  const dest =
    reason === "idle" || reason === "expired"
      ? `${origin}/login?reason=${reason}`
      : `${origin}/`;
  let response = NextResponse.redirect(dest, { status: 303 });

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

  await supabase.auth.signOut();

  response.cookies.delete(LOGIN_AT_COOKIE);
  response.cookies.delete(STAY_COOKIE);
  for (const c of request.cookies.getAll()) {
    if (SUPABASE_COOKIE_RE.test(c.name)) response.cookies.delete(c.name);
  }

  return response;
}

export const GET = handle;
export const POST = handle;
