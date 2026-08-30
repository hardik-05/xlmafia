import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin - XLRI Notes Portal" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?reason=auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  // Middleware already gates /admin, this is defence in depth.
  if (profile?.role !== "admin") redirect("/dashboard?error=forbidden");

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-semibold">
            Admin
          </Link>
          <nav className="flex gap-4 text-sm text-[var(--muted)]">
            <Link href="/admin/subjects" className="hover:text-[var(--text)]">
              Subjects
            </Link>
            <Link href="/admin/upload" className="hover:text-[var(--text)]">
              Upload
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-4 text-sm text-[var(--muted)]">
            <Link href="/dashboard" className="hover:text-[var(--text)]">
              User view
            </Link>
            <span className="hidden sm:inline">
              {profile?.full_name || profile?.email}
            </span>
            <a href="/auth/signout" className="hover:text-[var(--text)]">
              Sign out
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
