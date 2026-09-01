import { type NextRequest } from "next/server";
import { requireUser, withErrors, ApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FileKind } from "@/lib/validation";

export const dynamic = "force-dynamic";

const CONTENT_TYPE: Record<FileKind, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  md: "text/markdown; charset=utf-8",
  image: "application/octet-stream",
};

/**
 * GET /api/notes/[id]/file
 * Streams the private document bytes to a signed-in viewer. The raw storage
 * URL is never exposed. Served inline (no download prompt) and cached in the
 * viewer's browser only, so re-opening a note is instant.
 */
export const GET = withErrors(
  async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { supabase } = await requireUser();
    const { id } = await ctx.params;

    const { data: note, error } = await supabase
      .from("notes")
      .select("id, storage_path, file_kind, mime_type")
      .eq("id", id)
      .single();
    if (error || !note) throw new ApiError(404, "Note not found");

    const admin = createSupabaseAdminClient();
    const { data: signed, error: signErr } = await admin.storage
      .from("notes")
      .createSignedUrl(note.storage_path, 60);
    if (signErr || !signed?.signedUrl) {
      throw new ApiError(502, "Could not open the document");
    }

    const upstream = await fetch(signed.signedUrl, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      throw new ApiError(502, "Document is unavailable");
    }

    const contentType =
      note.mime_type ||
      CONTENT_TYPE[note.file_kind as FileKind] ||
      "application/octet-stream";

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        // Per-viewer browser cache; not shared caches / CDN.
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  },
);
