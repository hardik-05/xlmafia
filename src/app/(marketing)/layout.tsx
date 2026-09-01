import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { SITE_NAME } from "@/lib/site";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-[15px] font-bold tracking-tight"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent-weak)] text-[13px] font-extrabold text-[var(--on-accent-weak)]">
              XL
            </span>
            {SITE_NAME}
          </Link>
          <nav className="ml-auto flex items-center gap-1.5">
            <Link href="/login" className="btn btn-primary btn-sm">
              Sign in
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
