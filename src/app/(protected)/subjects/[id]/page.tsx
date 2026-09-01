import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    .select("id, title, created_at")
    .eq("subject_id", id)
    .order("created_at", { ascending: false });

  const list = notes ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-xs font-medium text-[var(--muted)] hover:text-[var(--accent)]"
        >
          ← All subjects
        </Link>
        <div className="mt-3 flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{subject.name}</h1>
          <span className="rounded-md bg-[var(--accent-weak)] px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--on-accent-weak)]">
            {subject.code}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          {list.length} {list.length === 1 ? "note" : "notes"}
        </p>
      </div>

      {list.length === 0 ? (
        <p className="card px-4 py-12 text-center text-sm text-[var(--muted)]">
          No notes in this subject yet.
        </p>
      ) : (
        <ul className="card divide-y divide-[var(--border)] overflow-hidden">
          {list.map((n) => (
            <li key={n.id}>
              <Link
                href={`/viewer/${n.id}`}
                className="flex items-center justify-between gap-3 px-5 py-4 text-[15px] font-medium transition hover:bg-[var(--nav-hover)]"
              >
                <span className="truncate">{n.title}</span>
                <svg
                  className="shrink-0 text-[var(--muted)]"
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
