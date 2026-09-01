import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import ThemeToggle from "@/components/ThemeToggle";
import { SITE_NAME, SUPPORT_MAILTO } from "@/lib/site";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link href="/" className="font-semibold">
            {SITE_NAME}
          </Link>
          <nav className="ml-auto flex items-center gap-5 text-sm text-[var(--muted)]">
            <Link href="/about" className="hover:text-[var(--text)]">
              About
            </Link>
            <a href={SUPPORT_MAILTO} className="hover:text-[var(--text)]">
              Support
            </a>
            <Link
              href="/login"
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 font-medium text-[var(--accent-contrast)]"
            >
              Sign in
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
