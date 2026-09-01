import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { LOGIN_AT_COOKIE, STAY_COOKIE } from "@/lib/auth/session";
import type { CookieToSet } from "@/lib/supabase/cookies";

export const dynamic = "force-dynamic";

const SUPABASE_COOKIE_RE = /^sb-.*-auth-token/;

async function handle(request: NextRequest) {
  const { origin } = new URL(request.url);
  // After sign-out land on the public home page, not the sign-in screen.
  let response = NextResponse.redirect(`${origin}/`, { status: 303 });

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
