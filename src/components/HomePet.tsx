"use client";

import { useEffect, useRef, useState } from "react";

type Pose = "idle" | "walk" | "hop" | "sit";

const PET_W = 60;
const PET_H = 50;
const WALK_SPEED = 55; // px/s — deliberately slow
const idleGap = () => 2000 + Math.random() * 2200;
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

/**
 * A small SVG pup that wanders the home page: perches on the heading / nav /
 * cards, sits and pulls faces, restarts walking after a few seconds, and hops
 * to a new spot when clicked. One fixed element animated with the Web
 * Animations API — no libraries, GPU-composited, paused when the tab is hidden,
 * disabled for prefers-reduced-motion and on narrow screens.
 */
export default function HomePet() {
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hopRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.innerWidth < 768) return;
    try {
      if (localStorage.getItem("pet:off") === "1") return;
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!mounted || !root) return;

    const pos = { x: 56, y: window.innerHeight - PET_H - 28 };
    let anim: Animation | null = null;
    let timer: number | null = null;

    const apply = () => {
      root.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    };
    const setPose = (p: Pose) => {
      root.dataset.pose = p;
    };
    const setFace = (dir: number) => {
      root.dataset.face = dir < 0 ? "left" : "right";
    };
    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };
    const schedule = (fn: () => void, ms: number) => {
      clearTimer();
      timer = window.setTimeout(fn, ms);
    };

    const perches = () =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-pet-perch]"))
        .map((el) => el.getBoundingClientRect())
        .filter(
          (r) => r.width > 24 && r.top < window.innerHeight - 30 && r.bottom > 8,
        );

    apply();

    const idle = () => {
      anim?.cancel();
      anim = null;
      setPose(Math.random() < 0.55 ? "sit" : "idle");
      schedule(wander, idleGap());
    };

    const wander = () => {
      const ps = perches();
      let tx: number;
      let ty: number;
      if (ps.length && Math.random() < 0.82) {
        const r = ps[Math.floor(Math.random() * ps.length)];
        tx = clamp(
          r.left + 14 + Math.random() * Math.max(0, r.width - 28) - PET_W / 2,
          4,
          window.innerWidth - PET_W - 4,
        );
        ty = clamp(
          r.top - PET_H + 10,
          4,
          window.innerHeight - PET_H - 4,
        );
      } else {
        tx = 24 + Math.random() * (window.innerWidth - PET_W - 48);
        ty = window.innerHeight - PET_H - 28;
      }
      const dx = tx - pos.x;
      const dist = Math.hypot(dx, ty - pos.y);
      if (dist < 10) {
        idle();
        return;
      }
      setFace(dx);
      setPose("walk");
      const dur = clamp((dist / WALK_SPEED) * 1000, 500, 6500);
      anim?.cancel();
      anim = root.animate(
        [
          { transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` },
          { transform: `translate3d(${tx}px, ${ty}px, 0)` },
        ],
        { duration: dur, easing: "linear", fill: "forwards" },
      );
      anim.onfinish = () => {
        pos.x = tx;
        pos.y = ty;
        apply();
        idle();
      };
    };

    const hop = () => {
      clearTimer();
      anim?.cancel();
      setPose("hop");
      const tx = 24 + Math.random() * (window.innerWidth - PET_W - 48);
      const ty = clamp(
        pos.y + (Math.random() * 200 - 110),
        70,
        window.innerHeight - PET_H - 28,
      );
      setFace(tx - pos.x);
      const midX = (pos.x + tx) / 2;
      const midY = Math.min(pos.y, ty) - 66;
      anim = root.animate(
        [
          { transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`, offset: 0 },
          {
            transform: `translate3d(${midX}px, ${midY}px, 0)`,
            offset: 0.5,
            easing: "ease-out",
          },
          {
            transform: `translate3d(${tx}px, ${ty}px, 0)`,
            offset: 1,
            easing: "ease-in",
          },
        ],
        { duration: 640, fill: "forwards" },
      );
      anim.onfinish = () => {
        pos.x = tx;
        pos.y = ty;
        apply();
        idle();
      };
    };
    hopRef.current = hop;

    const onVis = () => {
      if (document.hidden) {
        clearTimer();
        anim?.pause();
      } else {
        if (anim && anim.playState === "paused") anim.play();
        else if (!timer) idle();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    let rt: number | null = null;
    const onResize = () => {
      if (rt) clearTimeout(rt);
      rt = window.setTimeout(() => {
        if (window.innerWidth < 768) {
          setMounted(false);
          return;
        }
        pos.x = clamp(pos.x, 4, window.innerWidth - PET_W - 4);
        pos.y = clamp(pos.y, 4, window.innerHeight - PET_H - 4);
        apply();
      }, 200);
    };
    window.addEventListener("resize", onResize);

    const start = window.setTimeout(idle, 700);

    return () => {
      window.clearTimeout(start);
      clearTimer();
      anim?.cancel();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      if (rt) clearTimeout(rt);
    };
  }, [mounted]);

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.setItem("pet:off", "1");
    } catch {
      /* ignore */
    }
    setMounted(false);
  };

  if (!mounted) return null;

  return (
    <div ref={rootRef} className="pet-root" data-pose="idle" data-face="right">
      <button
        type="button"
        className="pet-x"
        onClick={dismiss}
        tabIndex={-1}
        aria-label="Hide the pet"
      >
        ×
      </button>
      <div
        className="pet"
        onClick={() => hopRef.current()}
        role="presentation"
      >
        <div className="pet-face">
          <svg viewBox="0 0 60 50" xmlns="http://www.w3.org/2000/svg">
            <ellipse className="pet-shadow" cx="30" cy="47" rx="17" ry="3.4" />
            <g className="pet-legB">
              <rect x="14" y="31" width="5" height="14" rx="2.5" fill="#b9823f" />
              <rect x="21" y="31" width="5" height="14" rx="2.5" fill="#b9823f" />
            </g>
            <g className="pet-legF">
              <rect x="35" y="31" width="5" height="14" rx="2.5" fill="#b9823f" />
              <rect x="42" y="31" width="5" height="14" rx="2.5" fill="#b9823f" />
            </g>
            <path
              className="pet-tail"
              d="M13 24 q-9 -2 -10 -10 q7 3 12 7 z"
              fill="#d8a05a"
            />
            <g className="pet-body">
              <ellipse cx="29" cy="27" rx="17" ry="11" fill="#d8a05a" />
              <ellipse cx="30" cy="31" rx="12" ry="6.5" fill="#f0d3ab" />
            </g>
            <path
              className="pet-ear"
              d="M39 9 q-4 -9 3 -8 q3 4 2 10 z"
              fill="#b9823f"
            />
            <circle cx="44" cy="18" r="10" fill="#d8a05a" />
            <ellipse cx="52" cy="20" rx="6" ry="4.6" fill="#f0d3ab" />
            <rect
              className="pet-tongue"
              x="50"
              y="23"
              width="5"
              height="6"
              rx="2.5"
              fill="#e8879b"
            />
            <circle cx="57" cy="19" r="2" fill="#2a2320" />
            <circle className="pet-eye" cx="45" cy="15" r="1.9" fill="#2a2320" />
          </svg>
        </div>
      </div>
    </div>
  );
}
