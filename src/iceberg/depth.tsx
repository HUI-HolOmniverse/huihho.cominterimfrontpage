/* ------------------------------------------------------------------ */
/*  Instrumentação de profundidade — isolada de re-render (P4/P5)      */
/*  store por assinatura · canvas com DPR limitado, pausa e semente    */
/* ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../motion";

export const MAX_DEPTH = 140;

/* ---------- store ---------- */
export interface DepthStore {
  get(): number;
  set(d: number): void;
  subscribe(fn: (d: number) => void): () => void;
}

export function createDepthStore(): DepthStore {
  let depth = 0;
  const subs = new Set<(d: number) => void>();
  return {
    get: () => depth,
    set: (d) => {
      const next = Math.max(0, Math.min(MAX_DEPTH, d));
      if (Math.abs(next - depth) > 0.05) {
        depth = next;
        subs.forEach((f) => f(depth));
      }
    },
    subscribe: (fn) => {
      subs.add(fn);
      fn(depth);
      return () => {
        subs.delete(fn);
      };
    },
  };
}

/* ---------- hook de scroll ---------- */
export function useDepthScroll(store: DepthStore) {
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const vh = window.innerHeight;
      const total = Math.max(1, document.documentElement.scrollHeight - vh);
      store.set((window.scrollY / total) * MAX_DEPTH);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [store]);
}

/* ---------- zonas (re-render apenas ao cruzar limiar) ---------- */
export function useDepthZone(store: DepthStore, thresholds: number[]): number {
  const [zone, setZone] = useState(0);
  useEffect(
    () =>
      store.subscribe((d) => {
        let z = 0;
        for (let i = 0; i < thresholds.length; i++) if (d >= thresholds[i]) z = i + 1;
        setZone((prev) => (prev === z ? prev : z));
      }),
    [store, thresholds],
  );
  return zone;
}

/* ---------- HUD: sem estado React por frame ---------- */
export function DepthGauge({ store }: { store: DepthStore }) {
  const markerRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const zoneRef = useRef<HTMLSpanElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      store.subscribe((d) => {
        const rail = railRef.current;
        if (!rail) return;
        const h = rail.clientHeight;
        const pct = d / MAX_DEPTH;
        if (markerRef.current) markerRef.current.style.transform = `translateY(${pct * h}px)`;
        if (readoutRef.current) readoutRef.current.textContent = `−${Math.round(d)} m`;
        if (zoneRef.current) {
          const z = d < 6 ? "AR" : d < 90 ? "ÁGUA" : "ABISSO";
          if (zoneRef.current.textContent !== z) zoneRef.current.textContent = z;
        }
      }),
    [store],
  );

  return (
    <aside className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-3" aria-hidden="true">
      <span ref={zoneRef} className="font-mono text-[9px] tracking-[0.3em] text-lumen-300 border border-lumen-500/40 rounded-full px-2.5 py-1 bg-ink-950/70">
        AR
      </span>
      <div ref={railRef} className="relative h-[38vh] w-px bg-seam-strong">
        {[0, 6 / MAX_DEPTH, 0.5, 90 / MAX_DEPTH, 1].map((p) => (
          <span key={p} className="absolute left-1/2 -translate-x-1/2 w-2 h-px bg-mist-600/60" style={{ top: `${p * 100}%` }} />
        ))}
        <div ref={markerRef} className="absolute -left-[5px] top-0 w-[11px] h-[11px] rounded-full border-2 border-lumen-400 bg-ink-950 shadow-[0_0_12px_rgba(95,227,200,0.5)]" />
      </div>
      <span ref={readoutRef} className="font-mono text-[11px] text-mist-300 tabular-nums bg-ink-950/70 px-2 py-1 rounded border border-seam">
        −0 m
      </span>
    </aside>
  );
}

/* ---------- campo ambiente ---------- */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Mote {
  x: number;
  y: number;
  r: number;
  v: number;
  drift: number;
  phase: number;
}

export function DepthField({ store }: { store: DepthStore }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rand = mulberry32(20260830);
    const COUNT = 64;
    const motes: Mote[] = Array.from({ length: COUNT }, () => ({
      x: rand(),
      y: rand(),
      r: 0.6 + rand() * 1.8,
      v: 0.0004 + rand() * 0.0012,
      drift: (rand() - 0.5) * 0.0006,
      phase: rand() * Math.PI * 2,
    }));

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let raf = 0;
    let running = true;
    let t = 0;

    const draw = () => {
      const depth = store.get();
      const submerged = depth >= 6;
      const abyss = depth >= 90;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        const px = m.x * w;
        const py = m.y * h;
        const tw = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.0012 + m.phase);
        const alpha = submerged ? (abyss ? 0.16 : 0.3) * tw + 0.06 : 0.22 * tw + 0.05;
        ctx.beginPath();
        ctx.arc(px, py, m.r * (submerged ? 1.25 : 1), 0, Math.PI * 2);
        ctx.fillStyle = submerged
          ? `rgba(143,240,221,${alpha.toFixed(3)})`
          : `rgba(217,232,230,${alpha.toFixed(3)})`;
        ctx.fill();
        if (!reduced) {
          if (submerged) {
            m.y -= m.v * 1.6;
            if (m.y < -0.02) m.y = 1.02;
          } else {
            m.y += m.v * 0.6;
            if (m.y > 1.02) m.y = -0.02;
          }
          m.x += m.drift + Math.sin(t * 0.0006 + m.phase) * 0.00015;
          if (m.x > 1.02) m.x = -0.02;
          if (m.x < -0.02) m.x = 1.02;
        }
      }
    };

    const loop = (now: number) => {
      if (!running) return;
      t = now;
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      const visible = document.visibilityState === "visible";
      if (visible && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (!visible && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    if (reduced) {
      draw();
    } else {
      raf = requestAnimationFrame(loop);
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
  }, [store, reduced]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" aria-hidden="true" />;
}
