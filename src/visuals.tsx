import { useEffect, useRef } from "react";
import { useReducedMotion } from "./motion";

/* ================================================================== */
/*  Holon field — ambient constellation canvas                        */
/* ================================================================== */
interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  z: number;
  gold: boolean;
}

export function HolonField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let motes: Mote[] = [];
    const mouse = { x: -9999, y: -9999 };

    const seed = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(90, Math.max(36, Math.floor((w * h) / 24000)));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 0.8 + Math.random() * 1.6,
        z: 0.3 + Math.random() * 0.7,
        gold: Math.random() < 0.12,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const linkDist = 120;
      for (const m of motes) {
        if (!reduced) {
          m.x += m.vx * m.z;
          m.y += m.vy * m.z;
          if (m.x < -20) m.x = w + 20;
          if (m.x > w + 20) m.x = -20;
          if (m.y < -20) m.y = h + 20;
          if (m.y > h + 20) m.y = -20;
          const dx = m.x - mouse.x;
          const dy = m.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 170 * 170 && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = ((170 - d) / 170) * 0.045;
            m.x += (dx / d) * f * 8;
            m.y += (dy / d) * f * 8;
          }
        }
        const tw = reduced ? 1 : 0.6 + 0.4 * Math.sin(t / 900 + m.x * 0.01 + m.y * 0.013);
        const alpha = 0.5 * m.z * tw;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * m.z, 0, Math.PI * 2);
        ctx.fillStyle = m.gold
          ? `rgba(233, 188, 98, ${alpha})`
          : `rgba(95, 227, 200, ${alpha * 0.9})`;
        ctx.fill();
      }
      for (let i = 0; i < motes.length; i++) {
        for (let j = i + 1; j < motes.length; j++) {
          const a = motes[i];
          const b = motes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < linkDist * linkDist) {
            const d = Math.sqrt(d2);
            const alpha = (1 - d / linkDist) * 0.14 * Math.min(a.z, b.z);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(95, 227, 200, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduced) raf = requestAnimationFrame(loop);
    };

    seed();
    if (reduced) draw(0);
    else raf = requestAnimationFrame(loop);

    window.addEventListener("resize", seed);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", seed);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}

/* ================================================================== */
/*  HolOmnisphere — nested rings · infinity-heart loops · QCORE       */
/* ================================================================== */
const C = 320;

function polar(r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)];
}

const HOLONS: { r: number; deg: number; s: number; gold?: boolean; pulse?: boolean }[] = [
  { r: 300, deg: 24, s: 5 },
  { r: 300, deg: 132, s: 4, gold: true },
  { r: 300, deg: 210, s: 4.5 },
  { r: 300, deg: 300, s: 3.5, pulse: true },
  { r: 248, deg: 66, s: 4.5, pulse: true },
  { r: 248, deg: 178, s: 3.5 },
  { r: 248, deg: 262, s: 5, gold: true },
  { r: 248, deg: 336, s: 3.5 },
  { r: 196, deg: 40, s: 3.5 },
  { r: 196, deg: 150, s: 4, gold: true },
  { r: 196, deg: 258, s: 3.5 },
];

export function HolOmnisphere({ className = "" }: { className?: string }) {
  return (
    <div className={`anim-breathe ${className}`}>
      <svg
        viewBox="0 0 640 640"
        className="w-full h-auto"
        role="img"
        aria-label="HolOmnisphere — campo de infinito-coração reciprocamente aninhável"
      >
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(95,227,200,0.5)" />
            <stop offset="45%" stopColor="rgba(95,227,200,0.12)" />
            <stop offset="100%" stopColor="rgba(95,227,200,0)" />
          </radialGradient>
          <radialGradient id="haloBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(18,48,64,0.55)" />
            <stop offset="70%" stopColor="rgba(10,31,41,0.18)" />
            <stop offset="100%" stopColor="rgba(5,14,19,0)" />
          </radialGradient>
        </defs>

        <circle cx={C} cy={C} r={310} fill="url(#haloBg)" />
        <circle cx={C} cy={C} r={225} fill="url(#coreGlow)" />

        {/* rings */}
        <g className="anim-spin-slow">
          <circle cx={C} cy={C} r={300} fill="none" stroke="rgba(95,227,200,0.34)" strokeWidth="1" strokeDasharray="3 10" />
          <circle cx={C} cy={C} r={300} fill="none" stroke="rgba(95,227,200,0.10)" strokeWidth="1" />
        </g>
        <g className="anim-spin-rev">
          <circle cx={C} cy={C} r={248} fill="none" stroke="rgba(233,188,98,0.30)" strokeWidth="1" strokeDasharray="1 7" />
        </g>
        <g className="anim-spin-mid">
          <circle cx={C} cy={C} r={196} fill="none" stroke="rgba(95,227,200,0.22)" strokeWidth="1" strokeDasharray="22 14" />
        </g>
        <circle cx={C} cy={C} r={140} fill="none" stroke="rgba(167,194,191,0.14)" strokeWidth="1" />

        {/* reciprocal infinity-heart loops */}
        <path
          d="M 150 320 C 150 226, 296 226, 320 320 C 344 414, 490 414, 490 320 C 490 226, 344 226, 320 320 C 296 414, 150 414, 150 320 Z"
          fill="none"
          stroke="rgba(95,227,200,0.55)"
          strokeWidth="1.4"
          strokeDasharray="6 12"
          className="anim-dash"
        />
        <path
          d="M 190 320 C 190 252, 300 252, 320 320 C 340 388, 450 388, 450 320 C 450 252, 340 252, 320 320 C 300 388, 190 388, 190 320 Z"
          fill="none"
          stroke="rgba(233,188,98,0.4)"
          strokeWidth="1"
          strokeDasharray="2 9"
          className="anim-dash"
          style={{ animationDirection: "reverse" }}
        />

        {/* holons */}
        {HOLONS.map((h, i) => {
          const [x, y] = polar(h.r, h.deg);
          return (
            <g key={i}>
              {h.pulse && (
                <circle cx={x} cy={y} r={h.s * 2.6} fill="none" stroke={h.gold ? "rgba(233,188,98,0.5)" : "rgba(95,227,200,0.5)"} strokeWidth="1" className="pulse-ring" />
              )}
              <circle cx={x} cy={y} r={h.s} fill={h.gold ? "#e9bc62" : "#5fe3c8"} opacity={0.9} />
              <circle cx={x} cy={y} r={h.s + 4} fill={h.gold ? "rgba(233,188,98,0.12)" : "rgba(95,227,200,0.12)"} />
            </g>
          );
        })}

        {/* QCORE — coherence function, not a throne */}
        <g>
          <rect x={C - 30} y={C - 30} width={60} height={60} transform={`rotate(45 ${C} ${C})`} fill="none" stroke="rgba(95,227,200,0.45)" strokeWidth="1" />
          <rect x={C - 17} y={C - 17} width={34} height={34} transform={`rotate(45 ${C} ${C})`} fill="rgba(95,227,200,0.07)" stroke="rgba(233,188,98,0.55)" strokeWidth="1" />
          <circle cx={C} cy={C} r={5} fill="#8ff0dd" />
          <circle cx={C} cy={C} r={10} fill="none" stroke="rgba(143,240,221,0.4)" strokeWidth="1" className="pulse-ring" />
        </g>

        {/* axis labels */}
        <text x={C} y={44} textAnchor="middle" className="fill-mist-500" style={{ font: "500 11px 'JetBrains Mono', monospace", letterSpacing: "0.3em" }}>
          ROOT
        </text>
        <text x={608} y={C + 4} textAnchor="end" className="fill-mist-500" style={{ font: "500 11px 'JetBrains Mono', monospace", letterSpacing: "0.3em" }}>
          DOMAIN
        </text>
        <text x={C} y={612} textAnchor="middle" className="fill-mist-500" style={{ font: "500 11px 'JetBrains Mono', monospace", letterSpacing: "0.3em" }}>
          TOPIC
        </text>
        <text x={32} y={C + 4} textAnchor="start" className="fill-mist-500" style={{ font: "500 11px 'JetBrains Mono', monospace", letterSpacing: "0.3em" }}>
          PROVENANCE
        </text>

        <text x={C} y={C + 62} textAnchor="middle" className="fill-lumen-400" style={{ font: "600 12px 'JetBrains Mono', monospace", letterSpacing: "0.42em" }}>
          QCORE
        </text>
        <text x={C} y={C + 80} textAnchor="middle" className="fill-mist-600" style={{ font: "400 9px 'JetBrains Mono', monospace", letterSpacing: "0.22em" }}>
          função de coerência
        </text>
      </svg>
    </div>
  );
}

/* ---------- tiny monogram ---------- */
export function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="6" y="6" width="28" height="28" transform="rotate(45 20 20)" fill="none" stroke="rgba(95,227,200,0.55)" strokeWidth="1.4" />
      <path d="M 12 20 C 12 15, 19 15, 20 20 C 21 25, 28 25, 28 20 C 28 15, 21 15, 20 20 C 19 25, 12 25, 12 20 Z" fill="none" stroke="#e9bc62" strokeWidth="1.3" />
      <circle cx="20" cy="20" r="2" fill="#8ff0dd" />
    </svg>
  );
}
