import { Suspense } from "react";
import { ALLOWED_DOMAIN } from "@/lib/auth/domain";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in - XLRI Notes Portal" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            XLRI Notes Portal
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sign in with your{" "}
            <span className="font-medium text-[var(--text)]">
              @{ALLOWED_DOMAIN}
            </span>{" "}
            account.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
          <Suspense fallback={<div className="h-64" />}>
            <LoginForm allowedDomain={ALLOWED_DOMAIN} />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Access is restricted and monitored. Material in this portal is for
          personal study only and may not be copied or redistributed.
        </p>
      </div>
    </main>
  );
}
