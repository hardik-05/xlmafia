import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SubjectWithStats } from "@/lib/types";
import SubjectManager from "./SubjectManager";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: subjects }, { data: stats }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name, code, created_at")
      .order("name"),
    supabase
      .from("subject_stats")
      .select("subject_id, note_count, total_thumbs_up"),
  ]);

  const byId = new Map((stats ?? []).map((s) => [s.subject_id as string, s]));
  const initial: SubjectWithStats[] = (subjects ?? []).map((s) => ({
    ...s,
    note_count: Number(byId.get(s.id)?.note_count ?? 0),
    total_thumbs_up: Number(byId.get(s.id)?.total_thumbs_up ?? 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Subjects</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Create a subject with a name and a unique code, then upload material to it.
        </p>
      </div>
      <SubjectManager initialSubjects={initial} />
    </div>
  );
}
