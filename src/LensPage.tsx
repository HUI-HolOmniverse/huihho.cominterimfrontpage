/* ------------------------------------------------------------------ */
/*  Lentes globais · Currentness / Evidência / Fonte (P3)              */
/*  Três perguntas honestas sobre o MESMO registry.                    */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useState } from "react";
import {
  CURRENTNESS,
  CURRENTNESS_LABEL,
  EVIDENCE_RUNGS,
  SOURCE_CLASSES,
  SOURCE_CLASS_LABEL,
  SAFE_REL,
  type BuildingBlockRecord,
} from "./registry/model";
import { REGISTRY, REGISTRY_META, applyFilters, parseQuery, groupByCurrentness, groupByEvidence, groupBySourceClass } from "./registry/queries";
import { useInspector, LifecycleChip, RungChip } from "./registry/Inspector";
import { Scramble } from "./motion";
import SnapshotTool from "./apps/SnapshotTool";
import { LENS_FOCUS_KEY } from "./apps/intakeModel";

type Lens = "currentness" | "evidence" | "source" | "snapshot";

const LENS_META: { id: Lens; label: string; question: string }[] = [
  { id: "currentness", label: "Currentness", question: "O que está corrente — e o que permanece valioso sem estar?" },
  { id: "evidence", label: "Evidência", question: "Em qual degrau da escada governante cada bloco realmente está?" },
  { id: "source", label: "Fonte", question: "De onde vem cada afirmação — primária, derivada, pública ou protegida?" },
  { id: "snapshot", label: "Snapshot", question: "Como um snapshot externo (ex.: PR #111) entra — reclassificando e retendo, sem apagar nada?" },
];

export default function LensPage() {
  const [lens, setLens] = useState<Lens>(() => {
    try {
      return sessionStorage.getItem(LENS_FOCUS_KEY) === "snapshot" ? "snapshot" : "currentness";
    } catch {
      return "currentness";
    }
  });
  const [query, setQuery] = useState("");
  const { open } = useInspector();

  /* foco de lente vindo de handoff é consumido uma única vez */
  useEffect(() => {
    try {
      sessionStorage.removeItem(LENS_FOCUS_KEY);
    } catch {
      /* sem storage — lente padrão permanece */
    }
  }, []);

  const records = useMemo(() => (query.trim() ? applyFilters(REGISTRY, parseQuery(query)) : REGISTRY), [query]);

  const currentnessGroups = useMemo(() => groupByCurrentness(records), [records]);
  const evidenceGroups = useMemo(() => groupByEvidence(records), [records]);
  const sourceGroups = useMemo(() => groupBySourceClass(records), [records]);

  const active = LENS_META.find((l) => l.id === lens)!;

  return (
    <div className="relative min-h-screen bg-ink-950 text-mist-200 font-body">
      <div className="atlas-grid absolute inset-x-0 top-0 h-[420px] pointer-events-none" aria-hidden="true" />

      {/* topo */}
      <header className="relative border-b border-seam bg-ink-900/60">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-6 flex flex-wrap items-center gap-4">
          <a href="#/" className="group inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase text-mist-500 hover:text-lumen-300 transition-colors focus-ring">
            <svg viewBox="0 0 20 12" className="w-4 h-2.5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M19 6H3M8 1.5 3 6l5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            portal
          </a>
          <span className="hidden sm:block w-px h-5 bg-seam-strong" aria-hidden="true" />
          <div className="flex-1 min-w-[220px]">
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-mist-50 leading-none">
              <Scramble text="Lentes do registry" />
            </h1>
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600 mt-2">
              {REGISTRY_META.source} · {REGISTRY_META.generatedAt} · sha {REGISTRY_META.sha?.slice(0, 7)}
            </p>
          </div>
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Filtrar registry</span>
            <svg viewBox="0 0 20 20" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-600" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="9" cy="9" r="6" />
              <path d="M13.5 13.5 18 18" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="filtrar · ex.: family:iceberg"
              className="w-full rounded-md border border-seam bg-ink-950/70 pl-9 pr-16 py-2.5 text-sm text-mist-100 placeholder:text-mist-600 outline-none focus:border-lumen-500/60 transition-colors font-mono text-[12px]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 kbd">ctrl K</span>
          </label>
        </div>
      </header>

      {/* seletor de lente */}
      <nav className="relative border-b border-seam bg-ink-900/40" aria-label="Lentes">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 flex gap-2 py-4 overflow-x-auto [scrollbar-width:none]">
          {LENS_META.map((l) => (
            <button
              key={l.id}
              onClick={() => setLens(l.id)}
              aria-pressed={lens === l.id}
              className={`shrink-0 px-5 py-3 rounded-md border font-mono text-[11px] tracking-[0.16em] uppercase transition-all duration-300 cursor-pointer focus-ring ${
                lens === l.id
                  ? "border-lumen-500/60 bg-lumen-500/10 text-lumen-300 shadow-[0_0_24px_rgba(62,207,178,0.18)]"
                  : "border-seam text-mist-500 hover:text-mist-200 hover:border-seam-strong"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="relative mx-auto max-w-6xl px-5 sm:px-8 py-12 pb-32">
        <p className="font-display italic text-lg sm:text-xl text-mist-400 max-w-2xl leading-relaxed mb-10">{active.question}</p>
        <div aria-live="polite" className="sr-only">
          {records.length} blocos no filtro atual
        </div>

        {lens === "currentness" && (
          <div className="space-y-10">
            {CURRENTNESS.map((c) => {
              const list = currentnessGroups.get(c) ?? [];
              if (list.length === 0) return null;
              return (
                <section key={c} aria-label={`Estado ${CURRENTNESS_LABEL[c]}`}>
                  <div className="flex items-baseline gap-4 mb-4">
                    <h2 className="font-display text-2xl font-medium text-mist-50">{CURRENTNESS_LABEL[c]}</h2>
                    <span className="font-mono text-[10px] tracking-[0.2em] text-lumen-400">{list.length} bloco{list.length > 1 ? "s" : ""}</span>
                    <span className="flex-1 h-px bg-seam" aria-hidden="true" />
                  </div>
                  <RecordRows records={list} onOpen={open} />
                </section>
              );
            })}
          </div>
        )}

        {lens === "evidence" && (
          <div className="space-y-8">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-mist-600">
              escada epistêmica governante — não redefinida pelo registry
            </p>
            {EVIDENCE_RUNGS.map((rung, i) => {
              const list = evidenceGroups.get(i) ?? [];
              return (
                <section key={rung} aria-label={`Degrau ${rung}`}>
                  <div className="flex items-center gap-4 mb-3">
                    <span className={`grid place-items-center w-9 h-9 rounded-full border font-mono text-sm ${i <= 3 ? "border-seam-strong text-mist-400" : "border-gild-400/60 text-gild-300"}`}>
                      {i}
                    </span>
                    <h2 className="font-display text-2xl font-medium text-mist-50">{rung}</h2>
                    <span className="font-mono text-[10px] tracking-[0.2em] text-lumen-400">{list.length}</span>
                    <span className="flex-1 h-px bg-seam" aria-hidden="true" />
                  </div>
                  {list.length > 0 ? (
                    <RecordRows records={list} onOpen={open} compact />
                  ) : (
                    <p className="pl-[52px] text-sm text-mist-600 italic">Nenhum bloco neste degrau — ausência declarada, nunca fabricada.</p>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {lens === "source" && (
          <div className="space-y-10">
            {SOURCE_CLASSES.map((sc) => {
              const list = sourceGroups.get(sc) ?? [];
              if (list.length === 0) return null;
              return (
                <section key={sc} aria-label={`Fonte ${SOURCE_CLASS_LABEL[sc]}`}>
                  <div className="flex items-baseline gap-4 mb-4 flex-wrap">
                    <h2 className="font-display text-2xl font-medium text-mist-50">{SOURCE_CLASS_LABEL[sc]}</h2>
                    <span className="font-mono text-[10px] tracking-[0.2em] text-lumen-400">{list.length} referência{list.length > 1 ? "s" : ""}</span>
                    <span className="flex-1 h-px bg-seam" aria-hidden="true" />
                    {sc === "github-private" && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ember-300 border border-ember-400/40 rounded-full px-2.5 py-1">
                        presença exposta · corpos e URLs jamais
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {list.map((r) => {
                      const refs = r.sourceRefs.filter((s) => s.sourceClass === sc);
                      return (
                        <article key={r.id} className="rounded-lg border border-seam bg-ink-900/60 p-5 hover:border-seam-strong transition-colors duration-300">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <button onClick={() => open(r)} className="text-left group cursor-pointer focus-ring rounded">
                              <p className="font-display text-lg text-mist-50 group-hover:text-lumen-300 transition-colors">{r.canonicalName}</p>
                              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-mist-600 mt-1">{r.kind} · {r.family}</p>
                            </button>
                            <div className="flex items-center gap-2">
                              <LifecycleChip lifecycle={r.lifecycle} />
                              <button onClick={() => open(r)} className="px-3 py-1.5 rounded-md border border-seam font-mono text-[9px] uppercase tracking-[0.14em] text-mist-400 hover:text-lumen-300 hover:border-lumen-500/50 transition-colors cursor-pointer focus-ring">
                                inspecionar
                              </button>
                            </div>
                          </div>
                          <ul className="mt-4 space-y-2">
                            {refs.map((s) => (
                              <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-mist-500">
                                <span className={s.role === "primary" ? "text-lumen-300" : "text-mist-400"}>{s.role}</span>
                                <span className={`px-1.5 py-0.5 rounded border ${s.access === "public" ? "border-lumen-500/40 text-lumen-400/90" : "border-ember-400/40 text-ember-300"}`}>{s.access}</span>
                                {s.sha && <span className="text-gild-300/80">sha {s.sha.slice(0, 12)}…</span>}
                                {s.observedAt && <span>obs. {s.observedAt}</span>}
                                {s.safeUrl ? (
                                  <a href={s.safeUrl} target="_blank" rel={SAFE_REL} className="text-lumen-400/80 hover:text-lumen-300 focus-ring rounded">
                                    destino público ↗
                                  </a>
                                ) : (
                                  <span className="text-ember-300/70 italic">metadado seguro — sem URL</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {lens === "snapshot" && <SnapshotTool />}

        <footer className="mt-20 border-t border-seam pt-8 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[10px] tracking-[0.14em] uppercase text-mist-600">
          <span>HUI ≠ ICEBERG</span>
          <span>PRESENCE ≠ ENDORSEMENT</span>
          <span>HISTORICAL ≠ OBSOLETE</span>
          <span>mesmo registry · quatro perguntas</span>
        </footer>
      </main>
    </div>
  );
}

function RecordRows({
  records,
  onOpen,
  compact = false,
}: {
  records: BuildingBlockRecord[];
  onOpen: (r: BuildingBlockRecord) => void;
  compact?: boolean;
}) {
  return (
    <ul className={compact ? "pl-[52px] space-y-2" : "space-y-2"}>
      {records.map((r) => (
        <li key={r.id}>
          <button
            onClick={() => onOpen(r)}
            className="group w-full flex items-center gap-4 rounded-lg border border-seam bg-ink-900/50 px-5 py-3.5 text-left transition-all duration-200 hover:border-lumen-500/45 hover:bg-ink-850 hover:translate-x-1 cursor-pointer focus-ring"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] text-mist-100 group-hover:text-lumen-300 transition-colors truncate">{r.canonicalName}</span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-mist-600 mt-1">
                {r.kind} · {r.family}
              </span>
            </span>
            <span className="hidden md:block shrink-0">
              <RungChip rung={r.evidence.rung} />
            </span>
            <span className="shrink-0">
              <LifecycleChip lifecycle={r.lifecycle} />
            </span>
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0 text-mist-600 group-hover:text-lumen-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M3 8h9M9 4.5 12.5 8 9 11.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
