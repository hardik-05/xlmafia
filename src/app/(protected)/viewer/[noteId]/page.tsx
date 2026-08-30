import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FILE_KIND_LABEL, type FileKind } from "@/lib/types";
import SecureDocViewer from "@/components/secure/SecureDocViewer";
import LikeButton from "@/components/LikeButton";
import CommentThread from "@/components/CommentThread";

export const dynamic = "force-dynamic";

interface NoteRow {
  id: string;
  title: string;
  description: string | null;
  doc_date: string | null;
  session_tag: string | null;
  file_kind: FileKind;
  thumbs_up: number;
  subject_id: string;
  subjects: { name: string; code: string } | null;
}

export default async function ViewerPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: user } = await supabase.auth.getUser();

  const { data: note } = await supabase
    .from("notes")
    .select(
      "id, title, description, doc_date, session_tag, file_kind, thumbs_up, subject_id, subjects(name, code)",
    )
    .eq("id", noteId)
    .single<NoteRow>();

  if (!note) notFound();

  const { data: profile } = user.user
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", user.user.id)
        .single()
    : { data: null };

  const authorName =
    profile?.full_name || profile?.email?.split("@")[0] || "You";
  const currentUserId = profile?.id ?? user.user?.id ?? "";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/subjects/${note.subject_id}`}
          className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
        >
          &larr; {note.subjects?.name ?? "Subject"}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{note.title}</h1>
            <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-[var(--muted)]">
              <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-semibold uppercase">
                {FILE_KIND_LABEL[note.file_kind]}
              </span>
              {note.session_tag && <span>#{note.session_tag}</span>}
              {note.doc_date && <span>{note.doc_date}</span>}
            </p>
            {note.description && (
              <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                {note.description}
              </p>
            )}
          </div>
          <LikeButton noteId={note.id} initialCount={note.thumbs_up} />
        </div>
      </div>

      <SecureDocViewer noteId={note.id} fileKind={note.file_kind} />

      <CommentThread
        noteId={note.id}
        currentUserName={authorName}
        currentUserId={currentUserId}
      />
    </div>
  );
}
