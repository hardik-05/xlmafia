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

  // Show only the local part of the institute email, e.g. "xof26019".
  const handle = (profile?.email ?? "").split("@")[0] || "account";

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SessionGuard loginAt={loginAt} stayLoggedIn={stay} />
      <TopBar handle={handle} isAdmin={profile?.role === "admin"} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
