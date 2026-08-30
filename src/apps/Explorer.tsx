/* ------------------------------------------------------------------ */
/*  HolOmniverse Beholder Explorer (P0)                                */
/*  Navegação fractal ROOT → DOMAIN → TOPIC → PROVENANCE               */
/*  sobre o registry. Perspectiva do observador ≠ hierarquia.          */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useRef, useState } from "react";
import { REGISTRY } from "../registry/queries";
import { buildFractalTree, nodeAtPath, pathLabels, type FractalNode } from "../registry/fractal";
import { useInspector, LifecycleChip } from "../registry/Inspector";
import { SAFE_REL } from "../registry/model";
import { Scramble } from "../motion";

const ELLIPSE_RX = 300;
const ELLIPSE_RY = 172;
const CX = 400;
const CY = 260;

function useParallax(stageRef: React.RefObject<HTMLDivElement | null>) {
  const pxRef = useRef(0);
  const pyRef = useRef(0);
  const curRef = useRef({ x: 0, y: 0 });
  const layersRef = useRef<SVGGElement[]>([]);
  const readoutRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let raf = 0;
    let live = true;
    const onMove = (e: PointerEvent) => {
      const el = stageRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      pxRef.current = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      pyRef.current = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    };
    const onVis = () => {
      live = !document.hidden;
      if (live) loop();
    };
    const loop = () => {
      if (!live || typeof requestAnimationFrame !== "function") return;
      curRef.current.x += (pxRef.current - curRef.current.x) * 0.06;
      curRef.current.y += (pyRef.current - curRef.current.y) * 0.06;
      const { x, y } = curRef.current;
      layersRef.current.forEach((g, i) => {
        if (g) g.style.transform = `translate(${(x * 26 * (i + 1)).toFixed(2)}px, ${(y * 16 * (i + 1)).toFixed(2)}px)`;
      });
      if (readoutRef.current) {
        readoutRef.current.textContent = `x ${x.toFixed(2)} · y ${y.toFixed(2)}`;
      }
      raf = requestAnimationFrame(loop);
    };
    const el = stageRef.current;
    el?.addEventListener("pointermove", onMove);
    document.addEventListener("visibilitychange", onVis);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced && typeof requestAnimationFrame === "function") loop();
    return () => {
      if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
      el?.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [stageRef]);

  return { layersRef, readoutRef };
}

export default function Explorer() {
  const tree = useMemo(() => buildFractalTree(REGISTRY), []);
  const [path, setPath] = useState<string[]>(["root"]);
  const [active, setActive] = useState(0);
  const [liveMsg, setLiveMsg] = useState("");
  const { open } = useInspector();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const { layersRef, readoutRef } = useParallax(stageRef);

  const node = useMemo(() => nodeAtPath(tree, path) ?? tree, [tree, path]);
  const labels = useMemo(() => pathLabels(tree, path), [tree, path]);
  const record = node.recordId ? REGISTRY.find((r) => r.id === node.recordId) : undefined;
  const children = node.children;

  const clamp = (i: number) => (children.length ? ((i % children.length) + children.length) % children.length : 0);

  const announce = (n: FractalNode, a: number) => {
    setLiveMsg(`${n.level} ${n.label}; filho ${a + 1} de ${Math.max(1, n.children.length)}${n.children[a] ? `: ${n.children[a].label}` : ""}`);
  };

  useEffect(() => {
    setActive(0);
    announce(node, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path.join(">")]);

  const dive = (child?: FractalNode) => {
    const target = child ?? children[active];
    if (target && target.children.length > 0) setPath((p) => [...p, target.key]);
    else if (target?.recordId && target.sourceRef === undefined) {
      /* TOPIC sem descer: abre proveniência como nível final mesmo assim */
      setPath((p) => [...p, target.key]);
    }
  };

  const ascend = () => setPath((p) => (p.length > 1 ? p.slice(0, -1) : p));

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = clamp(active + 1);
      setActive(next);
      announce(node, next);
      listRef.current?.querySelectorAll("button[data-row]")[next]?.setAttribute("data-active", "true");
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = clamp(active - 1);
      setActive(next);
      announce(node, next);
    } else if (e.key === "Enter") {
      e.preventDefault();
      dive();
    } else if (e.key === "Escape" || e.key === "Backspace") {
      e.preventDefault();
      ascend();
    } else if (e.key === "Home") {
      e.preventDefault();
      setPath(["root"]);
    }
  };

  const focusRow = (i: number) => {
    setActive(i);
    announce(node, i);
    const btns = listRef.current?.querySelectorAll<HTMLButtonElement>("button[data-row]");
    btns?.[i]?.focus();
  };

  const isTerminal = children.length === 0;

  return (
    <div className="relative min-h-screen bg-ink-950 text-mist-200 font-body overflow-hidden">
      <div className="atlas-grid absolute inset-x-0 top-0 h-[520px] pointer-events-none" aria-hidden="true" />
      <div className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(62,207,178,0.08), transparent 65%)" }} aria-hidden="true" />
      <div className="absolute -bottom-52 -left-40 w-[620px] h-[620px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(233,188,98,0.06), transparent 65%)" }} aria-hidden="true" />

      <a href="#explorer-main" onClick={(e) => { e.preventDefault(); const el = document.getElementById("explorer-main"); el?.focus(); el?.scrollIntoView?.(); }} className="skip-link">
        pular para o explorer
      </a>

      {/* topo */}
      <header className="relative border-b border-seam bg-ink-900/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <a href="#/" className="group inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase text-mist-500 hover:text-lumen-300 transition-colors focus-ring">
            <svg viewBox="0 0 20 12" className="w-4 h-2.5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M19 6H3M8 1.5 3 6l5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            portal
          </a>
          <span className="hidden sm:block w-px h-5 bg-seam-strong" aria-hidden="true" />
          <div className="flex-1 min-w-[240px]">
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-mist-50 leading-none">
              <Scramble text="Beholder Explorer" />
            </h1>
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600 mt-2">
              HolOmniverse · ROOT → DOMAIN → TOPIC → PROVENANCE · sobre {REGISTRY.length} blocos
            </p>
          </div>
          <p className="font-mono text-[10px] text-mist-500 max-w-xs leading-relaxed">
            posição visual <span className="text-lumen-300">≠</span> hierarquia ·{" "}
            <span className="text-gild-300">HOS_RESEARCH ≠ FIRST_CYCLE_CANON</span>
          </p>
        </div>
      </header>

      {/* breadcrumb */}
      <nav className="relative border-b border-seam bg-ink-950/70" aria-label="Trilha fractal">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-3 flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
          {labels.map((l, i) => {
            const isLast = i === labels.length - 1;
            return (
              <span key={i} className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setPath(path.slice(0, i + 1))}
                  disabled={isLast}
                  aria-current={isLast ? "location" : undefined}
                  className={`px-3 py-1.5 rounded-md border font-mono text-[10px] tracking-[0.16em] uppercase transition-all duration-300 focus-ring ${
                    isLast
                      ? "border-lumen-500/60 bg-lumen-500/10 text-lumen-300 cursor-default"
                      : "border-seam text-mist-500 hover:text-lumen-300 hover:border-seam-strong cursor-pointer"
                  }`}
                >
                  {["ROOT", "DOMAIN", "TOPIC", "PROVENANCE"][i] ?? l} · {l}
                </button>
                {!isLast && <span className="text-mist-600 font-mono text-[10px]" aria-hidden="true">→</span>}
              </span>
            );
          })}
        </div>
      </nav>

      <main id="explorer-main" tabIndex={-1} className="relative mx-auto max-w-7xl px-5 sm:px-8 py-10 pb-32 grid lg:grid-cols-12 gap-10">
        {/* esfera */}
        <div className="lg:col-span-7">
          <div ref={stageRef} className="relative rounded-xl border border-seam bg-gradient-to-b from-ink-900 to-ink-950 overflow-hidden" style={{ touchAction: "none" }}>
            <div key={path.join(">")} className="anim-rise">
              <svg viewBox="0 0 800 520" className="w-full h-auto block" aria-hidden="true" focusable="false">
                {/* anéis-guia */}
                <g style={{ transition: "transform .4s ease" }}>
                  <ellipse cx={CX} cy={CY} rx={ELLIPSE_RX} ry={ELLIPSE_RY} fill="none" stroke="rgba(95,227,200,0.10)" strokeDasharray="3 7" />
                  <ellipse cx={CX} cy={CY} rx={ELLIPSE_RX * 0.62} ry={ELLIPSE_RY * 0.62} fill="none" stroke="rgba(95,227,200,0.08)" strokeDasharray="2 8" />
                  <ellipse cx={CX} cy={CY} rx={ELLIPSE_RX * 1.28} ry={ELLIPSE_RY * 1.28} fill="none" stroke="rgba(233,188,98,0.06)" strokeDasharray="1 10" />
                </g>

                {/* centro = nó corrente */}
                <g ref={(el) => { if (el) layersRef.current[0] = el; }}>
                  <circle cx={CX} cy={CY} r={node.level === "PROVENANCE" ? 26 : 42} fill="rgba(5,14,19,0.9)" stroke={node.level === "PROVENANCE" ? "#e9bc62" : "#5fe3c8"} strokeWidth="1.4" />
                  <circle cx={CX} cy={CY} r={node.level === "PROVENANCE" ? 34 : 54} fill="none" stroke={node.level === "PROVENANCE" ? "rgba(233,188,98,0.25)" : "rgba(95,227,200,0.22)"} className="pulse-ring" />
                  <text x={CX} y={CY - (node.level === "PROVENANCE" ? 46 : 62)} textAnchor="middle" className="fill-mist-400" fontSize="11" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
                    {node.level}
                  </text>
                  <text x={CX} y={CY + 4} textAnchor="middle" className="fill-mist-50" fontSize={node.label.length > 18 ? 11 : 14} fontFamily="Fraunces, serif">
                    {node.label.length > 24 ? node.label.slice(0, 23) + "…" : node.label}
                  </text>
                  {node.hint && (
                    <text x={CX} y={CY + (node.level === "PROVENANCE" ? 44 : 72)} textAnchor="middle" className="fill-mist-600" fontSize="9" fontFamily="JetBrains Mono, monospace" letterSpacing="1.5">
                      {node.hint.toUpperCase()}
                    </text>
                  )}
                </g>

                {/* filhos em órbita (camada de parallax) */}
                <g ref={(el) => { if (el) layersRef.current[1] = el; }} style={{ transition: "opacity .4s ease" }}>
                  {children.map((c, i) => {
                    const ang = (i / Math.max(1, children.length)) * Math.PI * 2 - Math.PI / 2;
                    const x = CX + Math.cos(ang) * ELLIPSE_RX;
                    const y = CY + Math.sin(ang) * ELLIPSE_RY;
                    const isActive = i === active;
                    const stroke = isActive ? "#e9bc62" : "rgba(95,227,200,0.4)";
                    return (
                      <g key={c.key} style={{ cursor: "pointer" }} onClick={() => focusRow(i)} onDoubleClick={() => { focusRow(i); dive(c); }}>
                        <line x1={CX} y1={CY} x2={x} y2={y} stroke={isActive ? "rgba(233,188,98,0.35)" : "rgba(95,227,200,0.10)"} strokeWidth="1" />
                        <circle cx={x} cy={y} r={isActive ? 24 : 17} fill="rgba(10,31,41,0.95)" stroke={stroke} strokeWidth={isActive ? 1.8 : 1.1} style={{ transition: "all .3s ease" }} />
                        {isActive && <circle cx={x} cy={y} r={30} fill="none" stroke="rgba(233,188,98,0.3)" className="pulse-ring" />}
                        <text x={x} y={y + 4} textAnchor="middle" className={isActive ? "fill-gild-300" : "fill-mist-400"} fontSize="10" fontFamily="JetBrains Mono, monospace">
                          {String(i + 1).padStart(2, "0")}
                        </text>
                        <text x={x} y={y + (isActive ? 44 : 36)} textAnchor="middle" className={isActive ? "fill-mist-100" : "fill-mist-600"} fontSize="10" fontFamily="Sora, sans-serif" style={{ transition: "fill .3s ease" }}>
                          {c.label.length > 22 ? c.label.slice(0, 21) + "…" : c.label}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {isTerminal && (
                  <text x={CX} y={CY + 120} textAnchor="middle" className="fill-mist-500" fontSize="11" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
                    FIM DA DESCIDA · PROVENIÊNCIA PRESERVADA
                  </text>
                )}
              </svg>
            </div>

            {/* leitura do observador */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
              <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-mist-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gild-400 anim-led" aria-hidden="true" />
                projeção do observador · <span ref={readoutRef} className="text-gild-300">x 0.00 · y 0.00</span>
              </p>
              <p className="hidden sm:block font-mono text-[9px] tracking-[0.18em] uppercase text-mist-600">mover ≠ governar</p>
            </div>
          </div>

          {/* registro do tópico */}
          {record && (
            <div key={record.id} className="anim-rise mt-5 rounded-lg border border-seam bg-ink-900/70 p-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="min-w-[200px] flex-1">
                <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-mist-600">registro em foco · {record.id}</p>
                <p className="font-display text-lg text-mist-50 mt-1">{record.canonicalName}</p>
                <p className="text-xs text-mist-400 leading-relaxed mt-1.5 max-w-xl">{record.description}</p>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <LifecycleChip lifecycle={record.lifecycle} />
                <button
                  onClick={() => open(record)}
                  className="px-4 py-2 rounded-md border border-lumen-500/50 bg-lumen-500/10 text-lumen-300 font-mono text-[10px] tracking-[0.16em] uppercase hover:bg-lumen-500/20 transition-all duration-200 cursor-pointer focus-ring"
                >
                  inspecionar bloco
                </button>
                {record.route && (
                  <a href={`#${record.route}`} className="px-4 py-2 rounded-md border border-gild-400/50 bg-gild-400/10 text-gild-300 font-mono text-[10px] tracking-[0.16em] uppercase hover:bg-gild-400/20 transition-all duration-200 focus-ring">
                    abrir rota local
                  </a>
                )}
                {record.externalUrl && (record.publicability === "public-safe" || record.publicability === "live-public") && (
                  <a href={record.externalUrl} target="_blank" rel={SAFE_REL} className="px-4 py-2 rounded-md border border-seam text-mist-400 font-mono text-[10px] tracking-[0.16em] uppercase hover:text-mist-100 hover:border-seam-strong transition-all duration-200 focus-ring">
                    destino permitido ↗
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* lista equivalente (teclado + SR) */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-medium text-mist-50">
              {children.length ? `Hólons neste nível` : "Nível terminal"}
            </h2>
            <span className="font-mono text-[10px] text-lumen-400">{children.length} nó{children.length === 1 ? "" : "s"}</span>
          </div>

          <div aria-live="polite" className="sr-only">{liveMsg}</div>

          <ul ref={listRef} onKeyDown={onListKey} className="space-y-2.5" aria-label={`Hólons de ${node.label}`}>
            {children.map((c, i) => {
              const isActive = i === active;
              const rec = c.recordId ? REGISTRY.find((r) => r.id === c.recordId) : undefined;
              return (
                <li key={c.key}>
                  <div
                    data-row
                    className={`group rounded-lg border p-4 transition-all duration-300 ${
                      isActive ? "border-gild-400/60 bg-gild-400/5 shadow-[0_0_28px_rgba(233,188,98,0.10)]" : "border-seam bg-ink-900/50 hover:border-seam-strong"
                    }`}
                  >
                    <button
                      data-row
                      onClick={() => focusRow(i)}
                      onDoubleClick={() => { focusRow(i); dive(c); }}
                      aria-pressed={isActive}
                      className="w-full flex items-start gap-3.5 text-left cursor-pointer focus-ring rounded"
                    >
                      <span className={`mt-0.5 font-mono text-[10px] shrink-0 ${isActive ? "text-gild-300" : "text-mist-600"}`}>{String(i + 1).padStart(2, "0")}</span>
                      <span className="min-w-0 flex-1">
                        <span className={`block font-display text-base leading-snug transition-colors duration-200 ${isActive ? "text-mist-50" : "text-mist-200"}`}>{c.label}</span>
                        <span className="block font-mono text-[9px] tracking-[0.14em] uppercase text-mist-600 mt-1">
                          {c.level} · {c.hint ?? (c.children.length ? `${c.children.length} filhos` : "terminal")}
                        </span>
                        {c.sourceRef && (
                          <span className="block text-[11px] text-mist-500 leading-relaxed mt-1.5">
                            <span className="text-lumen-300/90">{c.sourceRef.sourceClass}</span> · {c.sourceRef.role} · acesso {c.sourceRef.access}
                            {c.sourceRef.sha ? ` · sha ${c.sourceRef.sha.slice(0, 7)}` : ""}
                            {c.sourceRef.observedAt ? ` · obs. ${c.sourceRef.observedAt}` : ""}
                          </span>
                        )}
                      </span>
                    </button>
                    <div className="flex items-center gap-2 mt-2.5 pl-8 flex-wrap">
                      {!isTerminal && c.children.length > 0 && (
                        <button
                          onClick={() => { focusRow(i); dive(c); }}
                          className="px-3 py-1.5 rounded-md border border-lumen-500/40 text-lumen-300 font-mono text-[9px] tracking-[0.14em] uppercase hover:bg-lumen-500/10 transition-all duration-200 cursor-pointer focus-ring"
                        >
                          {c.level === "TOPIC" ? "proveniência ↓" : "mergulhar ↓"}
                        </button>
                      )}
                      {rec && (
                        <button
                          onClick={() => open(rec)}
                          className="px-3 py-1.5 rounded-md border border-seam text-mist-400 font-mono text-[9px] tracking-[0.14em] uppercase hover:text-lumen-300 hover:border-lumen-500/40 transition-all duration-200 cursor-pointer focus-ring"
                        >
                          inspecionar
                        </button>
                      )}
                      {c.sourceRef?.safeUrl && c.sourceRef.access === "public" && (
                        <a href={c.sourceRef.safeUrl} target="_blank" rel={SAFE_REL} className="px-3 py-1.5 rounded-md border border-seam text-mist-400 font-mono text-[9px] tracking-[0.14em] uppercase hover:text-gild-300 hover:border-gild-400/40 transition-all duration-200 focus-ring">
                          fonte ↗
                        </a>
                      )}
                      {c.sourceRef && !c.sourceRef.safeUrl && (
                        <span className="px-3 py-1.5 rounded-md border border-ember-400/30 text-ember-300 font-mono text-[9px] tracking-[0.14em] uppercase">
                          metadado seguro · sem URL
                        </span>
                      )}
                      {rec && <LifecycleChip lifecycle={rec.lifecycle} />}
                    </div>
                  </div>
                </li>
              );
            })}
            {isTerminal && (
              <li className="rounded-lg border border-gild-400/30 bg-gild-400/5 p-6">
                <p className="font-display text-lg text-gild-300">Fim da descida.</p>
                <p className="text-sm text-mist-400 leading-relaxed mt-2">
                  Proveniência preservada: identidade e contexto chegaram intactos ao nível mais profundo.{" "}
                  <button onClick={ascend} className="text-lumen-300 underline decoration-lumen-500/40 underline-offset-4 hover:decoration-lumen-300 transition-colors cursor-pointer focus-ring rounded">
                    emergir um nível (Esc)
                  </button>{" "}
                  ou{" "}
                  <button onClick={() => setPath(["root"])} className="text-lumen-300 underline decoration-lumen-500/40 underline-offset-4 hover:decoration-lumen-300 transition-colors cursor-pointer focus-ring rounded">
                    voltar à raiz (Home)
                  </button>
                  .
                </p>
              </li>
            )}
          </ul>

          {/* legenda de teclado */}
          <div className="mt-6 rounded-lg border border-seam bg-ink-950/60 px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mr-1">teclado</span>
            <span className="font-mono text-[10px] text-mist-500 flex items-center gap-1.5"><span className="kbd">↑</span><span className="kbd">↓</span> navegar</span>
            <span className="font-mono text-[10px] text-mist-500 flex items-center gap-1.5"><span className="kbd">↵</span> mergulhar</span>
            <span className="font-mono text-[10px] text-mist-500 flex items-center gap-1.5"><span className="kbd">esc</span> emergir</span>
            <span className="font-mono text-[10px] text-mist-500 flex items-center gap-1.5"><span className="kbd">home</span> raiz</span>
          </div>
        </div>
      </main>
    </div>
  );
}
