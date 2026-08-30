/* ------------------------------------------------------------------ */
/*  Estratos do atlas · registry-driven + inspector-aware (P4)         */
/*  select → inspect → understand → open permitted destination         */
/* ------------------------------------------------------------------ */

import { useState, type ReactNode } from "react";
import { Reveal, Scramble } from "../motion";
import {
  CURRENTNESS_LABEL,
  EVIDENCE_RUNGS,
  LIFECYCLE_LABEL,
  SOURCE_CLASS_LABEL,
  SAFE_REL,
  type BuildingBlockRecord,
} from "../registry/model";
import { REGISTRY_META } from "../registry/queries";
import { useInspector, LifecycleChip, RungChip } from "../registry/Inspector";
import { ICE, CONVERGENCE_NODES, CONVERGENCE_CORE, ledgerRows, ontogenesisTimeline, RUNG_MEANINGS } from "./atlasData";

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-lumen-400/90 flex items-center gap-3">
      <span className="w-8 h-px bg-lumen-500/50" aria-hidden="true" />
      {children}
    </p>
  );
}

function Title({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-mist-50 leading-[1.05] mt-5">{children}</h2>;
}

function InspectButton({ record, children }: { record: BuildingBlockRecord; children: ReactNode }) {
  const { open } = useInspector();
  return (
    <button onClick={() => open(record)} className="group inline-flex items-center gap-2.5 text-left cursor-pointer focus-ring rounded">
      {children}
    </button>
  );
}

/* ================= estrato 01 · abertura ================= */
export function OpeningStratum() {
  const { open } = useInspector();
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-12 gap-12 items-center w-full">
        <div className="lg:col-span-7 relative z-10">
          <Kicker>
            ontogênese · estrato 01 · a ponta
            <button onClick={() => open(ICE)} className="cursor-pointer focus-ring rounded" aria-label="Inspecionar registro ICEBERG">
              <LifecycleChip lifecycle={ICE.lifecycle} />
            </button>
          </Kicker>
          <h1 className="font-display font-medium text-mist-50 leading-[0.95] mt-6 text-[clamp(3.4rem,10vw,7.5rem)]">
            <Scramble text="ICEBERG" />
          </h1>
          <p className="font-mono text-[11px] sm:text-xs tracking-[0.18em] uppercase text-mist-400 mt-6 max-w-2xl leading-relaxed">
            <span className="text-gild-300">I</span>nternational <span className="text-gild-300">C</span>onvergence of{" "}
            <span className="text-gild-300">E</span>cosystems <span className="text-gild-300">G</span>iving Birth to an Era of{" "}
            <span className="text-gild-300">R</span>egenerative <span className="text-gild-300">G</span>rowth
          </p>
          <Reveal delay={150}>
            <p className="text-mist-300 text-base sm:text-lg leading-relaxed mt-7 max-w-xl">{ICE.description}</p>
          </Reveal>
          <Reveal delay={250} className="flex flex-wrap items-center gap-3 mt-8">
            <RungChip rung={ICE.evidence.rung} />
            <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-mist-500">
              aceito em source ≠ runtime ao vivo · estado completo no inspector
            </span>
          </Reveal>
          <Reveal delay={350} className="flex flex-wrap gap-4 mt-10">
            <a
              href="#convergencia"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("convergencia")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-md border border-lumen-500/60 bg-lumen-500/10 text-lumen-300 font-mono text-[11px] tracking-[0.2em] uppercase hover:bg-lumen-500/20 transition-all duration-300 focus-ring"
            >
              iniciar descida
              <svg viewBox="0 0 12 20" className="w-3 h-5 transition-transform duration-300 group-hover:translate-y-1" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M6 1v16M1.5 12 6 17l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <button
              onClick={() => open(ICE)}
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-md border border-seam-strong text-mist-300 font-mono text-[11px] tracking-[0.2em] uppercase hover:border-lumen-500/50 hover:text-lumen-300 transition-colors cursor-pointer focus-ring"
            >
              inspecionar registro
            </button>
            <a href="#/" className="inline-flex items-center gap-3 px-6 py-3.5 rounded-md font-mono text-[11px] tracking-[0.2em] uppercase text-mist-500 hover:text-mist-200 transition-colors focus-ring">
              ← portal
            </a>
          </Reveal>
        </div>

        <div className="lg:col-span-5 relative z-10">
          <Reveal delay={200}>
            <div className="rounded-xl border border-seam bg-ink-900/70 p-7 space-y-5">
              <p className="font-mono text-[9px] tracking-[0.26em] uppercase text-mist-600">registro · fonte primária</p>
              {ICE.sourceRefs.map((s) => (
                <div key={s.id} className="border-l-2 border-lumen-500/40 pl-4">
                  <p className="font-mono text-[11px] text-mist-200">{s.label}</p>
                  <p className="font-mono text-[9px] text-mist-600 mt-1">
                    {SOURCE_CLASS_LABEL[s.sourceClass]} · obs. {s.observedAt}
                    {s.sha && <span className="text-gild-300/80"> · sha {s.sha.slice(0, 7)}</span>}
                  </p>
                  <p className="text-[12px] text-mist-400 italic mt-2 leading-relaxed">{s.whyWeBelieveThis}</p>
                </div>
              ))}
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ember-300/90 border-t border-seam pt-4">
                PROTOTYPE ≠ PRODUCTION · leitura externa do destino ainda pendente
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ================= linha d'água ================= */
export function WaveDivider() {
  return (
    <div className="relative -my-px" aria-hidden="true">
      <svg viewBox="0 0 1440 90" className="w-full h-[70px] sm:h-[90px] block" preserveAspectRatio="none">
        <path d="M0,50 C240,90 480,10 720,50 C960,90 1200,10 1440,50 L1440,90 L0,90 Z" fill="#082028" opacity="0.85" />
        <path className="anim-wave" d="M0,52 C240,92 480,12 720,52 C960,92 1200,12 1440,52" fill="none" stroke="#5fe3c8" strokeOpacity="0.4" strokeWidth="1.4" />
        <path className="anim-wave-rev" d="M0,46 C240,86 480,6 720,46 C960,86 1200,6 1440,46" fill="none" stroke="#8ff0dd" strokeOpacity="0.18" strokeWidth="1" />
      </svg>
      <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-mono text-[10px] tracking-[0.4em] uppercase text-lumen-300/90 pointer-events-none">
        linha d'água · −6 m
      </p>
    </div>
  );
}

/* ================= estrato 02 · convergência ================= */
export function ConvergenceStratum() {
  const { open } = useInspector();
  const [hovered, setHovered] = useState<string | null>(null);
  const cx = 280;
  const cy = 280;
  const pos = (n: (typeof CONVERGENCE_NODES)[number]) => {
    const r = n.ring === 0 ? 118 : 182;
    const a = (n.angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  return (
    <section id="convergencia" className="relative py-24 lg:py-32 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Kicker>estrato 02 · convergência</Kicker>
        <Title>
          Sete ecossistemas, <span className="italic font-light text-lumen-300">um nascimento.</span>
        </Title>
        <Reveal delay={120}>
          <p className="text-mist-400 max-w-2xl mt-6 leading-relaxed">
            Selecione um nó para <span className="text-mist-200">inspecionar o registro</span> — identidade, fonte, currentness e
            proveniência — antes de abrir qualquer destino permitido. Selecionar não é endossar:{" "}
            <span className="font-mono text-[11px] text-lumen-400/90">PRESENCE ≠ CURRENTNESS · RELATIONSHIP ≠ IDENTITY</span>.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-12 gap-12 mt-14 items-center">
          {/* diagrama orbital */}
          <Reveal className="lg:col-span-7">
            <svg viewBox="0 0 560 560" className="w-full max-w-[560px] mx-auto" role="group" aria-label="Diagrama da convergência ICEBERG">
              <circle cx={cx} cy={cy} r={118} fill="none" stroke="rgba(95,227,200,0.14)" strokeDasharray="3 7" className="anim-spin-slow" />
              <circle cx={cx} cy={cy} r={182} fill="none" stroke="rgba(95,227,200,0.1)" strokeDasharray="2 9" className="anim-spin-rev" />
              <circle className="pulse-ring" cx={cx} cy={cy} r={64} fill="none" stroke="rgba(233,188,98,0.35)" strokeWidth="1" />

              {/* conexões */}
              {CONVERGENCE_NODES.map((n) => {
                const p = pos(n);
                return <line key={`l-${n.record.id}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(95,227,200,0.12)" strokeWidth="1" />;
              })}

              {/* núcleo */}
              <g
                role="button"
                tabIndex={0}
                aria-label={`Núcleo: ${CONVERGENCE_CORE.canonicalName} — inspecionar`}
                className="group cursor-pointer outline-none"
                onClick={() => open(CONVERGENCE_CORE)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open(CONVERGENCE_CORE);
                  }
                }}
              >
                <circle cx={cx} cy={cy} r={62} fill="rgba(233,188,98,0.07)" stroke="rgba(233,188,98,0.55)" strokeWidth="1.2" />
                <circle cx={cx} cy={cy} r={62} fill="none" stroke="rgba(143,240,221,0.7)" strokeWidth="2" className="opacity-0 group-focus-visible:opacity-100" />
                <text x={cx} y={cy - 6} textAnchor="middle" className="fill-[#f3d289]" style={{ font: "600 15px Fraunces, serif" }}>
                  era de crescimento
                </text>
                <text x={cx} y={cy + 14} textAnchor="middle" className="fill-[#f3d289]" style={{ font: "600 15px Fraunces, serif" }}>
                  regenerativo
                </text>
              </g>

              {/* nós */}
              {CONVERGENCE_NODES.map((n) => {
                const p = pos(n);
                const active = hovered === n.record.id;
                return (
                  <g
                    key={n.record.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${n.record.canonicalName} (${LIFECYCLE_LABEL[n.record.lifecycle]}) — inspecionar`}
                    className="group cursor-pointer outline-none"
                    onMouseEnter={() => setHovered(n.record.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(n.record.id)}
                    onBlur={() => setHovered(null)}
                    onClick={() => open(n.record)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        open(n.record);
                      }
                    }}
                  >
                    <circle cx={p.x} cy={p.y} r={active ? 26 : 22} fill="rgba(13,37,49,0.9)" stroke={active ? "rgba(143,240,221,0.9)" : "rgba(95,227,200,0.35)"} strokeWidth="1.2" className="transition-all duration-300" />
                    <circle cx={p.x} cy={p.y} r={26} fill="none" stroke="rgba(143,240,221,0.8)" strokeWidth="2" className="opacity-0 group-focus-visible:opacity-100" />
                    <text x={p.x} y={p.y + 4} textAnchor="middle" className="transition-colors duration-300" style={{ font: "500 10.5px 'JetBrains Mono', monospace", fill: active ? "#8ff0dd" : "#a7c2bf" }}>
                      {shortName(n.record.canonicalName)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </Reveal>

          {/* equivalente em lista — teclado & leitores de tela */}
          <div className="lg:col-span-5">
            <Reveal delay={150}>
              <p className="font-mono text-[9px] tracking-[0.26em] uppercase text-mist-600 mb-4">índice navegável da convergência</p>
            </Reveal>
            <ul className="space-y-2.5">
              {[{ record: CONVERGENCE_CORE }, ...CONVERGENCE_NODES].map((n, i) => (
                <Reveal as="li" key={n.record.id} delay={Math.min(i * 70, 420)}>
                  <InspectButton record={n.record}>
                    <span className="grid place-items-center w-9 h-9 rounded-full border border-seam-strong font-mono text-[10px] text-lumen-300 group-hover:border-lumen-500/60 transition-colors shrink-0">
                      {String(i).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] text-mist-100 group-hover:text-lumen-300 transition-colors truncate">
                        {n.record.canonicalName}
                      </span>
                      <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-mist-600 mt-0.5">
                        {n.record.family} · {LIFECYCLE_LABEL[n.record.lifecycle]}
                      </span>
                    </span>
                  </InspectButton>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={300}>
              <p className="mt-6 font-mono text-[10px] text-mist-600 leading-relaxed">
                CONVERGENCE ≠ INSTITUTIONAL_COLLAPSE — cada identidade permanece distinta, nomeada e inspecionável.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function shortName(name: string): string {
  if (name.length <= 16) return name;
  const words = name.split(/[\s—·-]+/).filter(Boolean);
  return words.slice(0, 2).join(" ").slice(0, 16);
}

/* ================= estrato 03 · currentness ================= */
export function CurrentnessStratum() {
  const rows = ledgerRows();
  return (
    <section className="relative py-24 lg:py-32 scroll-mt-20 border-y border-seam bg-ink-950/40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Kicker>estrato 03 · currentness</Kicker>
        <Title>
          O que está fresco — <span className="italic font-light text-lumen-300">e o que declara ser.</span>
        </Title>
        <Reveal delay={120}>
          <p className="text-mist-400 max-w-2xl mt-6 leading-relaxed">
            Cada linha vem do <span className="text-mist-200">registry</span>, não de texto decorativo: o estado mostrado é o estado
            registrado, com fonte e observação. Este protótipo <span className="text-ember-300">não declara ser o portal canônico</span>{" "}
            — é referência de rota e evidência pública de engenharia.
          </p>
        </Reveal>

        <div className="mt-14 border-t border-seam">
          {rows.map((r, i) => (
            <Reveal key={r.id} delay={Math.min(i * 80, 400)}>
              <InspectButton record={r}>
                <div className="group w-full grid md:grid-cols-12 gap-3 md:gap-6 items-center py-5 border-b border-seam text-left transition-all duration-300 hover:bg-ink-900/70 hover:pl-3">
                  <div className="md:col-span-4 flex items-center gap-3">
                    <span className="grid place-items-center w-8 h-8 rounded-full border border-seam font-mono text-[10px] text-mist-500 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] text-mist-100 group-hover:text-lumen-300 transition-colors truncate">{r.canonicalName}</p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist-600">{r.currentness} · {r.kind}</p>
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <LifecycleChip lifecycle={r.lifecycle} />
                  </div>
                  <p className="md:col-span-4 text-[12px] text-mist-500 leading-relaxed line-clamp-2">{r.evidence.basis}</p>
                  <p className="md:col-span-1 font-mono text-[10px] text-mist-600 text-right">
                    obs. {r.sourceRefs[0]?.observedAt ?? "—"}
                  </p>
                </div>
              </InspectButton>
            </Reveal>
          ))}
        </div>

        <Reveal delay={250} className="mt-10">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="rounded-lg border border-lumen-500/30 bg-lumen-500/5 p-6">
              <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-lumen-400 mb-3">regra de readback</p>
              <p className="text-sm text-mist-300 leading-relaxed">
                LIVE somente após deploy autenticado <span className="text-mist-100">e</span> leitura externa do destino. Nada aqui
                reivindica vigência por aparência.
              </p>
            </div>
            <div className="rounded-lg border border-gild-400/30 bg-gild-400/5 p-6">
              <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-gild-400 mb-3">regra de retenção</p>
              <p className="text-sm text-mist-300 leading-relaxed">
                HISTORICAL ≠ OBSOLETE · HELD ≠ REJECTED — linhas antigas permanecem visíveis com rótulo verdadeiro e valor declarado.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= estrato 04 · evidência ================= */
export function EvidenceStratum() {
  const { open } = useInspector();
  const [rung, setRung] = useState(ICE.evidence.rung);
  return (
    <section className="relative py-24 lg:py-32 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Kicker>estrato 04 · evidência</Kicker>
        <Title>
          A escada não é <span className="italic font-light text-lumen-300">decoração.</span>
        </Title>
        <Reveal delay={120}>
          <p className="text-mist-400 max-w-2xl mt-6 leading-relaxed">
            A mesma escada governante do portal — visão → vigência — sem redefinição. ICEBERG está registrado no degrau{" "}
            <span className="font-mono text-lumen-300">{ICE.evidence.rung} · {EVIDENCE_RUNGS[ICE.evidence.rung]}</span>. Toque num degrau.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-12 gap-12 mt-14">
          <div className="lg:col-span-6">
            <ol className="space-y-2" aria-label="Escada de evidência interativa">
              {EVIDENCE_RUNGS.map((name, i) => (
                <li key={name}>
                  <button
                    onClick={() => setRung(i)}
                    aria-pressed={rung === i}
                    className={`w-full flex items-center gap-4 rounded-lg border px-5 py-3.5 text-left transition-all duration-200 cursor-pointer focus-ring ${
                      rung === i
                        ? "border-lumen-500/60 bg-lumen-500/10 shadow-[0_0_28px_rgba(62,207,178,0.15)]"
                        : "border-seam bg-ink-900/50 hover:border-seam-strong"
                    }`}
                  >
                    <span className={`font-display text-2xl w-8 ${rung === i ? "text-lumen-300" : "text-mist-600"}`}>{i}</span>
                    <span className={`flex-1 ${rung === i ? "text-lumen-300" : "text-mist-300"}`}>{name}</span>
                    {i === ICE.evidence.rung && (
                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-gild-300 border border-gild-400/40 rounded-full px-2.5 py-1">
                        ICEBERG está aqui
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-6">
            <Reveal key={rung}>
              <div className="lg:sticky lg:top-28 rounded-xl border border-seam-strong bg-ink-900/70 p-8">
                <p className="font-mono text-[9px] tracking-[0.26em] uppercase text-mist-600">degrau {rung}</p>
                <p className="font-display text-4xl font-medium text-mist-50 mt-3">{EVIDENCE_RUNGS[rung]}</p>
                <p className="text-mist-300 leading-relaxed mt-5">{RUNG_MEANINGS[rung]}</p>
                <div className="mt-7 border-t border-seam pt-6 space-y-3">
                  <p className="font-mono text-[10px] text-mist-500">
                    estado registrado de ICEBERG: <span className="text-lumen-300">{EVIDENCE_RUNGS[ICE.evidence.rung]}</span>
                  </p>
                  <p className="text-[13px] text-mist-400 italic leading-relaxed">base: {ICE.evidence.basis}</p>
                </div>
                <button
                  onClick={() => open(ICE)}
                  className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-md border border-lumen-500/50 bg-lumen-500/10 text-lumen-300 font-mono text-[10px] tracking-[0.18em] uppercase hover:bg-lumen-500/20 transition-colors cursor-pointer focus-ring"
                >
                  inspecionar registro completo
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= estrato 05 · ontogênese / camadas progressivas ================= */
export function OntogenesisStratum() {
  const { open } = useInspector();
  const items = ontogenesisTimeline();
  return (
    <section className="relative py-24 lg:py-32 scroll-mt-20 border-y border-seam bg-ink-950/40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Kicker>estrato 05 · camadas progressivas</Kicker>
        <Title>
          O registro de <span className="italic font-light text-lumen-300">nascimento.</span>
        </Title>
        <Reveal delay={120}>
          <p className="text-mist-400 max-w-2xl mt-6 leading-relaxed">
            Manifestações públicas da constelação, derivadas do registry. Presença aqui = evidência de manifestação/intenção pública —
            não aprovação, currentness ou incorporação institucional.
          </p>
        </Reveal>

        <div className="relative mt-14">
          <span className="absolute left-[15px] sm:left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-lumen-500/50 via-seam-strong to-transparent" aria-hidden="true" />
          <ol className="space-y-4">
            {items.map((m, i) => (
              <Reveal as="li" key={m.id} delay={Math.min(i * 60, 360)} className="relative pl-12 sm:pl-16">
                <span className="absolute left-0 sm:left-1 top-4 grid place-items-center w-8 h-8 rounded-full border border-lumen-500/40 bg-ink-950 font-mono text-[9px] text-lumen-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="group rounded-lg border border-seam bg-ink-900/60 p-5 sm:p-6 transition-all duration-300 hover:border-lumen-500/40 hover:-translate-y-0.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-gild-300/90">
                      {SOURCE_CLASS_LABEL[m.sourceRefs[0]?.sourceClass ?? "historical-record"]} · obs. {m.sourceRefs[0]?.observedAt ?? "—"}
                    </p>
                    <LifecycleChip lifecycle={m.lifecycle} />
                  </div>
                  <div className="flex items-end justify-between gap-4 flex-wrap mt-3">
                    <button onClick={() => open(m)} className="font-display text-xl sm:text-2xl font-medium text-mist-50 hover:text-lumen-300 transition-colors cursor-pointer focus-ring rounded text-left">
                      {m.canonicalName}
                    </button>
                    {m.externalUrl && (
                      <a href={m.externalUrl} target="_blank" rel={SAFE_REL} className="font-mono text-[10px] tracking-[0.14em] uppercase text-mist-500 hover:text-lumen-300 transition-colors focus-ring rounded">
                        destino público ↗
                      </a>
                    )}
                  </div>
                  <p className="text-[13px] text-mist-500 leading-relaxed mt-3 max-w-3xl">{m.description}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal delay={200} className="mt-10">
          <p className="rounded-lg border border-seam bg-ink-950/60 px-6 py-5 text-[13px] text-mist-400 leading-relaxed">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-lumen-400">regra de leitura · </span>
            cada item abre o inspector com fonte, linhagem e valor de continuidade. Nada é invisível por ser antigo; nada é corrente por
            estar presente.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= estrato 06 · o leito ================= */
export function SeabedStratum() {
  const { open } = useInspector();
  const trail = ["ROOT", "DOMAIN", "TOPIC", "PROVENANCE"];
  return (
    <section className="relative py-28 lg:py-40 scroll-mt-20">
      <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center">
        <Kicker>estrato 06 · o leito</Kicker>
        <Title>
          −140 m · <span className="italic font-light text-lumen-300">proveniência.</span>
        </Title>
        <Reveal delay={150}>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-10" aria-label="Trilha de proveniência">
            {trail.map((t, i) => (
              <span key={t} className="flex items-center gap-3">
                <span className="px-4 py-2 rounded-full border border-lumen-500/40 font-mono text-[10px] tracking-[0.24em] text-lumen-300">{t}</span>
                {i < trail.length - 1 && (
                  <svg viewBox="0 0 20 12" className="w-4 h-2.5 text-mist-600" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M1 6h16M12 1.5 17 6l-5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={250}>
          <p className="text-mist-400 leading-relaxed mt-10 max-w-2xl mx-auto">
            O leito não é fim: é onde identidade, fonte e estado ficam depositados para a próxima descida. Snapshot ativo:{" "}
            <span className="font-mono text-[11px] text-mist-300">{REGISTRY_META.source}</span> ·{" "}
            <span className="font-mono text-[11px] text-gild-300/90">sha {REGISTRY_META.sha?.slice(0, 12)}</span>
          </p>
        </Reveal>
        <Reveal delay={350} className="flex flex-wrap justify-center gap-4 mt-12">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-md border border-lumen-500/60 bg-lumen-500/10 text-lumen-300 font-mono text-[11px] tracking-[0.2em] uppercase hover:bg-lumen-500/20 transition-colors cursor-pointer focus-ring"
          >
            <svg viewBox="0 0 12 20" className="w-3 h-5 transition-transform duration-300 group-hover:-translate-y-1" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 19V3M1.5 8 6 3l4.5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            emergir
          </button>
          <a href="#/registry" className="inline-flex items-center px-6 py-3.5 rounded-md border border-seam-strong text-mist-300 font-mono text-[11px] tracking-[0.2em] uppercase hover:border-lumen-500/50 hover:text-lumen-300 transition-colors focus-ring">
            lentes do registry
          </a>
          <a href="#/" className="inline-flex items-center px-6 py-3.5 rounded-md font-mono text-[11px] tracking-[0.2em] uppercase text-mist-500 hover:text-mist-200 transition-colors focus-ring">
            portal →
          </a>
        </Reveal>
        <Reveal delay={450}>
          <p className="mt-14 font-mono text-[10px] tracking-[0.2em] uppercase text-mist-600">
            HUI ≠ ICEBERG · presença ≠ endosso · histórico ≠ obsoleto
          </p>
        </Reveal>
        <Reveal delay={500}>
          <button onClick={() => open(ICE)} className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-lumen-400/80 hover:text-lumen-300 transition-colors cursor-pointer focus-ring rounded">
            inspecionar ICEBERG uma última vez
          </button>
        </Reveal>
      </div>
    </section>
  );
}
