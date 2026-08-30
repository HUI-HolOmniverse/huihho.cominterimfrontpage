import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { href, MANIFESTATIONS } from "./data";
import { Reveal, Scramble } from "./motion";
import { StatusChip } from "./chrome";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================== modelo de profundidade ============================== */
const MAX_DEPTH = 140;

const STRATA = [
  { id: "ponta", depth: 0, name: "A ponta", zone: "ar" },
  { id: "convergencia", depth: -12, name: "Convergência", zone: "água" },
  { id: "currentness", depth: -34, name: "Currentness", zone: "água" },
  { id: "evidencia", depth: -60, name: "Evidência", zone: "água" },
  { id: "ontogenese", depth: -92, name: "Camadas progressivas", zone: "água" },
  { id: "leito", depth: -140, name: "O leito", zone: "água" },
] as const;

type StratumId = (typeof STRATA)[number]["id"];

function useDepth() {
  const refs = useRef<Partial<Record<StratumId, HTMLElement | null>>>({});
  const [st, setSt] = useState({ depth: 0, active: "ponta" as StratumId, submerged: false, progress: 0 });

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const depth = Math.round(p * MAX_DEPTH);
      let active: StratumId = "ponta";
      const probe = window.scrollY + window.innerHeight * 0.45;
      for (const s of STRATA) {
        const el = refs.current[s.id];
        if (el && el.offsetTop <= probe) active = s.id;
      }
      setSt({ depth, active, submerged: depth >= 6, progress: p });
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return { ...st, refs };
}

/* ============================== campo ambiente (bolhas / poeira) ============================== */
function DepthField({ depthRef }: { depthRef: MutableRefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = prefersReducedMotion();

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const P = Array.from({ length: 64 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.8 + Math.random() * 2.6,
      vy: 0.25 + Math.random() * 0.8,
      drift: (Math.random() - 0.5) * 0.25,
      a: 0.12 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const submerged = depthRef.current >= 6;
      for (const p of P) {
        if (!reduced) {
          if (submerged) {
            p.y -= p.vy;
            p.x += Math.sin(t / 900 + p.phase) * 0.3;
            if (p.y < -12) {
              p.y = H + 12;
              p.x = Math.random() * W;
            }
          } else {
            p.y += p.vy * 0.35;
            p.x += p.drift;
            if (p.y > H + 12) {
              p.y = -12;
              p.x = Math.random() * W;
            }
          }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(143, 240, 221, ${p.a * (submerged ? 0.9 : 0.45)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        if (p.r > 2.4) {
          ctx.beginPath();
          ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(217, 232, 230, ${p.a * 0.6})`;
          ctx.fill();
        }
      }
    };

    let raf = 0;
    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    if (reduced) draw(0);
    else raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [depthRef]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none" aria-hidden="true" />;
}

/* ============================== HUD de profundidade ============================== */
function DepthGauge({ depth, active, submerged, progress }: { depth: number; active: StratumId; submerged: boolean; progress: number }) {
  return (
    <>
      {/* trilho desktop */}
      <div className="fixed right-7 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-center gap-4" aria-hidden="true">
        <span
          className={`px-2.5 py-1 rounded-full border font-mono text-[9px] tracking-[0.2em] transition-colors duration-700 ${
            submerged ? "border-lumen-500/50 text-lumen-300 bg-lumen-500/5" : "border-gild-400/50 text-gild-300 bg-gild-400/5"
          }`}
        >
          {submerged ? "ÁGUA" : "AR"}
        </span>
        <div className="relative h-[42vh] w-px bg-gradient-to-b from-gild-400/40 via-seam-strong to-lumen-700/60">
          {STRATA.map((s) => {
            const top = (Math.abs(s.depth) / MAX_DEPTH) * 100;
            const isActive = active === s.id;
            return (
              <div key={s.id} className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ top: `${top}%` }}>
                <span
                  className={`block rounded-full transition-all duration-500 ${
                    isActive ? "w-2.5 h-2.5 bg-lumen-400 shadow-[0_0_12px_rgba(95,227,200,0.8)]" : "w-1.5 h-1.5 bg-mist-600"
                  }`}
                />
              </div>
            );
          })}
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transition-[top] duration-200 ease-out"
            style={{ top: `${progress * 100}%` }}
          >
            <span className="block w-3.5 h-3.5 rotate-45 border border-lumen-300 bg-ink-950" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-mono text-xl text-mist-50 tabular-nums">−{String(depth).padStart(3, "0")} m</p>
          <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-mist-600 mt-1">
            {STRATA.find((s) => s.id === active)?.name}
          </p>
        </div>
      </div>
    </>
  );
}

/* ============================== abertura: a ponta ============================== */
function StratumLabel({ index, depth, name }: { index: string; depth: string; name: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="font-mono text-[10px] tracking-[0.3em] text-gild-400">{index}</span>
      <span className="h-px w-12 bg-seam-strong" aria-hidden="true" />
      <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-mist-600">
        {name} · {depth}
      </span>
    </div>
  );
}

function Opening() {
  const acronym = [
    ["I", "International"],
    ["C", "Convergence"],
    ["E", "of Ecosystems"],
    ["G", "Giving"],
    ["B", "Birth"],
    ["E", "to an Era"],
    ["R", "of Regenerative"],
    ["G", "Growth"],
  ];
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16">
      <div className="atlas-grid absolute inset-0" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-12 gap-12 items-center w-full">
        <div className="lg:col-span-7">
          <Reveal>
            <p className="flex flex-wrap items-center gap-3 font-mono text-[10px] tracking-[0.3em] uppercase text-mist-500">
              <span className="anim-led inline-block w-1.5 h-1.5 rounded-full bg-lumen-400" />
              Ontogênese · primeiro evento ontogônico
              <StatusChip status="ACCEPTED CODE" />
            </p>
          </Reveal>
          <h1 className="font-display font-semibold text-mist-50 leading-[0.92] mt-7 text-[clamp(4rem,14vw,11rem)] tracking-tight">
            <Scramble text="ICEBERG" />
          </h1>
          <Reveal delay={200}>
            <p className="mt-6 max-w-xl text-lg text-mist-300 leading-relaxed font-light">
              Atlas profundo da <em className="font-display italic text-lumen-300">convergência</em>, da{" "}
              <em className="font-display italic text-gild-300">currentness</em>, da evidência e das camadas progressivas —
              navegável em descida, da ponta visível ao leito de proveniência.
            </p>
          </Reveal>
          <Reveal delay={340}>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <button
                onClick={() => document.getElementById("linha-dagua")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" })}
                className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-full border border-lumen-500/60 text-lumen-300 font-mono text-[11px] tracking-[0.22em] uppercase transition-all duration-300 hover:bg-lumen-500/10 hover:border-lumen-300 hover:shadow-[0_0_30px_rgba(62,207,178,0.25)]"
              >
                Iniciar descida
                <svg viewBox="0 0 12 20" className="w-2.5 h-4 transition-transform duration-300 group-hover:translate-y-1" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M6 1v16M1.5 12.5 6 17l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <a
                href={href("/iceberg")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] tracking-[0.16em] text-mist-500 underline decoration-seam-strong underline-offset-4 transition-colors duration-300 hover:text-mist-200"
              >
                rota canônica huihho.com/iceberg ↗
              </a>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal delay={260}>
            <div className="relative rounded-xl border border-seam bg-ink-900/60 p-7 sm:p-8">
              <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-mist-600 mb-6">decodificação do acrônimo</p>
              <ul className="space-y-2.5">
                {acronym.map(([letter, word], i) => (
                  <li key={i} className="group flex items-baseline gap-4 cursor-default">
                    <span className="grid place-items-center w-8 h-8 shrink-0 rounded border border-lumen-500/35 bg-ink-950 font-mono text-sm text-lumen-300 transition-all duration-300 group-hover:border-gild-400/70 group-hover:text-gild-300 group-hover:-translate-y-0.5">
                      {letter}
                    </span>
                    <span className="font-display text-xl sm:text-2xl text-mist-200 transition-colors duration-300 group-hover:text-mist-50">
                      {word}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-7 pt-5 border-t border-seam text-[12px] text-mist-500 leading-relaxed">
                A ponta é pública; a massa que a sustenta é o que este atlas atravessa — camada por camada, com estado
                epistêmico visível em cada alegação.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================== linha d'água ============================== */
function Waterline() {
  return (
    <div id="linha-dagua" className="relative h-[46vh] min-h-[300px] overflow-hidden" aria-hidden="true">
      <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-[200%] h-24 anim-wave" viewBox="0 0 1200 100" preserveAspectRatio="none" fill="none">
        <path d="M0 50 Q 75 20 150 50 T 300 50 T 450 50 T 600 50 T 750 50 T 900 50 T 1050 50 T 1200 50" stroke="rgba(95,227,200,0.4)" strokeWidth="1.5" />
      </svg>
      <svg className="absolute left-0 top-1/2 -translate-y-[30%] w-[200%] h-24 anim-wave-rev" viewBox="0 0 1200 100" preserveAspectRatio="none" fill="none">
        <path d="M0 50 Q 100 78 200 50 T 400 50 T 600 50 T 800 50 T 1000 50 T 1200 50" stroke="rgba(233,188,98,0.22)" strokeWidth="1" />
      </svg>
      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-lumen-500/30" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="block px-5 py-2.5 rounded-full border border-lumen-500/50 bg-ink-950/85 backdrop-blur font-mono text-[10px] tracking-[0.3em] uppercase text-lumen-300 shadow-[0_0_36px_rgba(62,207,178,0.2)]">
          −6 m · linha d'água
        </span>
      </div>
      <p className="absolute left-1/2 -translate-x-1/2 bottom-8 w-[min(90vw,34rem)] text-center font-display italic text-mist-400 text-sm leading-relaxed">
        Abaixo da linha d'água, a massa que sustenta a ponta: convergência, frescor, evidência e nascimento.
      </p>
    </div>
  );
}

/* ============================== convergência ============================== */
const NODES = [
  { name: "HUI", tag: "meta-arquitetura", x: 400, y: 52, href: "https://huihho.com", ring: 0 },
  { name: "H2O · WTV", tag: "comércio regenerativo", x: 108, y: 128, href: "https://world-trade-village-k3y7ual.gamma.site/", ring: 0 },
  { name: "Programa Abundância", tag: "bem-estar & acesso", x: 692, y: 120, href: "https://the-abundance-program-ro-00t8hnk.gamma.site/", ring: 0 },
  { name: "CIESSM", tag: "framework", x: 76, y: 308, href: "https://ciessm-framework-xwpqixj.gamma.site/", ring: 1 },
  { name: "Holopolis", tag: "colaboração", x: 724, y: 308, href: "https://holopolis-collaboration-hub.lovable.app/", ring: 1 },
  { name: "Ágoras", tag: "deliberação", x: 200, y: 452, href: "https://agoras.lovable.app/", ring: 2 },
  { name: "ARTE · PRA AMAR & RIR", tag: "interface federada", x: 600, y: 456, href: "https://huihho.com/artepraamarerir", ring: 2 },
];

function Convergence() {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <section className="relative py-24 lg:py-32 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <StratumLabel index="ESTRATO 02" depth="−12 m" name="Convergência" />
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <Reveal>
              <h2 className="font-display font-medium text-mist-50 leading-[1.02] text-4xl sm:text-5xl">
                Ecossistemas que <em className="italic font-light text-lumen-300">convergem</em> sem colapsar.
              </h2>
              <p className="mt-6 text-[15px] text-mist-400 leading-relaxed">
                O ICEBERG não funde instituições: ele registra onde HUI, H2O, Programa Abundância, CIESSM, Holopolis,
                Ágoras e frentes federadas apontam para o mesmo nascimento — cada um preservando identidade, autoridade e
                responsabilidade próprias.
              </p>
              <p className="mt-5 text-[13px] text-mist-500 leading-relaxed border-l-2 border-seam-strong pl-4">
                Passe o cursor pelos nós: cada órbita é uma distância de integração, não uma hierarquia.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-8 overflow-x-auto pb-4">
            <Reveal delay={150}>
              <div className="relative min-w-[620px] aspect-[800/520] rounded-xl border border-seam bg-ink-950/60">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 520" fill="none" preserveAspectRatio="none" aria-hidden="true">
                  {[90, 160, 225].map((r, i) => (
                    <circle
                      key={r}
                      cx="400"
                      cy="256"
                      r={r}
                      stroke={hover !== null && NODES[hover].ring === i ? "rgba(95,227,200,0.5)" : "rgba(95,227,200,0.12)"}
                      strokeWidth="1"
                      strokeDasharray="4 9"
                      className="transition-all duration-500"
                    />
                  ))}
                  {NODES.map((n, i) => (
                    <line
                      key={n.name}
                      x1={n.x}
                      y1={n.y}
                      x2="400"
                      y2="256"
                      stroke={hover === i ? "rgba(233,188,98,0.75)" : "rgba(95,227,200,0.16)"}
                      strokeWidth={hover === i ? 1.4 : 1}
                      strokeDasharray="3 7"
                      className={`transition-all duration-300 ${hover === i ? "anim-dash" : ""}`}
                    />
                  ))}
                </svg>

                <div className="absolute left-1/2 top-[49.2%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="relative grid place-items-center w-24 h-24 rounded-full border border-gild-400/60 bg-ink-900/90 shadow-[0_0_44px_rgba(233,188,98,0.18)]">
                    <span className="pulse-ring absolute inset-0 rounded-full border border-gild-400/40" />
                    <span className="font-display italic text-gild-300 text-[13px] leading-tight px-3">
                      era de crescimento regenerativo
                    </span>
                  </span>
                </div>

                {NODES.map((n, i) => (
                  <a
                    key={n.name}
                    href={n.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${(n.x / 800) * 100}%`, top: `${(n.y / 520) * 100}%` }}
                  >
                    <span
                      className={`block rounded-full border px-4 py-2 backdrop-blur-sm transition-all duration-300 ${
                        hover === i
                          ? "border-gild-400/80 bg-gild-400/10 -translate-y-1 shadow-[0_8px_30px_rgba(233,188,98,0.15)]"
                          : "border-seam-strong bg-ink-900/85"
                      }`}
                    >
                      <span className="block font-mono text-[11px] text-mist-100 whitespace-nowrap">{n.name}</span>
                      <span className="block font-mono text-[8px] tracking-[0.18em] uppercase text-mist-600 mt-0.5 whitespace-nowrap">
                        {n.tag}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================== currentness ============================== */
const FRESHNESS: { item: string; estado: "corrente" | "binding-candidate" | "reservado" | "linhagem"; note: string; date: string; href: string }[] = [
  { item: "Portal canônico · huihho.com", estado: "corrente", note: "readback externo confirma vigência da raiz", date: "2026·01", href: "https://huihho.com" },
  { item: "ICEBERG · aceite de código", estado: "corrente", note: "ACCEPTED CODE no mapa canônico", date: "2025·11", href: "https://huihho.com/iceberg" },
  { item: "HolOmniverse Explorer · holo.", estado: "binding-candidate", note: "experiência em source; runtime próprio separável", date: "2025·12", href: "https://huihho.com/holomniverse/explorer" },
  { item: "knowledge.huihho.com", estado: "reservado", note: "somente conhecimento liberado, com proveniência", date: "—", href: "https://huihho.com/architecture" },
  { item: "Manifestações Lovable · Gamma", estado: "linhagem", note: "presença na constelação ≠ currentness", date: "2024→25", href: "https://huihho.com" },
];

const FRESH_TONE: Record<string, string> = {
  corrente: "text-lumen-300 border-lumen-500/45 bg-lumen-500/5",
  "binding-candidate": "text-gild-300 border-gild-400/45 bg-gild-400/5",
  reservado: "text-mist-400 border-mist-600/50 bg-ink-850",
  linhagem: "text-ember-300 border-ember-400/40 bg-ember-400/5",
};

function Currentness() {
  return (
    <section className="relative py-24 lg:py-32 scroll-mt-20 border-y border-seam bg-ink-950/40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <StratumLabel index="ESTRATO 03" depth="−34 m" name="Currentness" />
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <Reveal>
              <h2 className="font-display font-medium text-mist-50 leading-[1.02] text-4xl sm:text-5xl">
                O que ainda é <em className="italic font-light text-lumen-300">fresco</em> — e o que é linhagem.
              </h2>
              <p className="mt-6 text-[15px] text-mist-400 leading-relaxed">
                Currentness é a disciplina de dizer quando algo vigora. Nenhum item entra no atlas sem data e estado;
                nada que envelheceu é apagado — desce para <span className="text-ember-300">linhagem</span>, onde continua
                legível como arqueologia de intenção.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {Object.entries(FRESH_TONE).map(([k, v]) => (
                  <span key={k} className={`px-3 py-2 rounded border font-mono text-[9px] tracking-[0.16em] uppercase ${v}`}>
                    {k}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <Reveal delay={120}>
              <div className="rounded-xl border border-seam overflow-hidden bg-ink-900/60">
                <div className="grid grid-cols-12 gap-3 px-6 py-3.5 border-b border-seam bg-ink-850/80 font-mono text-[9px] tracking-[0.24em] uppercase text-mist-600">
                  <span className="col-span-5">item</span>
                  <span className="col-span-3">estado</span>
                  <span className="col-span-2">frescor</span>
                  <span className="col-span-2 text-right">origem</span>
                </div>
                {FRESHNESS.map((f, i) => (
                  <a
                    key={f.item}
                    href={f.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group grid grid-cols-12 gap-3 items-center px-6 py-5 border-b border-seam last:border-0 transition-all duration-300 hover:bg-ink-850/70 hover:pl-8"
                    style={{ transitionDelay: `${i * 15}ms` }}
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <p className="text-sm text-mist-100 font-medium group-hover:text-lumen-300 transition-colors duration-300">{f.item}</p>
                      <p className="text-[11px] text-mist-600 mt-1">{f.note}</p>
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <span className={`px-2.5 py-1 rounded-full border font-mono text-[9px] tracking-[0.12em] uppercase ${FRESH_TONE[f.estado]}`}>
                        {f.estado}
                      </span>
                    </div>
                    <div className="col-span-3 sm:col-span-2 font-mono text-[12px] text-mist-400 tabular-nums">{f.date}</div>
                    <div className="col-span-4 sm:col-span-2 text-right">
                      <svg viewBox="0 0 20 12" className="inline-block w-4 h-2.5 text-lumen-400 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="M1 6h16M12 1.5 17 6l-5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </Reveal>
            <Reveal delay={260}>
              <p className="mt-5 font-mono text-[10px] tracking-[0.14em] uppercase text-mist-600">
                regra · corrente = publicado + lido de volta externamente; nada é corrente por decreto interno
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================== evidência (escada interativa) ============================== */
const LADDER = [
  { rung: "visão", def: "Intenção e direção declaradas publicamente. É o ponto de partida legítimo — mas nunca é prova.", ice: "A tese do ICEBERG nasceu aqui: convergência como evento, não como fusão." },
  { rung: "desenho", def: "Arquitetura, vocabulário e rotas desenhadas para sustentar a visão com distinções operáveis.", ice: "Rotas /iceberg, estados epistêmicos e a gramática ROOT→PROVENANCE." },
  { rung: "representação", def: "A visão torna-se navegável: páginas, mapas e experiências que a apresentam sem afirmá-la como fato.", ice: "Este atlas é uma representação local — fiel ao desenho, sem pretender vigência institucional." },
  { rung: "corroboração", def: "Sinais independentes começam a apontar na mesma direção, sem que ainda constituam prova formal.", ice: "Manifestações públicas repetidas (Lovable, Gamma) ecoando a mesma ontologia." },
  { rung: "verificação", def: "Checagem explícita contra fonte e destino: o que está em source corresponde ao que está publicado?", ice: "Readback do portal canônico e conferência de rotas, estados e contratos públicos." },
  { rung: "aprovação", def: "Aceite deliberado por quem detém autoridade sobre o domínio — registrado, datado e visível.", ice: "O ICEBERG carrega ACCEPTED CODE: aceite registrado no mapa canônico do portal." },
  { rung: "vigência", def: "Estado vivo: publicado, lido de volta, corrente. Vigência se perde — e se renova — com o tempo.", ice: "Vigência atual; este atlas existe para mantê-la auditável camada a camada." },
];

function Evidence() {
  const [sel, setSel] = useState(5);
  return (
    <section className="relative py-24 lg:py-32 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <StratumLabel index="ESTRATO 04" depth="−60 m" name="Evidência" />
        <div className="grid lg:grid-cols-12 gap-14">
          <div className="lg:col-span-5">
            <Reveal>
              <h2 className="font-display font-medium text-mist-50 leading-[1.02] text-4xl sm:text-5xl">
                Sete degraus entre <em className="italic font-light text-lumen-300">ver</em> e{" "}
                <em className="italic font-light text-gild-300">viger</em>.
              </h2>
              <p className="mt-6 text-[15px] text-mist-400 leading-relaxed">
                A HUI distingue visão, desenho, representação, corroboração, verificação, aprovação e vigência — e cada
                alegação do atlas declara em qual degrau está. Toque nos degraus para subir e descer a escada.
              </p>
            </Reveal>

            <Reveal delay={160}>
              <ol className="mt-10 space-y-1.5">
                {LADDER.map((l, i) => {
                  const isSel = sel === i;
                  return (
                    <li key={l.rung} style={{ paddingLeft: `${(7 - i) * 14}px` }}>
                      <button
                        onClick={() => setSel(i)}
                        aria-pressed={isSel}
                        className={`group w-full text-left flex items-center gap-4 rounded-lg border px-5 py-3.5 transition-all duration-300 ${
                          isSel
                            ? "border-gild-400/70 bg-gild-400/10 shadow-[0_0_28px_rgba(233,188,98,0.12)]"
                            : "border-seam bg-ink-900/50 hover:border-seam-strong hover:bg-ink-850"
                        }`}
                      >
                        <span className={`font-mono text-[10px] tabular-nums ${isSel ? "text-gild-300" : "text-mist-600"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className={`font-display text-lg sm:text-xl transition-colors duration-300 ${isSel ? "text-gild-300" : "text-mist-300 group-hover:text-mist-100"}`}>
                          {l.rung}
                        </span>
                        <span className={`ml-auto transition-transform duration-300 ${isSel ? "translate-x-0 text-gild-300" : "-translate-x-1 opacity-0 group-hover:opacity-60 group-hover:translate-x-0 text-mist-500"}`}>
                          ◆
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-28">
              <Reveal delay={220}>
                <div className="relative rounded-xl border border-seam-strong bg-gradient-to-b from-ink-850 to-ink-900 p-8 sm:p-10 overflow-hidden">
                  <span className="absolute -right-6 -top-14 font-display font-light text-[11rem] leading-none select-none pointer-events-none" style={{ color: "rgba(233,188,98,0.06)" }} aria-hidden="true">
                    {String(sel + 1).padStart(2, "0")}
                  </span>
                  <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-mist-600">degrau {sel + 1} de 7</p>
                  <h3 className="font-display text-4xl sm:text-5xl font-medium text-mist-50 mt-4 capitalize">{LADDER[sel].rung}</h3>
                  <p className="mt-6 text-[15px] text-mist-300 leading-relaxed max-w-lg">{LADDER[sel].def}</p>
                  <div className="mt-8 pt-6 border-t border-seam">
                    <p className="font-mono text-[9px] tracking-[0.26em] uppercase text-lumen-400 mb-3">onde o ICEBERG está</p>
                    <p className="text-sm text-mist-300 leading-relaxed">{LADDER[sel].ice}</p>
                  </div>
                  <div className="mt-8 flex gap-1.5" aria-hidden="true">
                    {LADDER.map((_, i) => (
                      <span key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= sel ? "bg-gild-400" : "bg-ink-700"}`} />
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================== ontogênese / camadas progressivas ============================== */
function Ontogenesis() {
  return (
    <section className="relative py-24 lg:py-32 scroll-mt-20 border-y border-seam bg-ink-950/40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <StratumLabel index="ESTRATO 05" depth="−92 m" name="Camadas progressivas" />
        <Reveal>
          <h2 className="font-display font-medium text-mist-50 leading-[1.02] text-4xl sm:text-5xl max-w-3xl">
            O que a convergência <em className="italic font-light text-lumen-300">deu à luz</em> — registro de nascimento.
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-6 max-w-2xl text-[15px] text-mist-400 leading-relaxed">
            Camadas progressivas significam profundidade sem perda de identidade: cada manifestação abaixo é um estrato
            sedimentado do mesmo evento ontogônico, datado e vinculável — sem que presença declare currentness,
            aprovação ou incorporação institucional.
          </p>
        </Reveal>

        <div className="relative mt-14">
          <span className="absolute left-[7px] sm:left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-lumen-500/50 via-seam-strong to-gild-400/40" aria-hidden="true" />
          <ol className="grid sm:grid-cols-2 gap-x-10 gap-y-4">
            {MANIFESTATIONS.map((m, i) => (
              <Reveal key={m.name} as="li" delay={Math.min(i * 60, 360)} className="relative pl-8">
                <span className="absolute left-0 top-6 w-[15px] h-[15px] rounded-full border border-lumen-500/60 bg-ink-950 grid place-items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-lumen-400" />
                </span>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block h-full rounded-lg border border-seam bg-ink-900/60 p-5 transition-all duration-300 hover:border-lumen-500/45 hover:bg-ink-850 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-gild-300/90">{m.source}</span>
                    <span className="px-2 py-0.5 rounded-full border border-seam font-mono text-[8px] uppercase tracking-[0.14em] text-mist-500 truncate max-w-[55%] text-right">
                      {m.area}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-medium text-mist-50 mt-3 group-hover:text-lumen-300 transition-colors duration-300">
                    {m.name}
                  </h3>
                </a>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal delay={200} className="mt-10">
          <div className="rounded-lg border border-gild-400/40 bg-gild-400/5 px-6 py-5">
            <p className="font-mono text-[9px] tracking-[0.26em] uppercase text-gild-300 mb-2.5">regra de leitura</p>
            <p className="text-sm text-mist-300 leading-relaxed">
              Presença nesta camada = evidência de manifestação/intenção pública. Não equivale a aprovação, currentness,
              propriedade institucional, integração operacional ou verificação factual.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================== o leito ============================== */
function Seabed() {
  const trail = ["ROOT", "DOMAIN", "TOPIC", "PROVENANCE"];
  const goTop = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  return (
    <section className="relative py-28 lg:py-40 scroll-mt-20">
      <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center">
        <Reveal>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-mist-600">ESTRATO 06 · −140 m · O leito</p>
        </Reveal>
        <Reveal delay={120}>
          <h2 className="font-display font-medium text-mist-50 leading-[1.05] text-4xl sm:text-6xl mt-6">
            No fundo de tudo, <em className="italic font-light text-lumen-300">proveniência</em>.
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {trail.map((t, i) => (
              <span key={t} className="flex items-center gap-2 sm:gap-3">
                <span className={`px-4 py-2 rounded-full border font-mono text-[10px] tracking-[0.22em] transition-colors duration-500 ${i === trail.length - 1 ? "border-gild-400/70 text-gild-300 bg-gild-400/5" : "border-seam-strong text-lumen-300/90 bg-ink-900/70"}`}>
                  {t}
                </span>
                {i < trail.length - 1 && (
                  <svg viewBox="0 0 20 12" className="w-4 h-2.5 text-mist-600" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M1 6h16M12 1.5 17 6l-5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={280}>
          <p className="mt-9 max-w-2xl mx-auto text-[15px] text-mist-400 leading-relaxed">
            Toda camada deste atlas aponta de volta à raiz: <span className="font-mono text-lumen-300 text-[13px]">huihho.com</span>.
            Identidade, autoridade e responsabilidade permanecem distinguíveis em cada profundidade — a descida termina
            onde a custódia começa.
          </p>
        </Reveal>
        <Reveal delay={360}>
          <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={goTop}
              className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-full border border-lumen-500/60 text-lumen-300 font-mono text-[11px] tracking-[0.22em] uppercase transition-all duration-300 hover:bg-lumen-500/10 hover:shadow-[0_0_30px_rgba(62,207,178,0.25)]"
            >
              <svg viewBox="0 0 12 20" className="w-2.5 h-4 transition-transform duration-300 group-hover:-translate-y-1" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M6 19V3M1.5 7.5 6 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Emergir à superfície
            </button>
            <a
              href="#/"
              className="px-6 py-3.5 rounded-full border border-seam-strong text-mist-300 font-mono text-[11px] tracking-[0.22em] uppercase transition-all duration-300 hover:border-gild-400/70 hover:text-gild-300"
            >
              ← Portal canônico
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================== página ============================== */
export default function IcebergAtlas() {
  const { depth, active, submerged, progress, refs } = useDepth();
  const depthRef = useRef(0);
  depthRef.current = depth;

  useEffect(() => {
    const prev = document.title;
    document.title = "ICEBERG · Atlas profundo — HUI";
    return () => {
      document.title = prev;
    };
  }, []);

  const setRef = (id: StratumId) => (el: HTMLElement | null) => {
    refs.current[id] = el;
  };

  const strataProps = useMemo(
    () =>
      Object.fromEntries(STRATA.map((s) => [s.id, { ref: setRef(s.id) }])) as Record<
        StratumId,
        { ref: (el: HTMLElement | null) => void }
      >,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const abyssOpacity = Math.max(0, Math.min(1, (progress - 0.55) / 0.45));

  return (
    <div className="relative min-h-screen text-mist-200 font-body">
      {/* fundos em camadas */}
      <div className="fixed inset-0 z-0 transition-opacity duration-1000" style={{ opacity: submerged ? 0 : 1, background: "linear-gradient(180deg, #143a48 0%, #0d2531 45%, #0a1f29 100%)" }} aria-hidden="true" />
      <div className="fixed inset-0 z-0 transition-opacity duration-1000" style={{ opacity: submerged ? 1 : 0, background: "linear-gradient(180deg, #0a1f29 0%, #071820 55%, #050e13 100%)" }} aria-hidden="true" />
      <div className="fixed inset-0 z-0 transition-opacity duration-700 pointer-events-none" style={{ opacity: abyssOpacity, background: "radial-gradient(ellipse 120% 90% at 50% 110%, rgba(2,7,10,0.95) 20%, transparent 70%)" }} aria-hidden="true" />
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: submerged ? 0 : 0.5, background: "radial-gradient(ellipse 70% 45% at 50% -5%, rgba(143,240,221,0.14) 0%, transparent 65%)" }} aria-hidden="true" />

      <div className="noise-overlay" aria-hidden="true" />
      <DepthField depthRef={depthRef} />

      {/* barra superior */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-seam bg-ink-950/75 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
          <a href="#/" className="group flex items-center gap-2.5 font-mono text-[11px] tracking-[0.14em] text-mist-400 transition-colors duration-300 hover:text-lumen-300">
            <svg viewBox="0 0 20 12" className="w-4 h-2.5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M19 6H3M8 1.5 3 6l5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            portal canônico
          </a>
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-lg text-mist-50 tracking-wide">ICEBERG</span>
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full border border-lumen-500/50 font-mono text-[9px] tracking-[0.18em] text-lumen-300 bg-lumen-500/5">
              ACCEPTED CODE
            </span>
          </div>
          <p className="font-mono text-sm text-lumen-300 tabular-nums lg:hidden" aria-hidden="true">
            −{String(depth).padStart(3, "0")} m
          </p>
        </div>
      </header>

      <DepthGauge depth={depth} active={active} submerged={submerged} progress={progress} />

      <main className="relative z-10">
        <div {...strataProps.ponta}>
          <Opening />
        </div>
        <Waterline />
        <div {...strataProps.convergencia}>
          <Convergence />
        </div>
        <div {...strataProps.currentness}>
          <Currentness />
        </div>
        <div {...strataProps.evidencia}>
          <Evidence />
        </div>
        <div {...strataProps.ontogenese}>
          <Ontogenesis />
        </div>
        <div {...strataProps.leito}>
          <Seabed />
        </div>
      </main>

      <footer className="relative z-10 border-t border-seam bg-ink-950/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-8 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-mist-600">
            HUI · Humanity United International — building block local do atlas ICEBERG
          </p>
          <a
            href={href("/iceberg")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-[0.14em] text-lumen-400/90 hover:text-lumen-300 transition-colors duration-300"
          >
            huihho.com/iceberg ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
