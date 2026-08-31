/* ------------------------------------------------------------------ */
/*  Holo-Logoi · ledger governado de termos (P0)                       */
/* ------------------------------------------------------------------ */

import { useMemo, useState } from "react";
import { LOGOI_TERMS, LOGOI_STATES, type LogoiState } from "./logoiTerms";
import { CURRENTNESS_LABEL, EVIDENCE_RUNGS, SAFE_REL } from "../registry/model";
import { REGISTRY } from "../registry/queries";
import { useInspector, LifecycleChip } from "../registry/Inspector";
import { Scramble } from "../motion";

const STATE_TONE: Record<string, string> = {
  current: "border-lumen-500/50 text-lumen-300 bg-lumen-500/10",
  candidate: "border-mist-500/40 text-mist-300 bg-mist-500/5",
  research: "border-ember-400/40 text-ember-300 bg-ember-400/5",
  predecessor: "border-gild-400/40 text-gild-300 bg-gild-400/5",
  historical: "border-mist-600/40 text-mist-500 bg-mist-600/5",
  held: "border-ember-400/30 text-ember-300/80 bg-ember-400/5",
};

export default function Logoi() {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<LogoiState | "all">("all");
  const [selectedId, setSelectedId] = useState<string>(LOGOI_TERMS[0].id);
  const { open } = useInspector();

  const terms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LOGOI_TERMS.filter((t) => {
      if (stateFilter !== "all" && t.state !== stateFilter) return false;
      if (!q) return true;
      return [t.term, t.definition, ...t.aliases].join(" ").toLowerCase().includes(q);
    });
  }, [query, stateFilter]);

  const selected = LOGOI_TERMS.find((t) => t.id === selectedId) ?? terms[0] ?? LOGOI_TERMS[0];
  const related = selected.related.map((id) => LOGOI_TERMS.find((t) => t.id === id)).filter(Boolean);
  const linkedRecords = selected.registryIds.map((id) => REGISTRY.find((r) => r.id === id)).filter(Boolean);

  const grouped = useMemo(() => {
    const m = new Map<LogoiState, typeof LOGOI_TERMS>();
    for (const t of terms) {
      const arr = m.get(t.state) ?? [];
      arr.push(t);
      m.set(t.state, arr);
    }
    return m;
  }, [terms]);

  return (
    <div className="relative min-h-screen bg-ink-950 text-mist-200 font-body">
      {/* ambiente: estratos de significado */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[380, 560, 760, 980].map((d, i) => (
          <div
            key={d}
            className={`absolute rounded-full border ${i % 2 ? "border-gild-400/6" : "border-lumen-500/8"}`}
            style={{ width: d, height: d, left: "68%", top: "-12%", transform: "translateX(-50%)" }}
          />
        ))}
        <div className="absolute -bottom-40 -left-40 w-[560px] h-[560px] rounded-full" style={{ background: "radial-gradient(circle, rgba(233,188,98,0.07), transparent 65%)" }} />
      </div>

      <a href="#logoi-main" onClick={(e) => { e.preventDefault(); const el = document.getElementById("logoi-main"); el?.focus(); el?.scrollIntoView?.(); }} className="skip-link">
        pular para o ledger
      </a>

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
              <Scramble text="Holo-Logoi" />
            </h1>
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600 mt-2">
              ledger de termos · significado com proveniência · {LOGOI_TERMS.length} palavras governadas
            </p>
          </div>
          <p className="font-mono text-[10px] text-mist-500 max-w-xs leading-relaxed">
            palavra sem linhagem é <span className="text-ember-300">ornamento</span> · palavra com linhagem é{" "}
            <span className="text-gild-300">ativo</span>
          </p>
        </div>
      </header>

      <main id="logoi-main" tabIndex={-1} className="relative mx-auto max-w-7xl px-5 sm:px-8 py-10 pb-32 grid lg:grid-cols-12 gap-10">
        {/* índice */}
        <div className="lg:col-span-5 xl:col-span-4">
          <label className="relative block">
            <span className="sr-only">Buscar termo</span>
            <svg viewBox="0 0 20 20" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-600" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="9" cy="9" r="6" />
              <path d="M13.5 13.5 18 18" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="buscar termo ou definição…"
              className="w-full rounded-md border border-seam bg-ink-950/70 pl-9 pr-4 py-3 text-sm text-mist-100 placeholder:text-mist-600 outline-none focus:border-gild-400/60 transition-colors"
            />
          </label>

          <div className="flex flex-wrap gap-2 mt-4" role="group" aria-label="Filtrar por estado">
            <button
              onClick={() => setStateFilter("all")}
              aria-pressed={stateFilter === "all"}
              className={`px-3 py-1.5 rounded-full border font-mono text-[10px] tracking-[0.12em] uppercase transition-all duration-200 cursor-pointer focus-ring ${
                stateFilter === "all" ? "border-gild-400/60 bg-gild-400/10 text-gild-300" : "border-seam text-mist-500 hover:text-mist-200 hover:border-seam-strong"
              }`}
            >
              todos · {LOGOI_TERMS.length}
            </button>
            {LOGOI_STATES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStateFilter(stateFilter === s.id ? "all" : s.id)}
                aria-pressed={stateFilter === s.id}
                className={`px-3 py-1.5 rounded-full border font-mono text-[10px] tracking-[0.12em] uppercase transition-all duration-200 cursor-pointer focus-ring ${
                  stateFilter === s.id ? "border-gild-400/60 bg-gild-400/10 text-gild-300" : "border-seam text-mist-500 hover:text-mist-200 hover:border-seam-strong"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div aria-live="polite" className="sr-only">{terms.length} termos encontrados</div>

          <nav className="mt-6 space-y-6" aria-label="Termos">
            {LOGOI_STATES.filter((s) => (grouped.get(s.id) ?? []).length > 0).map((s) => (
              <div key={s.id}>
                <p className="font-mono text-[9px] tracking-[0.26em] uppercase text-mist-600 mb-2.5 flex items-center gap-3">
                  {s.label}
                  <span className="flex-1 h-px bg-seam" aria-hidden="true" />
                  <span className="text-gild-400">{(grouped.get(s.id) ?? []).length}</span>
                </p>
                <ul className="space-y-1.5">
                  {(grouped.get(s.id) ?? []).map((t) => {
                    const isSel = t.id === selected.id;
                    return (
                      <li key={t.id}>
                        <button
                          onClick={() => setSelectedId(t.id)}
                          aria-current={isSel ? "true" : undefined}
                          className={`w-full text-left px-4 py-2.5 rounded-md border transition-all duration-200 cursor-pointer focus-ring group ${
                            isSel ? "border-gild-400/60 bg-gild-400/8 shadow-[0_0_22px_rgba(233,188,98,0.10)]" : "border-transparent hover:border-seam hover:bg-ink-900/60"
                          }`}
                        >
                          <span className={`font-display text-base transition-colors duration-200 ${isSel ? "text-gild-300" : "text-mist-100 group-hover:text-mist-50"}`}>{t.term}</span>
                          <span className="block font-mono text-[9px] text-mist-600 mt-0.5">degrau {t.rung} · {EVIDENCE_RUNGS[t.rung]}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {terms.length === 0 && (
              <p className="text-sm text-mist-500 rounded-md border border-seam p-5">Nenhum termo encontrado — o ledger cresce por inclusão governada, nunca por invenção.</p>
            )}
          </nav>
        </div>

        {/* detalhe */}
        <div className="lg:col-span-7 xl:col-span-8">
          <article key={selected.id} className="anim-rise rounded-xl border border-seam-strong bg-gradient-to-b from-ink-900 to-ink-950 p-7 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-gild-400">termo</p>
                <h2 className="font-display text-4xl sm:text-5xl font-medium text-mist-50 mt-3 leading-[1.05]">{selected.term}</h2>
                {selected.aliases.length > 0 && (
                  <p className="font-mono text-[11px] text-mist-500 mt-3">também: {selected.aliases.join(" · ")}</p>
                )}
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`px-3 py-1.5 rounded-full border font-mono text-[10px] tracking-[0.14em] uppercase ${STATE_TONE[selected.state] ?? STATE_TONE.candidate}`}>
                  {CURRENTNESS_LABEL[selected.state] ?? selected.state}
                </span>
                <span className="px-3 py-1.5 rounded-full border border-lumen-500/40 text-lumen-300 bg-lumen-500/5 font-mono text-[10px] tracking-[0.14em] uppercase">
                  evidência {selected.rung}/6 · {EVIDENCE_RUNGS[selected.rung]}
                </span>
              </div>
            </div>

            <p className="font-display italic text-xl sm:text-2xl text-mist-200 leading-relaxed mt-8 max-w-3xl">{selected.definition}</p>

            <div className="mt-8 rounded-lg border border-lumen-500/25 bg-lumen-500/5 px-5 py-4">
              <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-lumen-300">base da crença · why we believe this</p>
              <p className="text-sm text-mist-300 leading-relaxed mt-2">{selected.basis}</p>
            </div>

            {/* linhagem */}
            <h3 className="font-display text-2xl font-medium text-mist-50 mt-10">Linhagem</h3>
            <ol className="mt-4 space-y-3">
              {selected.lineage.map((s, i) => (
                <li key={s.id} className="relative pl-9">
                  <span className="absolute left-0 top-1 grid place-items-center w-6 h-6 rounded-full border border-gild-400/40 bg-ink-950 font-mono text-[9px] text-gild-300">{i + 1}</span>
                  <div className="rounded-md border border-seam bg-ink-950/50 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <span className="text-sm text-mist-100">{s.label}</span>
                      <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-mist-600">{s.sourceClass} · {s.role} · {s.access}</span>
                      {s.observedAt && <span className="font-mono text-[9px] text-mist-600">obs. {s.observedAt}</span>}
                    </div>
                    <p className="text-xs text-mist-500 leading-relaxed mt-1.5">{s.whyWeBelieveThis}</p>
                    {s.safeUrl && (
                      <a href={s.safeUrl} target="_blank" rel={SAFE_REL} className="inline-flex items-center gap-1.5 font-mono text-[10px] text-gild-300 mt-2 hover:text-gild-400 transition-colors focus-ring rounded">
                        fonte pública ↗
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            {/* relacionados + blocos */}
            <div className="grid sm:grid-cols-2 gap-8 mt-10">
              <div>
                <h3 className="font-display text-xl font-medium text-mist-50">Termos relacionados</h3>
                <div className="flex flex-wrap gap-2 mt-3.5">
                  {related.map((t) => (
                    <button
                      key={t!.id}
                      onClick={() => setSelectedId(t!.id)}
                      className="px-3.5 py-2 rounded-full border border-seam text-sm text-mist-300 hover:border-gild-400/50 hover:text-gild-300 transition-all duration-200 cursor-pointer focus-ring"
                    >
                      {t!.term}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-display text-xl font-medium text-mist-50">Blocos no registry</h3>
                <div className="flex flex-wrap gap-2 mt-3.5">
                  {linkedRecords.map((r) => (
                    <button
                      key={r!.id}
                      onClick={() => open(r!)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-seam text-sm text-mist-300 hover:border-lumen-500/50 hover:text-lumen-300 transition-all duration-200 cursor-pointer focus-ring"
                    >
                      {r!.canonicalName}
                      <LifecycleChip lifecycle={r!.lifecycle} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* nota de valor */}
            <div className="mt-10 rounded-lg border border-gild-400/30 bg-gild-400/5 px-5 py-4">
              <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-gild-300">valor de continuidade</p>
              <p className="font-display italic text-lg text-mist-200 leading-relaxed mt-2">{selected.positiveNote}</p>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
