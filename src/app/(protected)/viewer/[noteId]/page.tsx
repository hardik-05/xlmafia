import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FileKind } from "@/lib/types";
import DocViewer from "@/components/secure/DocViewer";
import CommentThread from "@/components/CommentThread";
import BackLink from "@/components/BackLink";

export const dynamic = "force-dynamic";

interface NoteRow {
  id: string;
  title: string;
  description: string | null;
  file_kind: FileKind;
  rendered_html: string | null;
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
      "id, title, description, file_kind, rendered_html, subject_id, subjects(name, code)",
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
        <BackLink
          href={`/subjects/${note.subject_id}`}
          label={`Back to ${note.subjects?.name ?? "subject"}`}
        />
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{note.title}</h1>
        {note.description && (
          <p className="mt-1 text-sm text-[var(--muted)]">{note.description}</p>
        )}
      </div>

      <DocViewer
        noteId={note.id}
        fileKind={note.file_kind}
        renderedHtml={note.rendered_html}
      />

      <CommentThread
        noteId={note.id}
        currentUserName={authorName}
        currentUserId={currentUserId}
      />
    </div>
  );
}
