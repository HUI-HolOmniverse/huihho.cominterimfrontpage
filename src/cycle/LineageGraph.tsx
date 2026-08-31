/* ------------------------------------------------------------------ */
/*  Ciclo Vivo · Lineage Graph (#/linhagem)                            */
/*  Grafo vivo derivado do registry + âncoras rotuladas.               */
/*  EXISTÊNCIA DE ARESTA NUNCA IMPLICA DEPENDÊNCIA CANÔNICA.           */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LINEAGE_DASH,
  LINEAGE_KINDS,
  LINEAGE_LABEL,
  LINEAGE_FOCUS_KEY,
  buildLineage,
  layoutGraph,
  lineagePaths,
  handoffRecordToDiff,
  focusLedgerEntry,
  focusReadbackTarget,
  type LineageEdge,
  type LineageKind,
  type LineageNode,
} from "./lineageModel";
import { loadReadbacks, readbacksForTarget } from "./readbackModel";
import { WORK_ENTRIES } from "./workLedgerModel";
import { REGISTRY, byId } from "../registry/queries";
import { useInspector, LifecycleChip, RungChip } from "../registry/Inspector";
import { Scramble } from "../motion";
import { useReducedMotion } from "../motion";
import CoCreationLens from "./CoCreationLens";

const KIND_STROKE: Record<LineageKind, string> = {
  SOURCE_LINEAGE: "#a7c2bf",
  HUMAN_CO_CREATION_LINEAGE: "#e9bc62",
  IMPLEMENTATION_LINEAGE: "#7fa0a0",
  ASSURANCE_LINEAGE: "#8ff0dd",
  DEPLOYMENT_LINEAGE: "#587a7c",
  READBACK_LINEAGE: "#5fe3c8",
  CONTRADICTION: "#e08a63",
  UNRESOLVED: "#f3d289",
  RELATED: "#587a7c",
};

export default function LineageGraph() {
  const reduced = useReducedMotion();
  const { openById } = useInspector();
  const [readbacks] = useState(() => loadReadbacks());
  const { nodes, edges } = useMemo(() => buildLineage(readbacks.map((r) => ({ id: r.id, targetId: r.targetId, state: r.state }))), [readbacks]);
  const { pos, width, height } = useMemo(() => layoutGraph(nodes), [nodes]);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<Set<LineageKind>>(() => new Set(LINEAGE_KINDS));
  const [fallbackCursor, setFallbackCursor] = useState(0);
  const fallbackRef = useRef<HTMLDivElement | null>(null);

  /* foco vindo de outras superfícies (handoff) */
  useEffect(() => {
    try {
      const focus = sessionStorage.getItem(LINEAGE_FOCUS_KEY);
      if (focus) {
        sessionStorage.removeItem(LINEAGE_FOCUS_KEY);
        setSelectedNode(focus);
      }
    } catch {
      /* sem storage */
    }
  }, []);

  const visibleEdges = useMemo(() => edges.filter((e) => kindFilter.has(e.kind)), [edges, kindFilter]);
  const pathSet = useMemo(() => (selectedNode ? lineagePaths(selectedNode, visibleEdges) : null), [selectedNode, visibleEdges]);

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const selected = selectedNode ? nodeById.get(selectedNode) : undefined;
  const edge = selectedEdge ? visibleEdges.find((e) => e.id === selectedEdge) : undefined;
  const highlightNodes = useMemo(() => {
    if (pathSet) return pathSet;
    if (edge) return new Set([edge.from, edge.to]);
    return null;
  }, [pathSet, edge]);

  const incidentEdges = useMemo(() => (selected ? visibleEdges.filter((e) => e.from === selected.id || e.to === selected.id) : []), [selected, visibleEdges]);
  const ledgerMatches = useMemo(
    () => (selected ? WORK_ENTRIES.filter((w) => w.registryRefs?.includes(selected.id)) : []),
    [selected],
  );
  const targetReadbacks = useMemo(() => (selected ? readbacksForTarget(readbacks, selected.id) : []), [selected, readbacks]);
  const record = selected && selected.kind === "registry" ? byId.get(selected.id) : undefined;

  const toggleKind = (k: LineageKind) => {
    setKindFilter((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  /* navegação por teclado no fallback acessível */
  const onFallbackKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFallbackCursor((c) => Math.min(c + 1, visibleEdges.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFallbackCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const target = visibleEdges[fallbackCursor];
      if (target) {
        setSelectedEdge(target.id);
        setSelectedNode(target.from);
      }
    } else if (e.key === "Escape") {
      setSelectedEdge(null);
      setSelectedNode(null);
    }
  };

  const kindCounts = useMemo(() => {
    const m = new Map<LineageKind, number>();
    for (const k of LINEAGE_KINDS) m.set(k, 0);
    for (const e of edges) m.set(e.kind, (m.get(e.kind) ?? 0) + 1);
    return m;
  }, [edges]);

  return (
    <div className="relative min-h-screen bg-ink-950 text-mist-200 font-body">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="atlas-grid absolute inset-x-0 top-0 h-[420px] pointer-events-none" aria-hidden="true" />

      <header className="relative border-b border-seam bg-ink-900/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <a href="#/" className="group inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase text-mist-500 hover:text-lumen-300 transition-colors focus-ring rounded">
            <svg viewBox="0 0 20 12" className="w-4 h-2.5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M19 6H3M8 1.5 3 6l5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            portal
          </a>
          <span className="hidden sm:block w-px h-5 bg-seam-strong" aria-hidden="true" />
          <div className="flex-1 min-w-[220px]">
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-mist-50 leading-none">
              <Scramble text="Lineage Graph" />
            </h1>
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600 mt-2">
              ciclo vivo · fonte → linhagem → trabalho → readback
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full border border-ember-400/45 text-ember-300 font-mono text-[9px] uppercase tracking-[0.14em]">aresta ≠ cânone</span>
            <span className="px-3 py-1.5 rounded-full border border-seam-strong text-mist-400 font-mono text-[9px] uppercase tracking-[0.14em]">lifecycle ≠ evidência</span>
            <span className="hidden md:inline-flex px-3 py-1.5 rounded-full border border-gild-400/40 text-gild-300 font-mono text-[9px] uppercase tracking-[0.14em]">demo rotulado</span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-5 sm:px-8 py-8 grid lg:grid-cols-12 gap-6 items-start">
        {/* coluna do grafo */}
        <div className="lg:col-span-8 space-y-5">
          {/* legenda + filtros de tipo (texto + traço, nunca só cor) */}
          <div className="rounded-lg border border-seam bg-ink-900/60 p-4" role="group" aria-label="Filtros e legenda de tipos de linhagem">
            <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-mist-600 mb-3">tipos de linhagem — traço distinto por tipo (sem depender de cor)</p>
            <div className="flex flex-wrap gap-1.5">
              {LINEAGE_KINDS.map((k) => {
                const on = kindFilter.has(k);
                return (
                  <button
                    key={k}
                    onClick={() => toggleKind(k)}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border font-mono text-[9px] uppercase tracking-[0.12em] transition-all duration-200 cursor-pointer focus-ring ${
                      on ? "border-lumen-500/50 text-mist-100 bg-lumen-500/8" : "border-seam text-mist-600 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <svg viewBox="0 0 34 6" className="w-8 h-1.5" aria-hidden="true">
                      <line x1="1" y1="3" x2="33" y2="3" stroke={KIND_STROKE[k]} strokeWidth="2" strokeDasharray={LINEAGE_DASH[k] === "none" ? undefined : LINEAGE_DASH[k]} />
                    </svg>
                    {LINEAGE_LABEL[k]} · {kindCounts.get(k) ?? 0}
                  </button>
                );
              })}
            </div>
          </div>

          {/* grafo */}
          <div className="rounded-lg border border-seam bg-ink-950/80 overflow-hidden">
            <div className="overflow-auto max-h-[68vh]" tabIndex={-1} aria-label="Grafo de linhagem (role decorativo; use a lista acessível abaixo para navegação por teclado)">
              <svg width={width} height={height} className="block" role="img" aria-label={`Grafo de linhagem com ${nodes.length} nós e ${visibleEdges.length} arestas visíveis`}>
                <defs>
                  {(["m-neutral", "m-lumen", "m-ember", "m-gild"] as const).map((mid) => (
                    <marker key={mid} id={mid} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M0.5 0.5 7 4 0.5 7.5Z" fill={mid === "m-lumen" ? "#5fe3c8" : mid === "m-ember" ? "#e08a63" : mid === "m-gild" ? "#f3d289" : "#7fa0a0"} />
                    </marker>
                  ))}
                </defs>

                {/* cabeçalhos de família */}
                {Array.from(new Set(nodes.map((n) => n.family))).map((fam) => {
                  const xs = nodes.filter((n) => n.family === fam).map((n) => pos.get(n.id)?.x ?? 0);
                  if (xs.length === 0) return null;
                  return (
                    <text key={fam} x={Math.min(...xs)} y={34} className="fill-mist-600" fontSize="9" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
                      {fam.toUpperCase()}
                    </text>
                  );
                })}

                {/* arestas */}
                {visibleEdges.map((e) => {
                  const a = pos.get(e.from);
                  const b = pos.get(e.to);
                  if (!a || !b) return null;
                  const involved = edge?.id === e.id || (pathSet && (pathSet.has(e.from) && pathSet.has(e.to)));
                  const dim = highlightNodes ? (involved ? 0.95 : 0.1) : 0.55;
                  const mx = (a.x + b.x) / 2;
                  const marker = e.kind === "CONTRADICTION" ? "m-ember" : e.kind === "UNRESOLVED" ? "m-gild" : e.kind === "READBACK_LINEAGE" ? "m-lumen" : "m-neutral";
                  return (
                    <path
                      key={e.id}
                      d={`M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`}
                      fill="none"
                      stroke={KIND_STROKE[e.kind]}
                      strokeWidth={edge?.id === e.id ? 2.4 : 1.3}
                      strokeDasharray={LINEAGE_DASH[e.kind] === "none" ? undefined : LINEAGE_DASH[e.kind]}
                      markerEnd={`url(#${marker})`}
                      opacity={dim}
                      className={!reduced && involved ? "anim-dash" : undefined}
                      style={{ transition: "opacity 300ms ease" }}
                    />
                  );
                })}

                {/* nós */}
                {nodes.map((n) => {
                  const p = pos.get(n.id);
                  if (!p) return null;
                  const isSel = selectedNode === n.id;
                  const inPath = highlightNodes ? highlightNodes.has(n.id) : true;
                  return (
                    <g
                      key={n.id}
                      transform={`translate(${p.x}, ${p.y})`}
                      opacity={inPath ? 1 : 0.22}
                      style={{ transition: "opacity 300ms ease", cursor: "pointer" }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${n.label}${n.representative ? " (representativo/demo)" : ""}${n.lifecycle ? ` · ${n.lifecycle}` : ""}`}
                      onClick={() => {
                        setSelectedNode(n.id);
                        setSelectedEdge(null);
                      }}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          setSelectedNode(n.id);
                          setSelectedEdge(null);
                        }
                      }}
                      className="focus-ring outline-none"
                    >
                      {n.kind === "external" ? (
                        <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill={isSel ? "#e9bc62" : "#0a1f29"} stroke={n.representative ? "#e08a63" : "#e9bc62"} strokeWidth="1.4" />
                      ) : (
                        <circle r="5.5" fill={isSel ? "#5fe3c8" : "#0d2531"} stroke={n.representative ? "#e08a63" : "#5fe3c8"} strokeWidth="1.4" />
                      )}
                      {isSel && !reduced && <circle r="10" fill="none" stroke="#5fe3c8" strokeWidth="1" className="pulse-ring" />}
                      <text x="10" y="3.5" fontSize="8.5" fontFamily="JetBrains Mono, monospace" className={isSel ? "fill-mist-50" : inPath ? "fill-mist-400" : "fill-mist-600"}>
                        {n.label.length > 34 ? `${n.label.slice(0, 32)}…` : n.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <p className="px-4 py-2.5 border-t border-seam font-mono text-[9px] tracking-[0.14em] uppercase text-mist-600">
              ○ registry · ◇ âncora externa · anel âmbar = representativo/demo · aresta viva não implica dependência canônica
            </p>
          </div>

          {/* fallback acessível: tabela de arestas com navegação por teclado */}
          <div ref={fallbackRef} className="rounded-lg border border-seam bg-ink-900/60">
            <div className="px-4 py-3 border-b border-seam flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-mono text-[10px] tracking-[0.24em] uppercase text-mist-500">Fallback acessível — lista de arestas</h2>
              <p className="font-mono text-[9px] text-mist-600">↑ ↓ navega · ↵ seleciona · esc limpa</p>
            </div>
            <div
              role="listbox"
              aria-label="Arestas de linhagem (navegação por teclado)"
              tabIndex={0}
              onKeyDown={onFallbackKey}
              className="max-h-64 overflow-auto focus-ring rounded-b-lg"
            >
              {visibleEdges.map((e, i) => {
                const from = nodeById.get(e.from);
                const to = nodeById.get(e.to);
                const active = i === fallbackCursor;
                const sel = selectedEdge === e.id;
                return (
                  <div
                    key={e.id}
                    role="option"
                    aria-selected={sel}
                    data-idx={i}
                    onClick={() => {
                      setFallbackCursor(i);
                      setSelectedEdge(e.id);
                      setSelectedNode(e.from);
                    }}
                    className={`grid grid-cols-12 gap-2 items-center px-4 py-2 border-b border-seam/50 cursor-pointer transition-colors duration-150 ${
                      sel ? "bg-lumen-500/10" : active ? "bg-ink-850" : "hover:bg-ink-850/60"
                    }`}
                  >
                    <span className="col-span-4 font-mono text-[10px] text-mist-300 truncate">{from?.label ?? e.from}</span>
                    <span className="col-span-1 font-mono text-[10px] text-mist-600" aria-hidden="true">→</span>
                    <span className="col-span-4 font-mono text-[10px] text-mist-300 truncate">{to?.label ?? e.to}</span>
                    <span className="col-span-3 flex items-center justify-end gap-1.5">
                      {e.representative && <span className="text-ember-300 font-mono text-[8px] uppercase">demo</span>}
                      <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-mist-500">{LINEAGE_LABEL[e.kind]}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* painel de detalhe */}
        <aside className="lg:col-span-4 lg:sticky lg:top-8 space-y-5" aria-live="polite">
          {selected ? (
            <div className="rounded-lg border border-seam-strong bg-gradient-to-b from-ink-850 to-ink-900 p-6">
              <p className="font-mono text-[9px] tracking-[0.26em] uppercase text-lumen-400 mb-2.5">
                nó selecionado · {selected.kind === "registry" ? "registry" : "âncora externa"}
              </p>
              <h2 className="font-display text-2xl font-medium text-mist-50 leading-tight">{selected.label}</h2>
              {selected.representative && (
                <span className="inline-flex mt-2.5 px-2.5 py-1 rounded-full border border-ember-400/50 text-ember-300 font-mono text-[8px] uppercase tracking-[0.16em]">
                  representativo · demo — sem dado real
                </span>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                {record && <LifecycleChip lifecycle={record.lifecycle} />}
                {record && <RungChip rung={record.evidence.rung} />}
                <span className="px-2.5 py-1 rounded-full border border-seam font-mono text-[9px] uppercase tracking-[0.14em] text-mist-500">{selected.family}</span>
              </div>
              {selected.note && <p className="text-[13px] text-mist-400 leading-relaxed mt-4">{selected.note}</p>}

              {/* arestas incidentes agrupadas por tipo */}
              <div className="mt-5 border-t border-seam pt-4">
                <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600 mb-2.5">linhagens incidentes · {incidentEdges.length}</p>
                <ul className="space-y-1.5 max-h-40 overflow-auto pr-1">
                  {incidentEdges.map((e) => {
                    const other = e.from === selected.id ? nodeById.get(e.to) : nodeById.get(e.from);
                    const dir = e.from === selected.id ? "→" : "←";
                    return (
                      <li key={e.id} className="text-[11.5px] text-mist-400 leading-snug flex gap-2">
                        <svg viewBox="0 0 26 6" className="w-6 h-1.5 shrink-0 mt-1.5" aria-hidden="true">
                          <line x1="1" y1="3" x2="25" y2="3" stroke={KIND_STROKE[e.kind]} strokeWidth="2" strokeDasharray={LINEAGE_DASH[e.kind] === "none" ? undefined : LINEAGE_DASH[e.kind]} />
                        </svg>
                        <span>
                          <span className="text-mist-600 font-mono text-[9px] uppercase mr-1.5">{LINEAGE_LABEL[e.kind]} {dir}</span>
                          <button onClick={() => setSelectedNode(other?.id ?? null)} className="text-mist-200 hover:text-lumen-300 transition-colors underline decoration-seam-strong underline-offset-2 cursor-pointer">
                            {other?.label ?? "?"}
                          </button>
                          {e.representative && <span className="text-ember-300 font-mono text-[8px] uppercase ml-1.5">demo</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* ações */}
              <div className="mt-5 grid gap-2">
                {record && (
                  <>
                    <button onClick={() => openById(record.id)} className="w-full px-4 py-2.5 rounded-md border border-lumen-500/50 text-lumen-300 font-mono text-[10px] uppercase tracking-[0.16em] hover:bg-lumen-500/10 transition-colors cursor-pointer focus-ring">
                      abrir no Inspector
                    </button>
                    <button onClick={() => handoffRecordToDiff(record)} className="w-full px-4 py-2.5 rounded-md border border-seam-strong text-mist-300 font-mono text-[10px] uppercase tracking-[0.16em] hover:bg-ink-800 transition-colors cursor-pointer focus-ring">
                      abrir no Snapshot Diff
                    </button>
                  </>
                )}
                {ledgerMatches.length > 0 && (
                  <button onClick={() => focusLedgerEntry(ledgerMatches[0].workId)} className="w-full px-4 py-2.5 rounded-md border border-gild-400/50 text-gild-300 font-mono text-[10px] uppercase tracking-[0.16em] hover:bg-gild-400/10 transition-colors cursor-pointer focus-ring">
                    abrir no Work Ledger · {ledgerMatches.length} {ledgerMatches.length === 1 ? "registro" : "registros"}
                  </button>
                )}
                {targetReadbacks.length > 0 && (
                  <button onClick={() => focusReadbackTarget(selected.id)} className="w-full px-4 py-2.5 rounded-md border border-ember-400/45 text-ember-300 font-mono text-[10px] uppercase tracking-[0.16em] hover:bg-ember-400/10 transition-colors cursor-pointer focus-ring">
                    readbacks do alvo · {targetReadbacks.length}
                  </button>
                )}
              </div>

              {/* lente de co-criação quando o padrão humano toca o nó */}
              {(selected.id === "ext-sergio" || incidentEdges.some((e) => e.kind === "HUMAN_CO_CREATION_LINEAGE")) && (
                <div className="mt-5">
                  <CoCreationLens marks={[0, 1, 6]} questions={["Quem mais participou da origem?", "É observação pessoal ou claim externo?"]} compact />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-seam-strong bg-ink-900/40 p-6 text-center">
              <p className="font-display text-xl text-mist-300">Selecione um nó ou uma aresta</p>
              <p className="text-[12px] text-mist-500 leading-relaxed mt-2">
                Clique no grafo, ou use a <span className="text-mist-300">lista acessível</span> com ↑ ↓ ↵. O caminho completo
                (ancestrais + descendentes) é realçado; o restante esmaece. Nada aqui implica adoção.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-seam bg-ink-950/70 p-5">
            <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-mist-600 mb-2.5">leitura do ciclo</p>
            <p className="font-mono text-[11px] leading-loose text-mist-400">
              <span className="text-lumen-300">SOURCE</span> → <span className="text-gild-300">LINEAGE</span> → WORK → IMPLEMENTATION → TEST/ASSURANCE → <span className="text-lumen-300">READBACK</span> → CORRECTION → <span className="text-gild-300">SUCCESSOR</span>
            </p>
            <p className="text-[11px] text-mist-600 leading-relaxed mt-3">
              DEPLOYMENT_LINEAGE é suportado pelo modelo com <span className="text-mist-400">zero arestas reais</span> — nada foi deployado.
            </p>
          </div>
        </aside>
      </main>

      <footer className="relative border-t border-seam mt-6">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[10px] tracking-[0.14em] uppercase text-mist-600">
          <span>aresta ≠ dependência canônica</span>
          <span>lifecycle ≠ evidência</span>
          <span>SOURCE_SHARED_BY ≠ AUTHOR</span>
          <span>{REGISTRY.length} blocos · {nodes.length - REGISTRY.length} âncoras</span>
        </div>
      </footer>
    </div>
  );
}
