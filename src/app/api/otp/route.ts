import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { isAllowedEmail, ALLOWED_DOMAIN } from "@/lib/auth/domain";
import { otpRequestSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Sends a Magic Link ONLY when the email is in the allowed domain.
 * The link comes back to /auth/callback carrying `stay` and `next`.
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

  const { email, stay } = parsed.data;

  if (!isAllowedEmail(email)) {
    return NextResponse.json(
      { error: `Only @${ALLOWED_DOMAIN} email addresses are allowed.` },
      { status: 403 },
    );
  }

  // Cookie writes are irrelevant here (no session yet); give a no-op adapter.
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

  const redirectTo = `${env.siteUrl}/auth/callback?stay=${stay ? "1" : "0"}`;

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

  return NextResponse.json({ ok: true });
}
