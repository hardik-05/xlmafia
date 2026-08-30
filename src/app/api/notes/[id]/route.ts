import { NextResponse } from "next/server";
import { requireAdmin, withErrors, ApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** DELETE /api/notes/[id] - remove a note and its stored file (admin only). */
export const DELETE = withErrors(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { supabase } = await requireAdmin();
    const { id } = await ctx.params;

    const { data: note, error } = await supabase
      .from("notes")
      .select("id, storage_path")
      .eq("id", id)
      .single();
    if (error || !note) throw new ApiError(404, "Note not found");

    // Remove the row first (RLS: admin), then the object via service role.
    const { error: delErr } = await supabase.from("notes").delete().eq("id", id);
    if (delErr) throw new ApiError(500, "Could not delete the note");

    try {
      await createSupabaseAdminClient()
        .storage.from("notes")
        .remove([note.storage_path]);
    } catch {
      // Row is gone; a stray object is harmless and can be cleaned later.
    }

    return NextResponse.json({ ok: true });
  },
);
