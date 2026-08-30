import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Role = "admin" | "user";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Ctx = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export interface SessionContext {
  supabase: Ctx;
  userId: string;
  profile: Profile;
}

/** Resolves the caller's session + profile, or throws ApiError(401). */
export async function requireUser(): Promise<SessionContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new ApiError(401, "Not authenticated");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single<Profile>();

  if (error || !profile) throw new ApiError(401, "Profile not found");

  return { supabase, userId: user.id, profile };
}

/** Same as requireUser but also enforces role = 'admin'. */
export async function requireAdmin(): Promise<SessionContext> {
  const ctx = await requireUser();
  if (ctx.profile.role !== "admin") {
    throw new ApiError(403, "Administrator access required");
  }
  return ctx;
}

/** Wraps a route handler so thrown ApiErrors become clean JSON responses. */
export function withErrors<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>,
) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error("[api] unhandled error", err);
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 },
      );
    }
  };
}
