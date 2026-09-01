import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function loadOverview() {
  const supabase = await createSupabaseServerClient();
  const [subjectsRes, notes, comments, stats] = await Promise.all([
    supabase.from("subjects").select("id, name, code").order("name"),
    supabase.from("notes").select("id", { count: "exact", head: true }),
    supabase.from("comments").select("id", { count: "exact", head: true }),
    supabase.from("subject_stats").select("subject_id, note_count"),
  ]);

  const byId = new Map(
    (stats.data ?? []).map((s) => [s.subject_id as string, Number(s.note_count)]),
  );
  const subjects = (subjectsRes.data ?? []).map((s) => ({
    ...s,
    note_count: byId.get(s.id) ?? 0,
  }));

  return {
    subjects,
    counts: {
      subjects: subjects.length,
      notes: notes.count ?? 0,
      comments: comments.count ?? 0,
    },
  };
}

export default async function AdminHome() {
  const { subjects, counts } = await loadOverview();
  const cards = [
    { label: "Subjects", value: counts.subjects, href: "/admin/subjects" },
    { label: "Notes", value: counts.notes, href: "/admin/upload" },
    { label: "Comments", value: counts.comments, href: "/dashboard" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Manage subjects and study material.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent-weak-hover)] hover:bg-[var(--nav-hover)]"
          >
            <div className="text-3xl font-semibold">{card.value}</div>
            <div className="mt-1 text-sm text-[var(--muted)]">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/subjects"
          className="btn btn-primary"
        >
          New subject
        </Link>
        <Link
          href="/admin/upload"
          className="btn btn-ghost"
        >
          Upload material
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">
          Subjects
        </h2>
        {subjects.length === 0 ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            No subjects yet. Create one to start uploading.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/admin/upload?subject=${s.id}`}
                className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent-weak-hover)] hover:bg-[var(--nav-hover)]"
              >
                <span className="font-mono text-xs uppercase tracking-wide text-[var(--accent)]">
                  {s.code}
                </span>
                <span className="mt-2 text-base font-medium leading-snug">
                  {s.name}
                </span>
                <span className="mt-3 text-xs text-[var(--muted)]">
                  {s.note_count} {s.note_count === 1 ? "note" : "notes"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
