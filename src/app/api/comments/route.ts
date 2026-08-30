import { NextResponse, type NextRequest } from "next/server";
import { requireUser, withErrors, ApiError } from "@/lib/api";
import { commentSchema, sanitizeCommentBody } from "@/lib/validation";
import type { CommentNode } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLUMNS =
  "id, note_id, parent_id, author_id, author_name, body, created_at";

/** GET /api/comments?noteId=... - threaded comments (one level deep). */
export const GET = withErrors(async (request: NextRequest) => {
  const { supabase } = await requireUser();
  const noteId = new URL(request.url).searchParams.get("noteId");
  if (!noteId) throw new ApiError(400, "noteId is required");

  const { data, error } = await supabase
    .from("comments")
    .select(COLUMNS)
    .eq("note_id", noteId)
    .order("created_at", { ascending: true });

  if (error) throw new ApiError(500, "Could not load comments");

  const rows = (data ?? []) as CommentNode[];
  const roots: CommentNode[] = [];
  const byId = new Map<string, CommentNode>();
  for (const r of rows) byId.set(r.id, { ...r, replies: [] });
  for (const r of rows) {
    const node = byId.get(r.id)!;
    if (r.parent_id && byId.has(r.parent_id)) {
      byId.get(r.parent_id)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  }

  return NextResponse.json({ comments: roots });
});

/** POST /api/comments - add a comment or a one-level reply. */
export const POST = withErrors(async (request: NextRequest) => {
  const { supabase, userId, profile } = await requireUser();

  const raw = await request.json().catch(() => null);
  const parsed = commentSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid comment" },
      { status: 400 },
    );
  }

  const body = sanitizeCommentBody(parsed.data.body);
  if (!body) {
    return NextResponse.json({ error: "Comment is empty" }, { status: 400 });
  }

  // Enforce one level of nesting up front (DB trigger is the backstop).
  if (parsed.data.parentId) {
    const { data: parent } = await supabase
      .from("comments")
      .select("id, parent_id, note_id")
      .eq("id", parsed.data.parentId)
      .single();
    if (!parent || parent.note_id !== parsed.data.noteId) {
      throw new ApiError(400, "Invalid parent comment");
    }
    if (parent.parent_id) {
      throw new ApiError(400, "Replies can only be one level deep");
    }
  }

  const authorName =
    profile.full_name?.trim() || profile.email.split("@")[0] || "User";

  const { data, error } = await supabase
    .from("comments")
    .insert({
      note_id: parsed.data.noteId,
      parent_id: parsed.data.parentId ?? null,
      author_id: userId,
      author_name: authorName,
      body,
    })
    .select(COLUMNS)
    .single();

  if (error) throw new ApiError(500, "Could not post the comment");

  return NextResponse.json({ comment: { ...data, replies: [] } }, { status: 201 });
});

/** DELETE /api/comments?id=... - own comment (or admin). RLS enforces this. */
export const DELETE = withErrors(async (request: NextRequest) => {
  const { supabase } = await requireUser();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) throw new ApiError(400, "id is required");

  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw new ApiError(500, "Could not delete the comment");

  return NextResponse.json({ ok: true });
});
