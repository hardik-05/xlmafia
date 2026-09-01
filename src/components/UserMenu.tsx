"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function UserMenu({
  handle,
  isAdmin,
}: {
  handle: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

  const inAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <div ref={ref} className="relative">
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
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-52 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[var(--shadow-md)]"
        >
          <div className="px-3 py-2 text-xs text-[var(--muted)]">
            Signed in as
            <div className="truncate font-medium text-[var(--text)]">
              {handle}
            </div>
          </div>
          <div className="my-1 h-px bg-[var(--border)]" />

          {isAdmin &&
            (inAdmin ? (
              <Link href="/dashboard" className="menu-item" role="menuitem">
                Switch to user view
              </Link>
            ) : (
              <Link href="/admin" className="menu-item" role="menuitem">
                Switch to admin view
              </Link>
            ))}

          <Link href="/about#support" className="menu-item" role="menuitem">
            Help
          </Link>
          <a href="/auth/signout" className="menu-item" role="menuitem">
            Sign out
          </a>
        </div>
      )}
    </div>
  );
}
