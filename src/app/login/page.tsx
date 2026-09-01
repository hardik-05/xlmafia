import { Suspense } from "react";
import Link from "next/link";
import { ALLOWED_DOMAIN } from "@/lib/auth/domain";
import { PUBLIC_SUPPORT_MAILTO, SITE_NAME } from "@/lib/site";
import ThemeToggle from "@/components/ThemeToggle";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in · XL Notes" };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-weak)] text-sm font-extrabold text-[var(--on-accent-weak)]">
            XL
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{SITE_NAME}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sign in with your{" "}
            <span className="font-medium text-[var(--text)]">
              @{ALLOWED_DOMAIN}
            </span>{" "}
            account.
          </p>
        </div>

        <div className="card p-6">
          <Suspense fallback={<div className="h-64" />}>
            <LoginForm allowedDomain={ALLOWED_DOMAIN} />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--text)]">
            Home
          </Link>
          <span className="mx-2">·</span>
          <a href={PUBLIC_SUPPORT_MAILTO} className="hover:text-[var(--text)]">
            Support
          </a>
        </p>
      </div>
    </main>
  );
}
