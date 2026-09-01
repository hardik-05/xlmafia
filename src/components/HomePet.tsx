"use client";

import { useEffect, useRef, useState } from "react";

type Pose = "idle" | "walk" | "hop" | "sit";

const PET_W = 60;
const PET_H = 50;
const WALK_SPEED = 55; // px/s — deliberately slow
const REST_MIN = 4200; // ~5s pause between moves
const REST_JITTER = 2600;
const HOP_MAX_DIST = 240; // moves shorter than this are hops, not walks
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const tf = (x: number, y: number) => `translate3d(${x}px, ${y}px, 0)`;

const MOODS = ["calm", "look", "sniff", "scratch", "calm"] as const;

/**
 * A small SVG pup that hops around the home page: perches on the heading / nav
 * / cards, rests ~5s pulling faces, then hops to a *nearby* perch (long walks
 * are rare). Click it to hop somewhere close. One fixed element animated with
 * the Web Animations API — no libraries, GPU-composited, paused when the tab
 * is hidden, off for reduced-motion and < 768px.
 */
export default function HomePet() {
  const [state, setState] = useState<"loading" | "on" | "off">("loading");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hopRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.innerWidth < 768) return;
    let off = false;
    try {
      off = localStorage.getItem("pet:off") === "1";
    } catch {
      /* ignore */
    }
    setState(off ? "off" : "on");
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (state !== "on" || !root) return;

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const pos = { x: 56, y: H() - PET_H - 28 };
    let anim: Animation | null = null;
    let timer: number | null = null;
    let moodInt: number | null = null;

    const apply = () => {
      root.style.transform = tf(pos.x, pos.y);
    };
    const setPose = (p: Pose) => {
      root.dataset.pose = p;
    };
    const setMood = (m: string) => {
      root.dataset.mood = m;
    };
    const setFace = (dir: number) => {
      root.dataset.face = dir < 0 ? "left" : "right";
    };
    const clearAll = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (moodInt !== null) {
        clearInterval(moodInt);
        moodInt = null;
      }
      anim?.cancel();
      anim = null;
    };

    const perchTargets = () =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-pet-perch]"))
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 24 && r.top < H() - 30 && r.bottom > 8)
        .map((r) => ({
          x: clamp(
            r.left + r.width * (0.2 + Math.random() * 0.6) - PET_W / 2,
            4,
            W() - PET_W - 4,
          ),
          y: clamp(r.top - PET_H + 10, 4, H() - PET_H - 4),
        }));

    apply();

    const rest = () => {
      clearAll();
      const sit = Math.random() < 0.5;
      setPose(sit ? "sit" : "idle");
      if (sit) {
        setMood("calm");
      } else {
        let i = 0;
        setMood(MOODS[0]);
        moodInt = window.setInterval(
          () => {
            i += 1;
            setMood(MOODS[i % MOODS.length]);
          },
          1400 + Math.random() * 900,
        );
      }
      timer = window.setTimeout(
        wander,
        REST_MIN + Math.random() * REST_JITTER,
      );
    };

    const pickTarget = () => {
      const cands = perchTargets()
        .map((t) => ({ ...t, d: Math.hypot(t.x - pos.x, t.y - pos.y) }))
        .filter((t) => t.d > 26)
        .sort((a, b) => a.d - b.d);
      if (cands.length) {
        const pool = cands.slice(0, Math.min(3, cands.length));
        const r = Math.random();
        const idx = r < 0.62 ? 0 : r < 0.87 ? 1 : Math.min(2, pool.length - 1);
        return pool[idx];
      }
      const nx = clamp(
        pos.x + (Math.random() * 260 - 130),
        20,
        W() - PET_W - 20,
      );
      return { x: nx, y: H() - PET_H - 28, d: Math.abs(nx - pos.x) };
    };

    const finishAt = (tx: number, ty: number) => {
      pos.x = tx;
      pos.y = ty;
      apply();
      rest();
    };

    const walkTo = (tx: number, ty: number) => {
      setPose("walk");
      const dist = Math.hypot(tx - pos.x, ty - pos.y);
      const dur = clamp((dist / WALK_SPEED) * 1000, 500, 5000);
      anim?.cancel();
      anim = root.animate([{ transform: tf(pos.x, pos.y) }, { transform: tf(tx, ty) }], {
        duration: dur,
        easing: "linear",
        fill: "forwards",
      });
      anim.onfinish = () => finishAt(tx, ty);
    };

    const hopTo = (tx: number, ty: number) => {
      setPose("hop");
      const midX = (pos.x + tx) / 2;
      const rise = clamp(Math.hypot(tx - pos.x, ty - pos.y) * 0.55, 34, 82);
      const midY = Math.min(pos.y, ty) - rise;
      anim?.cancel();
      anim = root.animate(
        [
          { transform: tf(pos.x, pos.y), offset: 0 },
          { transform: tf(midX, midY), offset: 0.5, easing: "ease-out" },
          { transform: tf(tx, ty), offset: 1, easing: "ease-in" },
        ],
        { duration: 560, fill: "forwards" },
      );
      anim.onfinish = () => finishAt(tx, ty);
    };

    function wander() {
      clearAll();
      const t = pickTarget();
      setFace(t.x - pos.x);
      if (t.d <= HOP_MAX_DIST) hopTo(t.x, t.y);
      else walkTo(t.x, t.y);
    }

    hopRef.current = () => {
      clearAll();
      const ang = Math.random() * Math.PI * 2;
      const r = 90 + Math.random() * 150;
      const tx = clamp(pos.x + Math.cos(ang) * r, 20, W() - PET_W - 20);
      const ty = clamp(pos.y + Math.sin(ang) * r, 70, H() - PET_H - 28);
      setFace(tx - pos.x);
      hopTo(tx, ty);
    };

    const onVis = () => {
      if (document.hidden) {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
        anim?.pause();
      } else if (anim && anim.playState === "paused") {
        anim.play();
      } else if (timer === null) {
        rest();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    let rt: number | null = null;
    const onResize = () => {
      if (rt) clearTimeout(rt);
      rt = window.setTimeout(() => {
        if (window.innerWidth < 768) {
          setState("loading"); // hide entirely on small screens
          return;
        }
        pos.x = clamp(pos.x, 4, W() - PET_W - 4);
        pos.y = clamp(pos.y, 4, H() - PET_H - 4);
        apply();
      }, 200);
    };
    window.addEventListener("resize", onResize);

    const start = window.setTimeout(rest, 700);

    return () => {
      window.clearTimeout(start);
      clearAll();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      if (rt) clearTimeout(rt);
    };
  }, [state]);

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.setItem("pet:off", "1");
    } catch {
      /* ignore */
    }
    setState("off");
  };

  const callPup = () => {
    try {
      localStorage.removeItem("pet:off");
    } catch {
      /* ignore */
    }
    setState("on");
  };

  if (state === "loading") return null;

  if (state === "off") {
    return (
      <button
        type="button"
        onClick={callPup}
        className="btn btn-ghost btn-sm fixed bottom-4 right-4 z-40 gap-1.5 shadow-[var(--shadow-md)]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="8" cy="9" r="2.2" />
          <circle cx="16" cy="9" r="2.2" />
          <circle cx="5.5" cy="13.5" r="1.9" />
          <circle cx="18.5" cy="13.5" r="1.9" />
          <path d="M12 12.5c2.6 0 4.7 1.9 4.7 4.2 0 1.7-1.6 2.8-4.7 2.8s-4.7-1.1-4.7-2.8c0-2.3 2.1-4.2 4.7-4.2z" />
        </svg>
        Call Pup
      </button>
    );
  }

  return (
    <div
      ref={rootRef}
      className="pet-root"
      data-pose="idle"
      data-mood="calm"
      data-face="right"
    >
      <button
        type="button"
        className="pet-x"
        onClick={dismiss}
        tabIndex={-1}
        aria-label="Hide the pet"
      >
        ×
      </button>
      <div className="pet" onClick={() => hopRef.current()} role="presentation">
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
