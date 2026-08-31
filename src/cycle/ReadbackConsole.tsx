/* ------------------------------------------------------------------ */
/*  Ciclo Vivo · Readback Console (#/readback)                         */
/*  Observações externas sobre itens reais. READBACK ≠ ACCEPTANCE.     */
/*  Máquina ramificada: CONTRADICTED/UNRESOLVED são estados válidos.   */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useState } from "react";
import {
  READBACK_LABEL,
  READBACK_STATES,
  READBACK_TONE,
  TRANSITIONS,
  canTransition,
  exportEvidenceCandidate,
  handoffEvidenceToDiff,
  loadReadbacks,
  newReadbackId,
  readbacksForTarget,
  saveReadbacks,
  type ReadbackRecord,
  type ReadbackState,
} from "./readbackModel";
import { READBACK_TARGET_KEY, focusLineageNode } from "./lineageModel";
import { REGISTRY } from "../registry/queries";
import { useInspector } from "../registry/Inspector";
import { Scramble } from "../motion";

const inputCls =
  "w-full rounded-md border border-seam bg-ink-950/70 px-3.5 py-2.5 text-sm text-mist-100 placeholder:text-mist-600 outline-none focus:border-lumen-500/60 transition-colors";

function StateChip({ state, representative }: { state: ReadbackState; representative?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono text-[9px] uppercase tracking-[0.14em] whitespace-nowrap ${READBACK_TONE[state]}`}>
      <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
      {READBACK_LABEL[state]}
    </span>
  );
}

export default function ReadbackConsole() {
  const { openById } = useInspector();
  const [readbacks, setReadbacks] = useState<ReadbackRecord[]>(() => loadReadbacks());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState("");
  const [notice, setNotice] = useState("");

  /* formulário */
  const [targetId, setTargetId] = useState("");
  const [targetCustom, setTargetCustom] = useState("");
  const [observer, setObserver] = useState("");
  const [observedAt, setObservedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [sourceRef, setSourceRef] = useState("");
  const [sourceIsPublic, setSourceIsPublic] = useState(false);
  const [raw, setRaw] = useState("");
  const [pointers, setPointers] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [formError, setFormError] = useState("");

  /* alvo pré-carregado via handoff */
  useEffect(() => {
    try {
      const t = sessionStorage.getItem(READBACK_TARGET_KEY);
      if (t) {
        sessionStorage.removeItem(READBACK_TARGET_KEY);
        setTargetId(t);
      }
    } catch {
      /* sem storage */
    }
  }, []);

  const selected = readbacks.find((r) => r.id === selectedId);

  const filtered = useMemo(() => {
    const list = stateFilter ? readbacks.filter((r) => r.state === stateFilter) : readbacks;
    return [...list].sort((a, z) => z.createdAt.localeCompare(a.createdAt));
  }, [readbacks, stateFilter]);

  const targetReadbacks = useMemo(() => (targetId ? readbacksForTarget(readbacks, targetId) : []), [readbacks, targetId]);

  const submit = () => {
    const label = targetId === "__custom" ? targetCustom.trim() : REGISTRY.find((r) => r.id === targetId)?.canonicalName ?? "";
    if (!label || observer.trim().length < 3 || raw.trim().length < 3) {
      setFormError("Alvo, observador (≥ 3 caracteres) e observação bruta (≥ 3 caracteres) são obrigatórios.");
      return;
    }
    setFormError("");
    const rec: ReadbackRecord = {
      id: newReadbackId(),
      targetId: targetId === "__custom" ? `custom-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}` : targetId,
      targetLabel: label,
      observer: observer.trim(),
      observedAt,
      sourceRef: sourceRef.trim() || undefined,
      sourceIsPublic,
      rawObservation: raw.trim(),
      evidencePointers: pointers.split("\n").map((p) => p.trim()).filter(Boolean),
      interpretation: interpretation.trim(),
      state: "OBSERVED",
      contradictionFlag: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const next = saveReadbacks([rec, ...readbacks]);
    setReadbacks(next);
    setSelectedId(rec.id);
    setNotice("Readback registrado como OBSERVED. Nenhum aceite ocorreu — READBACK ≠ ACCEPTANCE.");
    setRaw("");
    setPointers("");
    setInterpretation("");
    setSourceRef("");
  };

  const transition = (r: ReadbackRecord, to: ReadbackState) => {
    const guard = canTransition(r, to);
    if (!guard.ok) {
      setNotice(guard.reason);
      return;
    }
    const next = saveReadbacks(readbacks.map((x) => (x.id === r.id ? { ...x, state: to, contradictionFlag: to === "CONTRADICTED" ? true : x.contradictionFlag } : x)));
    setReadbacks(next);
    setNotice(`Estado movido para ${READBACK_LABEL[to]} com transição legítima registrada.`);
  };

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
              <Scramble text="Readback Console" />
            </h1>
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600 mt-2">ciclo vivo · observação externa ≠ aceite</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full border border-ember-400/45 text-ember-300 font-mono text-[9px] uppercase tracking-[0.14em]">readback ≠ acceptance</span>
            <span className="px-3 py-1.5 rounded-full border border-seam-strong text-mist-400 font-mono text-[9px] uppercase tracking-[0.14em]">só EVIDENCE_CANDIDATE</span>
            <span className="hidden md:inline-flex px-3 py-1.5 rounded-full border border-lumen-500/40 text-lumen-300 font-mono text-[9px] uppercase tracking-[0.14em]">máquina ramificada</span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-5 sm:px-8 py-8 grid lg:grid-cols-12 gap-6 items-start">
        {/* formulário + máquina */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-lg border border-seam-strong bg-gradient-to-b from-ink-850 to-ink-900 p-6">
            <h2 className="font-mono text-[10px] tracking-[0.26em] uppercase text-lumen-400">registrar observação</h2>
            <p className="text-[12.5px] text-mist-400 leading-relaxed mt-2.5">
              Uma observação entra sempre como <span className="text-lumen-300">OBSERVED</span> — nunca como VERIFIED. Estrutura mínima; maturação exige evidência e fluxo governado.
            </p>

            <div className="space-y-3.5 mt-5">
              <div>
                <label htmlFor="rb-target" className="block font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-1.5">alvo (registry ou livre)</label>
                <select id="rb-target" value={targetId} onChange={(e) => setTargetId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                  <option value="">selecionar alvo…</option>
                  {REGISTRY.map((r) => (
                    <option key={r.id} value={r.id}>{r.canonicalName}</option>
                  ))}
                  <option value="__custom">outro (texto livre)</option>
                </select>
                {targetId === "__custom" && (
                  <input value={targetCustom} onChange={(e) => setTargetCustom(e.target.value)} placeholder="nome do alvo livre…" aria-label="Alvo livre" className={`${inputCls} mt-2`} />
                )}
                {targetId && targetId !== "__custom" && targetReadbacks.length > 0 && (
                  <p className="font-mono text-[9px] text-gild-300/90 mt-1.5">{targetReadbacks.length} readback(s) existente(s) para este alvo</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rb-observer" className="block font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-1.5">observador / fonte</label>
                  <input id="rb-observer" value={observer} onChange={(e) => setObserver(e.target.value)} placeholder="quem observou…" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="rb-date" className="block font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-1.5">data da observação</label>
                  <input id="rb-date" type="date" value={observedAt} onChange={(e) => setObservedAt(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label htmlFor="rb-url" className="block font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-1.5">URL / referência (opcional)</label>
                <input id="rb-url" value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} placeholder="https://… ou referência interna" className={inputCls} />
                <label className="flex items-center gap-2.5 mt-2 text-[11.5px] text-mist-400 cursor-pointer">
                  <input type="checkbox" checked={sourceIsPublic} onChange={(e) => setSourceIsPublic(e.target.checked)} className="accent-lumen-500 w-3.5 h-3.5" />
                  referência público-segura (pode aparecer em export/âncora)
                </label>
              </div>
              <div>
                <label htmlFor="rb-raw" className="block font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-1.5">observação bruta *</label>
                <textarea id="rb-raw" value={raw} onChange={(e) => setRaw(e.target.value)} rows={3} placeholder="o que foi observado, sem edição…" className={inputCls} />
              </div>
              <div>
                <label htmlFor="rb-pointers" className="block font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-1.5">ponteiros de evidência (um por linha)</label>
                <textarea id="rb-pointers" value={pointers} onChange={(e) => setPointers(e.target.value)} rows={2} placeholder="logs, links, atas…" className={inputCls} />
              </div>
              <div>
                <label htmlFor="rb-interp" className="block font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-1.5">interpretação</label>
                <textarea id="rb-interp" value={interpretation} onChange={(e) => setInterpretation(e.target.value)} rows={2} placeholder="leitura preliminar — obrigatória p/ VERIFIED" className={inputCls} />
              </div>

              {formError && (
                <p role="alert" className="text-[12px] text-ember-300 border border-ember-400/40 bg-ember-400/8 rounded-md px-3.5 py-2.5">
                  {formError}
                </p>
              )}

              <button onClick={submit} className="w-full px-4 py-3 rounded-md border border-lumen-500/60 bg-lumen-500/10 text-lumen-300 font-mono text-[11px] uppercase tracking-[0.2em] hover:bg-lumen-500/20 transition-all duration-200 cursor-pointer focus-ring hover:shadow-[0_0_28px_rgba(62,207,178,0.18)]">
                registrar como OBSERVED
              </button>
            </div>
          </div>

          {/* máquina de estados ramificada */}
          <div className="rounded-lg border border-seam bg-ink-900/60 p-5">
            <h2 className="font-mono text-[10px] tracking-[0.26em] uppercase text-mist-500 mb-4">máquina de estados — ramificada, não linear</h2>
            <div className="grid grid-cols-3 gap-2">
              {READBACK_STATES.map((s) => (
                <div key={s} className={`rounded-md border px-2.5 py-2 text-center ${READBACK_TONE[s]}`}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em]">{READBACK_LABEL[s]}</p>
                  <p className="font-mono text-[8px] text-mist-600 mt-1">→ {(TRANSITIONS[s] ?? []).map((t) => READBACK_LABEL[t]).join(" · ") || "—"}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-mist-500 leading-relaxed mt-4">
              <span className="text-ember-300">CONTRADICTED</span> e <span className="text-ember-300/80">UNRESOLVED</span> são ramos válidos — não falhas após VERIFIED.
              VERIFIED exige ponteiro de evidência + corroboração prévia + interpretação.
            </p>
          </div>
        </div>

        {/* lista + detalhe */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar readbacks por estado">
            <button onClick={() => setStateFilter("")} aria-pressed={stateFilter === ""} className={`px-3 py-1.5 rounded-md border font-mono text-[9px] uppercase tracking-[0.14em] transition-colors cursor-pointer focus-ring ${stateFilter === "" ? "border-lumen-500/60 text-lumen-300 bg-lumen-500/8" : "border-seam text-mist-500 hover:text-mist-300"}`}>
              todos · {readbacks.length}
            </button>
            {READBACK_STATES.map((s) => {
              const n = readbacks.filter((r) => r.state === s).length;
              return (
                <button key={s} onClick={() => setStateFilter(stateFilter === s ? "" : s)} aria-pressed={stateFilter === s} className={`px-3 py-1.5 rounded-md border font-mono text-[9px] uppercase tracking-[0.14em] transition-colors cursor-pointer focus-ring ${stateFilter === s ? "border-lumen-500/60 text-lumen-300 bg-lumen-500/8" : "border-seam text-mist-500 hover:text-mist-300"}`}>
                  {READBACK_LABEL[s]} · {n}
                </button>
              );
            })}
          </div>

          {notice && (
            <p role="status" className="text-[12.5px] text-mist-200 border border-lumen-500/40 bg-lumen-500/8 rounded-md px-4 py-3" aria-live="polite">
              {notice}
            </p>
          )}

          <ul className="space-y-3">
            {filtered.map((r) => {
              const sel = selectedId === r.id;
              return (
                <li key={r.id}>
                  <button onClick={() => setSelectedId(r.id)} aria-pressed={sel} className={`w-full text-left rounded-lg border p-5 transition-all duration-300 cursor-pointer focus-ring ${sel ? "border-lumen-500/60 bg-lumen-500/8" : "border-seam bg-ink-900/60 hover:border-seam-strong hover:-translate-y-0.5"}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <StateChip state={r.state} />
                      {r.contradictionFlag && <span className="px-2 py-0.5 rounded-full border border-ember-400/50 text-ember-300 font-mono text-[8px] uppercase tracking-[0.14em]">contradição</span>}
                      {r.representative && <span className="px-2 py-0.5 rounded-full border border-ember-400/50 text-ember-300 font-mono text-[8px] uppercase tracking-[0.14em]">representativo · demo</span>}
                    </div>
                    <h3 className="font-display text-lg font-medium text-mist-50 leading-snug mt-3">alvo: {r.targetLabel}</h3>
                    <p className="text-[12.5px] text-mist-400 leading-relaxed mt-1.5 line-clamp-2">{r.rawObservation}</p>
                    <p className="font-mono text-[10px] text-mist-600 mt-2">{r.observer} · {r.observedAt} · evidências: {r.evidencePointers.length}</p>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected && (
            <article className="rounded-lg border border-seam-strong bg-gradient-to-b from-ink-850 to-ink-900 p-6" aria-live="polite">
              <div className="flex flex-wrap items-center gap-2">
                <StateChip state={selected.state} />
                {selected.contradictionFlag && <span className="px-2 py-0.5 rounded-full border border-ember-400/50 text-ember-300 font-mono text-[8px] uppercase tracking-[0.14em]">contradição sinalizada</span>}
                {selected.representative && <span className="px-2 py-0.5 rounded-full border border-ember-400/50 text-ember-300 font-mono text-[8px] uppercase tracking-[0.14em]">representativo · demo</span>}
              </div>
              <h2 className="font-display text-2xl font-medium text-mist-50 leading-tight mt-3.5">alvo: {selected.targetLabel}</h2>

              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-5 text-[13px]">
                <div><dt className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600">observador</dt><dd className="text-mist-300 mt-1">{selected.observer}</dd></div>
                <div><dt className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600">observado em</dt><dd className="text-mist-300 mt-1">{selected.observedAt}</dd></div>
                <div className="sm:col-span-2"><dt className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600">referência</dt><dd className="text-mist-300 mt-1 break-all">{selected.sourceIsPublic && selected.sourceRef ? selected.sourceRef : selected.sourceRef ? "[referência não público-segura — não exibida como âncora]" : "—"}</dd></div>
                <div className="sm:col-span-2"><dt className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600">observação bruta</dt><dd className="text-mist-200 leading-relaxed mt-1">{selected.rawObservation}</dd></div>
                <div className="sm:col-span-2"><dt className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600">ponteiros de evidência</dt><dd className="text-mist-300 mt-1">{selected.evidencePointers.length > 0 ? selected.evidencePointers.join(" · ") : "nenhum — VERIFIED bloqueado"}</dd></div>
                <div className="sm:col-span-2"><dt className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600">interpretação</dt><dd className="text-mist-400 leading-relaxed mt-1">{selected.interpretation || "—"}</dd></div>
                {selected.notes && <div className="sm:col-span-2"><dt className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600">notas</dt><dd className="text-mist-400 leading-relaxed mt-1">{selected.notes}</dd></div>}
              </dl>

              {/* transições guardadas */}
              <div className="mt-5 border-t border-seam pt-4">
                <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600 mb-2.5">mover estado — transições legítimas apenas</p>
                <div className="flex flex-wrap gap-2">
                  {READBACK_STATES.filter((s) => s !== selected.state).map((s) => {
                    const guard = canTransition(selected, s);
                    return (
                      <button
                        key={s}
                        onClick={() => transition(selected, s)}
                        disabled={!guard.ok}
                        title={guard.ok ? `mover para ${READBACK_LABEL[s]}` : guard.reason}
                        aria-label={`mover para ${READBACK_LABEL[s]}${guard.ok ? "" : ` — bloqueado: ${guard.reason}`}`}
                        className={`px-3 py-2 rounded-md border font-mono text-[9px] uppercase tracking-[0.14em] transition-colors cursor-pointer focus-ring ${
                          guard.ok ? `${READBACK_TONE[s]} hover:bg-ink-800` : "border-seam text-mist-600 opacity-45 cursor-not-allowed"
                        }`}
                      >
                        → {READBACK_LABEL[s]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ações */}
              <div className="mt-5 grid sm:grid-cols-3 gap-2">
                <button onClick={() => handoffEvidenceToDiff(selected)} className="px-4 py-2.5 rounded-md border border-lumen-500/50 text-lumen-300 font-mono text-[10px] uppercase tracking-[0.14em] hover:bg-lumen-500/10 transition-colors cursor-pointer focus-ring">
                  EVIDENCE_CANDIDATE → Snapshot Diff
                </button>
                <button onClick={() => focusLineageNode(selected.targetId)} className="px-4 py-2.5 rounded-md border border-gild-400/50 text-gild-300 font-mono text-[10px] uppercase tracking-[0.14em] hover:bg-gild-400/10 transition-colors cursor-pointer focus-ring">
                  abrir alvo na linhagem
                </button>
                {REGISTRY.some((r) => r.id === selected.targetId) && (
                  <button onClick={() => openById(selected.targetId)} className="px-4 py-2.5 rounded-md border border-seam-strong text-mist-300 font-mono text-[10px] uppercase tracking-[0.14em] hover:bg-ink-800 transition-colors cursor-pointer focus-ring">
                    inspecionar alvo
                  </button>
                )}
              </div>
              <p className="mt-4 font-mono text-[9.5px] text-mist-600">
                export pré-visualização: {exportEvidenceCandidate(selected).records[0]?.lifecycle ?? "—"} · AIPFIT: REGISTRATION_NOT_REQUESTED
              </p>
            </article>
          )}
        </div>
      </main>

      <footer className="relative border-t border-seam mt-6">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[10px] tracking-[0.14em] uppercase text-mist-600">
          <span>READBACK ≠ ACCEPTANCE</span>
          <span>OBSERVED ≠ VERIFIED</span>
          <span>export: somente EVIDENCE_CANDIDATE</span>
          <span>{readbacks.length} readbacks locais</span>
        </div>
      </footer>
    </div>
  );
}
