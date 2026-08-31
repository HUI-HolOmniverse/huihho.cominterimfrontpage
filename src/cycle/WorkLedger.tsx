/* ------------------------------------------------------------------ */
/*  Ciclo Vivo · Work Ledger (#/ledger)                                */
/*  Histórico real de trabalho/co-criação. SHAs reais quando           */
/*  conhecidos — jamais inventados. Sem rankings, scores ou métricas.  */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useState } from "react";
import {
  CONTRIBUTOR_ROLES,
  IMPLEMENTATION_STATES,
  WORK_TYPES,
  WORK_ENTRIES,
  assertNoRankings,
  entryById,
  type Contributor,
  type WorkEntry,
} from "./workLedgerModel";
import { LEDGER_ENTRY_KEY, focusLineageNode, focusReadbackTarget, handoffRecordToDiff } from "./lineageModel";
import { loadReadbacks, readbacksForTarget } from "./readbackModel";
import { REGISTRY, byId } from "../registry/queries";
import { useInspector } from "../registry/Inspector";
import { Scramble } from "../motion";
import CoCreationLens from "./CoCreationLens";

const ROLE_LABEL: Record<string, string> = {
  SOURCE_AUTHOR: "autoria de fonte",
  COAUTHOR: "coautoria",
  CONTRIBUTOR: "contribuição",
  RESEARCHER: "pesquisa",
  IMPLEMENTER: "implementação",
  REVIEWER: "revisão",
  AI_ASSISTED: "assistido por IA",
  SOURCE_SHARED_BY: "compartilhou a fonte",
  UNRESOLVED_ATTRIBUTION: "atribuição não resolvida",
};

const IMPL_LABEL: Record<string, string> = {
  PROPOSED: "proposto",
  IMPLEMENTED: "implementado",
  TESTED: "testado",
  ASSURED: "assegurado",
  ACCEPTED: "aceito",
  MERGED: "merged",
  DEPLOYED: "deployed",
  EXTERNALLY_READ_BACK: "readback externo",
};

function ContributorChip({ c }: { c: Contributor }) {
  const isSharer = c.role === "SOURCE_SHARED_BY";
  return (
    <li className={`flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 rounded-md border ${isSharer ? "border-gild-400/40 bg-gild-400/5" : "border-seam bg-ink-950/50"}`}>
      <span className="text-[12px] text-mist-100">{c.name}</span>
      <span className="px-2 py-0.5 rounded-full border border-lumen-500/40 text-lumen-300 font-mono text-[8px] uppercase tracking-[0.12em]">{ROLE_LABEL[c.role] ?? c.role}</span>
      <span className="px-2 py-0.5 rounded-full border border-seam text-mist-500 font-mono text-[8px] uppercase tracking-[0.12em]">{c.attribution.replace(/_/g, " ")}</span>
      {c.representative && <span className="px-2 py-0.5 rounded-full border border-ember-400/50 text-ember-300 font-mono text-[8px] uppercase tracking-[0.12em]">demo</span>}
      {isSharer && <span className="w-full text-[10px] text-gild-300/90 font-mono">SOURCE_SHARED_BY ≠ AUTHOR — compartilhou a fonte; não é autoria</span>}
    </li>
  );
}

export default function WorkLedger() {
  const { openById } = useInspector();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readbacks] = useState(() => loadReadbacks());

  /* entrada vinda de outras superfícies */
  useEffect(() => {
    try {
      const entry = sessionStorage.getItem(LEDGER_ENTRY_KEY);
      if (entry) {
        sessionStorage.removeItem(LEDGER_ENTRY_KEY);
        setSelectedId(entry);
      }
    } catch {
      /* sem storage */
    }
  }, []);

  const filtered = useMemo(() => {
    return WORK_ENTRIES.filter((w) => {
      if (typeFilter && w.workType !== typeFilter) return false;
      if (stateFilter && w.implementationState !== stateFilter) return false;
      if (query) {
        const hay = [w.title, w.workId, w.notes, w.gitSha ?? "", ...w.sourceRefs, ...w.humanContributors.map((c) => c.name), ...w.aiContributors.map((c) => c.name)]
          .join(" ")
          .toLowerCase();
        if (!query.toLowerCase().split(/\s+/).every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }, [query, typeFilter, stateFilter]);

  const selected: WorkEntry | undefined = selectedId ? entryById(selectedId) : undefined;
  const relatedReadbacks = useMemo(
    () => (selected ? selected.registryRefs?.flatMap((id) => readbacksForTarget(readbacks, id)) ?? [] : []),
    [selected, readbacks],
  );

  const inputCls =
    "rounded-md border border-seam bg-ink-950/70 px-3.5 py-2.5 text-sm text-mist-100 placeholder:text-mist-600 outline-none focus:border-lumen-500/60 transition-colors";

  return (
    <div className="relative min-h-screen bg-ink-950 text-mist-200 font-body">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="atlas-grid absolute inset-x-0 top-0 h-[380px] pointer-events-none" aria-hidden="true" />

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
              <Scramble text="Work Ledger" />
            </h1>
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600 mt-2">ciclo vivo · trabalho, co-criação & asseguramento</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full border border-gild-400/45 text-gild-300 font-mono text-[9px] uppercase tracking-[0.14em]">SOURCE_SHARED_BY ≠ AUTHOR</span>
            <span className="px-3 py-1.5 rounded-full border border-seam-strong text-mist-400 font-mono text-[9px] uppercase tracking-[0.14em]">sem rankings · sem scores</span>
            <span className="hidden md:inline-flex px-3 py-1.5 rounded-full border border-lumen-500/40 text-lumen-300 font-mono text-[9px] uppercase tracking-[0.14em]">SHAs reais ou ausentes</span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-5 sm:px-8 py-8 grid lg:grid-cols-12 gap-6 items-start">
        {/* lista */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex flex-wrap gap-2" role="search" aria-label="Filtrar registros de trabalho">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="buscar título, SHA, fonte, pessoa…" aria-label="Buscar registros de trabalho" className={`flex-1 min-w-[180px] ${inputCls}`} />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filtrar por tipo de trabalho" className={`${inputCls} cursor-pointer`}>
              <option value="">tipo · todos</option>
              {WORK_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ").toLowerCase()}</option>
              ))}
            </select>
            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} aria-label="Filtrar por estado de implementação" className={`${inputCls} cursor-pointer`}>
              <option value="">estado · todos</option>
              {IMPLEMENTATION_STATES.map((s) => (
                <option key={s} value={s}>{IMPL_LABEL[s]}</option>
              ))}
            </select>
          </div>

          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-mist-600" aria-live="polite">
            {filtered.length} de {WORK_ENTRIES.length} registros
          </p>

          <ul className="space-y-3">
            {filtered.map((w) => {
              const sel = selectedId === w.workId;
              return (
                <li key={w.workId}>
                  <button
                    onClick={() => setSelectedId(w.workId)}
                    aria-pressed={sel}
                    className={`w-full text-left rounded-lg border p-5 transition-all duration-300 cursor-pointer focus-ring ${
                      sel ? "border-lumen-500/60 bg-lumen-500/8 shadow-[0_0_30px_rgba(62,207,178,0.1)]" : "border-seam bg-ink-900/60 hover:border-seam-strong hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full border border-lumen-500/40 text-lumen-300 font-mono text-[8px] uppercase tracking-[0.14em]">{w.workType.replace(/_/g, " ").toLowerCase()}</span>
                      <span className="px-2 py-0.5 rounded-full border border-gild-400/45 text-gild-300 font-mono text-[8px] uppercase tracking-[0.14em]">{IMPL_LABEL[w.implementationState]}</span>
                      {w.representative && <span className="px-2 py-0.5 rounded-full border border-ember-400/50 text-ember-300 font-mono text-[8px] uppercase tracking-[0.14em]">representativo · demo</span>}
                    </div>
                    <h2 className="font-display text-lg font-medium text-mist-50 leading-snug mt-3">{w.title}</h2>
                    <p className="font-mono text-[10px] text-mist-600 mt-2">
                      {w.workId} · {w.timestamp}
                      {w.gitSha ? (
                        <span className="text-lumen-300/90"> · sha {w.gitSha.slice(0, 12)}…</span>
                      ) : (
                        <span className="text-mist-500"> · SHA não cunhado — jamais inventado</span>
                      )}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500 mt-2">
                      teste: {w.testState.replace(/_/g, " ").toLowerCase()}
                      {typeof w.testCount === "number" && <span className="text-mist-300"> · {w.testCount}</span>}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* detalhe */}
        <aside className="lg:col-span-7 lg:sticky lg:top-8 space-y-5" aria-live="polite">
          {selected ? (
            <>
              <article className="rounded-lg border border-seam-strong bg-gradient-to-b from-ink-850 to-ink-900 p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full border border-lumen-500/40 text-lumen-300 font-mono text-[9px] uppercase tracking-[0.14em]">{selected.workType.replace(/_/g, " ").toLowerCase()}</span>
                  <span className="px-2.5 py-1 rounded-full border border-gild-400/45 text-gild-300 font-mono text-[9px] uppercase tracking-[0.14em]">{IMPL_LABEL[selected.implementationState]}</span>
                  {selected.representative && <span className="px-2.5 py-1 rounded-full border border-ember-400/50 text-ember-300 font-mono text-[9px] uppercase tracking-[0.14em]">representativo · demo</span>}
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-medium text-mist-50 leading-tight mt-4">{selected.title}</h2>
                <p className="font-mono text-[10px] text-mist-600 mt-2.5">{selected.workId} · {selected.timestamp}{selected.branch && <> · branch {selected.branch}</>}</p>

                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-6 text-[13px]">
                  <div>
                    <dt className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600">git sha</dt>
                    <dd className="font-mono text-[11px] text-lumen-300/90 mt-1 break-all">{selected.gitSha ?? "não cunhado — jamais inventado"}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600">estado de teste</dt>
                    <dd className="text-mist-300 mt-1">{selected.testState.replace(/_/g, " ").toLowerCase()}{typeof selected.testCount === "number" && ` · ${selected.testCount} testes`}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600">evidência</dt>
                    <dd className="text-mist-300 mt-1">{selected.evidenceState}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600">autoria</dt>
                    <dd className="text-mist-300 mt-1">{selected.authorshipState.replace(/_/g, " ").toLowerCase()}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600">fontes</dt>
                    <dd className="text-mist-300 mt-1">{selected.sourceRefs.join(" · ")}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600">notas</dt>
                    <dd className="text-mist-400 leading-relaxed mt-1">{selected.notes}</dd>
                  </div>
                </dl>

                {/* cadeia proposta ≠ … ≠ readback */}
                <p className="mt-6 font-mono text-[9.5px] leading-loose text-mist-500 border-t border-seam pt-4">
                  {IMPLEMENTATION_STATES.map((s, i) => (
                    <span key={s}>
                      <span className={s === selected.implementationState ? "text-gild-300" : "text-mist-600"}>{IMPL_LABEL[s]}</span>
                      {i < IMPLEMENTATION_STATES.length - 1 && <span className="text-mist-600"> ≠ </span>}
                    </span>
                  ))}
                </p>
              </article>

              {/* contribuições humanas + IA, sem ranking */}
              <div className="rounded-lg border border-seam bg-ink-900/60 p-6">
                <h3 className="font-mono text-[10px] tracking-[0.24em] uppercase text-mist-500 mb-4">contribuições — papéis explícitos, sem ordem de mérito</h3>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-2">humanas</p>
                    <ul className="space-y-2">
                      {selected.humanContributors.length > 0 ? selected.humanContributors.map((c, i) => <ContributorChip key={`${c.name}-${i}`} c={c} />) : <li className="text-[12px] text-mist-600">nenhuma registrada</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-2">IA (visível quando conhecida)</p>
                    <ul className="space-y-2">
                      {selected.aiContributors.length > 0 ? selected.aiContributors.map((c, i) => <ContributorChip key={`${c.name}-${i}`} c={c} />) : <li className="text-[12px] text-mist-600">nenhuma registrada</li>}
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-[10px] text-mist-600 font-mono">papéis do vocabulário: {CONTRIBUTOR_ROLES.map((r) => ROLE_LABEL[r]).join(" · ")}</p>
              </div>

              {/* lente de co-criação para padrões CO_CREATION_PATTERN */}
              {selected.workType === "CO_CREATION_PATTERN" && (
                <CoCreationLens marks={selected.chainMarks ?? []} questions={selected.questionsReturned ?? []} representative={selected.representative} />
              )}

              {/* conexões do ciclo */}
              <div className="rounded-lg border border-seam bg-ink-900/60 p-6">
                <h3 className="font-mono text-[10px] tracking-[0.24em] uppercase text-mist-500 mb-4">conexões do ciclo vivo</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {selected.registryRefs?.slice(0, 4).map((id) => {
                    const rec = byId.get(id);
                    if (!rec) return null;
                    return (
                      <div key={id} className="rounded-md border border-seam bg-ink-950/50 p-3.5">
                        <p className="text-[12px] text-mist-200 leading-snug">{rec.canonicalName}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          <button onClick={() => focusLineageNode(id)} className="px-2 py-1 rounded border border-lumen-500/40 text-lumen-300 font-mono text-[8px] uppercase tracking-[0.1em] hover:bg-lumen-500/10 transition-colors cursor-pointer focus-ring">linhagem</button>
                          <button onClick={() => openById(id)} className="px-2 py-1 rounded border border-seam-strong text-mist-300 font-mono text-[8px] uppercase tracking-[0.1em] hover:bg-ink-800 transition-colors cursor-pointer focus-ring">inspector</button>
                          <button onClick={() => handoffRecordToDiff(rec)} className="px-2 py-1 rounded border border-seam-strong text-mist-300 font-mono text-[8px] uppercase tracking-[0.1em] hover:bg-ink-800 transition-colors cursor-pointer focus-ring">snapshot diff</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {relatedReadbacks.length > 0 && (
                  <button onClick={() => focusReadbackTarget(relatedReadbacks[0].targetId)} className="mt-3 w-full px-4 py-2.5 rounded-md border border-ember-400/45 text-ember-300 font-mono text-[10px] uppercase tracking-[0.16em] hover:bg-ember-400/10 transition-colors cursor-pointer focus-ring">
                    ver readbacks relacionados · {relatedReadbacks.length}
                  </button>
                )}
                {selected.parentRefs.length > 0 && (
                  <p className="mt-3 font-mono text-[10px] text-mist-600">
                    predecessores: {selected.parentRefs.map((p) => entryById(p)?.title ?? p).join(" · ")}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-seam-strong bg-ink-900/40 p-8 text-center">
              <p className="font-display text-xl text-mist-300">Selecione um registro de trabalho</p>
              <p className="text-[13px] text-mist-500 leading-relaxed mt-2 max-w-md mx-auto">
                Cada entrada preserva SHAs reais quando conhecidos, contribuições humanas e de IA com papéis explícitos,
                e a cadeia <span className="font-mono text-[11px] text-mist-400">proposto ≠ implementado ≠ testado ≠ … ≠ readback externo</span>.
              </p>
            </div>
          )}
        </aside>
      </main>

      <footer className="relative border-t border-seam mt-6">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[10px] tracking-[0.14em] uppercase text-mist-600">
          <span>{WORK_ENTRIES.length} registros · assertNoRankings: {assertNoRankings(WORK_ENTRIES) ? "OK" : "FALHA"}</span>
          <span>{REGISTRY.length} blocos no registry (imutável aqui)</span>
          <span>TESTED ≠ ASSURED</span>
        </div>
      </footer>
    </div>
  );
}
