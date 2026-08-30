import { NextResponse, type NextRequest } from "next/server";
import { requireUser, withErrors, ApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * POST /api/notes/[id]/like
 * Anonymous thumbs-up: increments the counter via a security-definer RPC.
 * No user association is stored; the client keeps a one-per-browser guard.
 */
export const POST = withErrors(
  async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { supabase } = await requireUser();
    const { id } = await ctx.params;

    const { data, error } = await supabase.rpc("increment_thumbs_up", {
      p_note_id: id,
    });

    if (error) {
      throw new ApiError(
        error.code === "P0002" || error.message.includes("not found") ? 404 : 500,
        "Could not register the like",
      );
    }

    return NextResponse.json({ thumbs_up: Number(data ?? 0) });
  },
);
