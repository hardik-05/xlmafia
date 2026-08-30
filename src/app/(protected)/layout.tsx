import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LOGIN_AT_COOKIE, STAY_COOKIE, parseLoginAt } from "@/lib/auth/session";
import SessionGuard from "@/components/SessionGuard";
import TopBar from "@/components/TopBar";

export default async function ProtectedLayout({
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
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  const cookieStore = await cookies();
  const loginAt =
    parseLoginAt(cookieStore.get(LOGIN_AT_COOKIE)?.value) ?? Date.now();
  const stay = cookieStore.get(STAY_COOKIE)?.value === "1";

  return (
    <div className="min-h-screen">
      <SessionGuard loginAt={loginAt} stayLoggedIn={stay} />
      <TopBar
        displayName={profile?.full_name || profile?.email || "Signed in"}
        isAdmin={profile?.role === "admin"}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
