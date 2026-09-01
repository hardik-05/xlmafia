"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import ThemeToggle from "@/components/ThemeToggle";

export default function TopBar({
  handle,
  isAdmin,
}: {
  handle: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const active = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
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

        <div ref={menuRef} className="relative ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="nav-link inline-flex items-center gap-1.5 font-medium"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent-weak)] text-[10px] font-bold text-[var(--on-accent-weak)]">
              {handle.slice(0, 2).toUpperCase() || "XL"}
            </span>
            <span className="max-w-[14ch] truncate">{handle}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+8px)] w-48 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[var(--shadow-md)]"
            >
              <div className="px-3 py-2 text-xs text-[var(--muted)]">
                Signed in as
                <div className="truncate font-medium text-[var(--text)]">
                  {handle}
                </div>
              </div>
              <div className="my-1 h-px bg-[var(--border)]" />
              {isAdmin && (
                <Link href="/admin" className="menu-item" role="menuitem">
                  Admin panel
                </Link>
              )}
              <Link href="/about#support" className="menu-item" role="menuitem">
                Help
              </Link>
              <a href="/auth/signout" className="menu-item" role="menuitem">
                Sign out
              </a>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
