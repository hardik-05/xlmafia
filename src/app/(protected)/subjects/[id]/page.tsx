import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FILE_KIND_LABEL, type Note } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, code")
    .eq("id", id)
    .single();
  if (!subject) notFound();

  const { data: notes } = await supabase
    .from("notes")
    .select(
      "id, subject_id, title, description, doc_date, session_tag, file_kind, mime_type, file_size, thumbs_up, created_at",
    )
    .eq("subject_id", id)
    .order("created_at", { ascending: false });

  const list = (notes ?? []) as Note[];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
        >
          &larr; All subjects
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{subject.name}</h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-[var(--accent)]">
          {subject.code}
        </p>
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-10 text-center text-sm text-[var(--muted)]">
          No notes in this subject yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((n) => (
            <li key={n.id}>
              <Link
                href={`/viewer/${n.id}`}
                className="flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)] hover:bg-[var(--surface-2)]"
              >
                <span className="mt-0.5 rounded bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--muted)]">
                  {FILE_KIND_LABEL[n.file_kind]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{n.title}</span>
                  <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                    {n.session_tag && <span>#{n.session_tag}</span>}
                    {n.doc_date && <span>{n.doc_date}</span>}
                    <span>
                      added {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </span>
                </span>
                <span
                  className="inline-flex shrink-0 items-center gap-1 text-xs text-[var(--muted)]"
                  title={`${n.thumbs_up} thumbs up`}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M2 21h4V9H2v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                  </svg>
                  {n.thumbs_up}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
