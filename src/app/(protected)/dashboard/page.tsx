import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SubjectWithStats } from "@/lib/types";
import SubjectGrid from "@/components/SubjectGrid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Subjects - XLRI Notes Portal" };

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: subjects }, { data: stats }] = await Promise.all([
    supabase.from("subjects").select("id, name, code, created_at").order("name"),
    supabase.from("subject_stats").select("subject_id, note_count"),
  ]);

  const byId = new Map((stats ?? []).map((s) => [s.subject_id as string, s]));
  const merged: SubjectWithStats[] = (subjects ?? []).map((s) => ({
    ...s,
    note_count: Number(byId.get(s.id)?.note_count ?? 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Subjects</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Browse by subject. Search filters by name or code.
        </p>
      </div>
      <SubjectGrid subjects={merged} />
    </div>
  );
}
