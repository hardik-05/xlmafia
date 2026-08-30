import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function counts() {
  const supabase = await createSupabaseServerClient();
  const [subjects, notes, comments] = await Promise.all([
    supabase.from("subjects").select("id", { count: "exact", head: true }),
    supabase.from("notes").select("id", { count: "exact", head: true }),
    supabase.from("comments").select("id", { count: "exact", head: true }),
  ]);
  return {
    subjects: subjects.count ?? 0,
    notes: notes.count ?? 0,
    comments: comments.count ?? 0,
  };
}

export default async function AdminHome() {
  const c = await counts();
  const cards = [
    { label: "Subjects", value: c.subjects, href: "/admin/subjects" },
    { label: "Notes", value: c.notes, href: "/admin/upload" },
    { label: "Comments", value: c.comments, href: "/dashboard" },
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
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent)]"
          >
            <div className="text-3xl font-semibold">{card.value}</div>
            <div className="mt-1 text-sm text-[var(--muted)]">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/subjects"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)]"
        >
          New subject
        </Link>
        <Link
          href="/admin/upload"
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium"
        >
          Upload material
        </Link>
      </div>
    </div>
  );
}
