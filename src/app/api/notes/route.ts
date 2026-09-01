import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, requireUser, withErrors, ApiError } from "@/lib/api";
import { noteMetadataSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const NOTE_COLUMNS =
  "id, subject_id, title, description, doc_date, session_tag, file_kind, mime_type, file_size, created_at";

/** GET /api/notes?subjectId=... - notes for a subject (any signed-in user). */
export const GET = withErrors(async (request: NextRequest) => {
  const { supabase } = await requireUser();
  const subjectId = new URL(request.url).searchParams.get("subjectId");
  if (!subjectId) throw new ApiError(400, "subjectId is required");

  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false });

  if (error) throw new ApiError(500, "Could not load notes");
  return NextResponse.json({ notes: data ?? [] });
});

/**
 * POST /api/notes - register an uploaded file (admin only).
 * The client has already put the bytes in the private "notes" bucket
 * (RLS lets admins do that) and passes the resulting storagePath here.
 */
export const POST = withErrors(async (request: NextRequest) => {
  const { supabase, userId } = await requireAdmin();

  const body = await request.json().catch(() => null);
  const parsed = noteMetadataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid metadata" },
      { status: 400 },
    );
  }
  const m = parsed.data;

  // The subject must exist (defensive - FK also enforces this).
  const { data: subject } = await supabase
    .from("subjects")
    .select("id")
    .eq("id", m.subjectId)
    .single();
  if (!subject) throw new ApiError(404, "Subject not found");

  const { data, error } = await supabase
    .from("notes")
    .insert({
      subject_id: m.subjectId,
      title: m.title,
      description: m.description || null,
      doc_date: m.docDate || null,
      session_tag: m.sessionTag || null,
      storage_path: m.storagePath,
      file_kind: m.fileKind,
      mime_type: m.mimeType ?? null,
      file_size: m.fileSize ?? null,
      rendered_html: m.renderedHtml ?? null,
      uploaded_by: userId,
    })
    .select(NOTE_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Could not save the note." },
      { status: 500 },
    );
  }
  return NextResponse.json({ note: data }, { status: 201 });
});
