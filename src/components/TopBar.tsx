"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";

export default function TopBar({
  handle,
  isAdmin,
}: {
  handle: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const active = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3 sm:px-6">
        <Link
          href="/dashboard"
          className="mr-3 flex items-center gap-2 text-[15px] font-bold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent-weak)] text-[13px] font-extrabold text-[var(--on-accent-weak)]">
            XL
          </span>
          {SITE_NAME}
        </Link>

        <Link href="/dashboard" className="nav-link" data-active={active("/dashboard")}>
          Home
        </Link>
        <Link href="/about" className="nav-link" data-active={active("/about")}>
          About
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <UserMenu handle={handle} isAdmin={isAdmin} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
