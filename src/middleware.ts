import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  LOGIN_AT_COOKIE,
  STAY_COOKIE,
  isAbsolutelyExpired,
  parseLoginAt,
} from "@/lib/auth/session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/subjects",
  "/viewer",
  "/admin",
  "/account",
  "/about",
];

const SUPABASE_COOKIE_RE = /^sb-.*-auth-token/;

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function redirect(request: NextRequest, path: string, params?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  return NextResponse.redirect(url);
}

function clearAuthCookies(request: NextRequest, res: NextResponse) {
  res.cookies.delete(LOGIN_AT_COOKIE);
  res.cookies.delete(STAY_COOKIE);
  for (const c of request.cookies.getAll()) {
    if (SUPABASE_COOKIE_RE.test(c.name)) res.cookies.delete(c.name);
  }
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Supabase uses the Site URL when the exact emailRedirectTo isn't in the
  // Redirect URLs allow-list, so a magic link can land on "/?code=..." (or
  // "/?token_hash=..."). Forward those to the real callback so the session
  // still completes and the user reaches their destination.
  if (
    (pathname === "/" || pathname === "") &&
    (request.nextUrl.searchParams.has("code") ||
      request.nextUrl.searchParams.has("token_hash"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // Only protected routes and the login page need a session check. Everything
  // else skips the Supabase round-trip entirely (big latency win).
  if (!isProtected(pathname) && pathname !== "/login") {
    return NextResponse.next();
  }

  const { response, supabase, user } = await updateSession(request);

  // Already authenticated and hitting the login page → go to the dashboard.
  if (user && pathname === "/login") {
    return redirect(request, "/dashboard");
  }

  // Absolute session cap (4h default / 48h with "stay logged in").
  if (user) {
    const loginAt = parseLoginAt(request.cookies.get(LOGIN_AT_COOKIE)?.value);
    const stay = request.cookies.get(STAY_COOKIE)?.value === "1";
    if (isAbsolutelyExpired(loginAt, stay)) {
      await supabase.auth.signOut();
      const res = redirect(request, "/login", { reason: "expired" });
      return clearAuthCookies(request, res);
    }
  }

  if (!isProtected(pathname)) return response;

  if (!user) {
    return redirect(request, "/login", { reason: "auth", next: pathname });
  }

  // /admin/* requires role = 'admin', validated against the DB (not the client).
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return redirect(request, "/dashboard", { error: "forbidden" });
    }
  }

  return response;
}

export const config = {
  // Skip Next internals, API routes (they authenticate themselves), the auth
  // callback/signout handlers, and static assets.
  matcher: [
    "/((?!api|auth|_next/static|_next/image|favicon.ico|pdf.worker.min.mjs|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mjs)$).*)",
  ],
};
