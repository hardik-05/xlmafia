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
        <ul className="space-y-2">
          {list.map((n) => (
            <li key={n.id}>
              <Link
                href={`/viewer/${n.id}`}
                className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 font-medium transition hover:border-[var(--accent)] hover:bg-[var(--surface-2)]"
              >
                {n.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
