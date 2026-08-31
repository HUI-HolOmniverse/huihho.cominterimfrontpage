/* ------------------------------------------------------------------ */
/*  Triage Workbench — examina material em quarentena e produz         */
/*  candidatos estruturados. Nunca muta o Registry vivo; nunca         */
/*  sobrescreve a fonte bruta. Fila = REPRESENTATIVE DEMO enquanto o   */
/*  gateway não expõe list/update.                                     */
/* ------------------------------------------------------------------ */

import { useMemo, useRef, useState } from "react";
import { Reveal, Scramble } from "../motion";
import { SAFE_REL, type BuildingBlockRecord } from "../registry/model";
import { REGISTRY } from "../registry/queries";
import { useInspector, LifecycleChip } from "../registry/Inspector";
import { loadLocalDrops, isPublicSafe, maskUnlessPublic, SENSITIVITY_LABEL } from "./treasureModel";
import {
  LocalTriageAdapter,
  TENTATIVE_TAGS,
  THEMATIC_POINTERS,
  TRIAGE_STATUSES,
  TRIAGE_STATUS_LABEL,
  UNCLASSIFIED_VALUES,
  buildCandidateRecord,
  handoffCandidateToDiff,
  handoffCandidateToIntake,
  type TriageItem,
  type TriageStatus,
  type TentativeTag,
  type ThematicPointer,
} from "./triageModel";

export default function TriageWorkbench() {
  const adapterRef = useRef<LocalTriageAdapter | null>(null);
  if (!adapterRef.current) adapterRef.current = new LocalTriageAdapter(loadLocalDrops());
  const adapter = adapterRef.current;

  const [items, setItems] = useState<TriageItem[]>(() => adapter.list());
  const [selectedId, setSelectedId] = useState<string | null>(() => adapter.list()[0]?.id ?? null);
  const [filter, setFilter] = useState<TriageStatus | "ALL">("ALL");
  const [destPick, setDestPick] = useState("");
  const [question, setQuestion] = useState("");
  const [candidate, setCandidate] = useState<BuildingBlockRecord | null>(null);
  const [announce, setAnnounce] = useState("");
  const { open: inspect } = useInspector();

  const filtered = useMemo(() => (filter === "ALL" ? items : items.filter((i) => i.status === filter)), [items, filter]);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  const refresh = (next: TriageItem[]) => setItems(next);

  const mutateLayer = (fn: (item: TriageItem) => TriageItem["triage"]) => {
    if (!selected) return;
    refresh(adapter.setLayer(selected.id, fn(selected)));
  };

  const toggle = <T extends string>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const addDestination = () => {
    if (!destPick || !selected) return;
    mutateLayer((i) => ({ ...i.triage, destinations: i.triage.destinations.includes(destPick) ? i.triage.destinations : [...i.triage.destinations, destPick] }));
    setDestPick("");
    setAnnounce("Destino adicionado à interpretação secundária.");
  };

  const addQuestion = () => {
    const q = question.trim();
    if (!q || !selected) return;
    mutateLayer((i) => ({ ...i.triage, questions: [...i.triage.questions, q] }));
    setQuestion("");
    setAnnounce("Pergunta registrada — sem obrigação de resposta.");
  };

  const destLabel = (id: string) => {
    if ((UNCLASSIFIED_VALUES as readonly string[]).includes(id)) return id;
    return REGISTRY.find((r) => r.id === id)?.canonicalName ?? id;
  };

  return (
    <div className="relative min-h-screen bg-ink-950 text-mist-200 font-body">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="atlas-grid absolute inset-x-0 top-0 h-[380px] pointer-events-none" aria-hidden="true" />
      <div aria-live="polite" className="sr-only">{announce}</div>

      <a
        href="#conteudo-triage"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById("conteudo-triage");
          el?.focus();
          el?.scrollIntoView?.();
        }}
        className="skip-link"
      >
        pular para a bancada de triagem
      </a>

      <header className="relative border-b border-seam bg-ink-900/60">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <a href="#/" className="group inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase text-mist-500 hover:text-lumen-300 transition-colors focus-ring rounded">
            <svg viewBox="0 0 20 12" className="w-4 h-2.5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M19 6H3M8 1.5 3 6l5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            portal
          </a>
          <span className="w-px h-5 bg-seam-strong hidden sm:block" aria-hidden="true" />
          <div className="flex-1 min-w-[220px]">
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-mist-50 leading-none">
              <Scramble text="Triage Workbench" />
            </h1>
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600 mt-2">
              quarentena → interpretação secundária → candidato explícito
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full border border-gild-400/45 text-gild-300 font-mono text-[9px] uppercase tracking-[0.14em]">triagem ≠ cânone</span>
            <span className="px-3 py-1.5 rounded-full border border-seam-strong text-mist-400 font-mono text-[9px] uppercase tracking-[0.14em]">fonte bruta intocável</span>
            <span className="hidden md:inline-flex px-3 py-1.5 rounded-full border border-lumen-500/40 text-lumen-300 font-mono text-[9px] uppercase tracking-[0.14em]">candidate ≠ adoption</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-6">
        <p className="rounded-md border border-gild-400/40 bg-gild-400/6 px-4 py-3 text-[12px] text-gild-300/90 leading-relaxed">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase">fila representativa · demo</span> — o gateway{" "}
          <span className="font-mono">musa2-node-gateway v3</span> ainda não expõe operações de listagem/atualização da fila de
          quarentena. Esta bancada opera sobre capturas locais + itens sintéticos <em>rotulados</em>, isolados atrás da interface{" "}
          <span className="font-mono">TriageQueueAdapter</span> para substituição pelo backend real sem reescrever a UI. Nada aqui
          é apresentado como a fila do Supabase.
        </p>
      </div>

      <main id="conteudo-triage" tabIndex={-1} className="relative mx-auto max-w-7xl px-5 sm:px-8 py-8 pb-32 grid lg:grid-cols-12 gap-7 items-start">
        {/* ---------------- fila ---------------- */}
        <section className="lg:col-span-4" aria-label="Fila de triagem">
          <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Filtrar fila por estado">
            {(["ALL", ...TRIAGE_STATUSES] as const).map((s) => {
              const count = s === "ALL" ? items.length : items.filter((i) => i.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  aria-pressed={filter === s}
                  className={`px-3 py-1.5 rounded-full border font-mono text-[9px] uppercase tracking-[0.12em] transition-all duration-200 cursor-pointer focus-ring ${
                    filter === s ? "border-lumen-400/70 text-lumen-300 bg-lumen-500/10" : "border-seam text-mist-500 hover:border-seam-strong"
                  }`}
                >
                  {s === "ALL" ? "todos" : TRIAGE_STATUS_LABEL[s]} · {count}
                </button>
              );
            })}
          </div>

          <ul className="space-y-2.5">
            {filtered.map((it) => {
              const snippet = it.rawContent ? maskUnlessPublic(it.rawContent, it.sensitivity) : it.externalUri ? (isPublicSafe(it.sensitivity) ? it.externalUri : "[link protegido]") : "—";
              return (
                <li key={it.id}>
                  <button
                    onClick={() => {
                      setSelectedId(it.id);
                      setCandidate(null);
                    }}
                    aria-pressed={selectedId === it.id}
                    className={`w-full text-left rounded-lg border p-4 transition-all duration-200 cursor-pointer focus-ring ${
                      selectedId === it.id ? "border-lumen-500/60 bg-lumen-500/8 shadow-[0_0_24px_rgba(62,207,178,0.1)]" : "border-seam bg-ink-900/60 hover:border-seam-strong"
                    }`}
                  >
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full border font-mono text-[8px] uppercase tracking-[0.12em] ${it.status === "QUARANTINED" ? "border-gild-400/50 text-gild-300" : it.status === "REJECTED" ? "border-ember-400/50 text-ember-300" : "border-seam-strong text-mist-300"}`}>
                        {TRIAGE_STATUS_LABEL[it.status]}
                      </span>
                      {it.origin === "representative-demo" && (
                        <span className="px-2 py-0.5 rounded-full border border-mist-600/50 font-mono text-[8px] uppercase tracking-[0.12em] text-mist-500">representativo</span>
                      )}
                      {!isPublicSafe(it.sensitivity) && (
                        <span className="px-2 py-0.5 rounded-full border border-ember-400/40 font-mono text-[8px] uppercase tracking-[0.12em] text-ember-300">{SENSITIVITY_LABEL[it.sensitivity]}</span>
                      )}
                    </span>
                    <span className="block text-[13px] text-mist-200 leading-snug mt-2 truncate">{snippet}</span>
                    <span className="block font-mono text-[8.5px] uppercase tracking-[0.14em] text-mist-600 mt-1.5">
                      {it.sourceType} · {it.contentKind} · {it.createdAt}
                    </span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="text-sm text-mist-600 italic">Nada neste estado — a quarentena agradece.</li>}
          </ul>
        </section>

        {/* ---------------- detalhe ---------------- */}
        <section className="lg:col-span-8 space-y-6" aria-label="Detalhe do item em triagem">
          {!selected ? (
            <p className="text-sm text-mist-600 italic">Selecione um item da fila para examinar as camadas.</p>
          ) : (
            <>
              {/* camada 1 — fonte bruta */}
              <Reveal>
                <article className="rounded-xl border border-seam-strong bg-gradient-to-b from-ink-850 to-ink-900 p-6 sm:p-7">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="grid place-items-center w-8 h-8 rounded-full border border-gild-400/60 text-gild-300" aria-hidden="true">
                      <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <rect x="4" y="8.5" width="12" height="8" rx="1.5" />
                        <path d="M7 8.5V6.5a3 3 0 0 1 6 0v2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <h2 className="font-display text-xl font-medium text-mist-50">Camada 1 · fonte bruta</h2>
                    <span className="px-2.5 py-1 rounded-full border border-gild-400/45 font-mono text-[8px] uppercase tracking-[0.14em] text-gild-300">intocável pela triagem</span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-1.5">raw_content</p>
                      {selected.rawContent ? (
                        <blockquote className="border-l-2 border-gild-400/60 pl-4 font-display text-lg text-mist-100 leading-relaxed whitespace-pre-wrap">
                          {maskUnlessPublic(selected.rawContent, selected.sensitivity)}
                        </blockquote>
                      ) : (
                        <p className="text-sm text-mist-600 italic">sem texto bruto — apenas link/observação</p>
                      )}
                    </div>

                    {selected.externalUri && (
                      <div>
                        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-1.5">external_uri</p>
                        {isPublicSafe(selected.sensitivity) ? (
                          <a href={selected.externalUri} target="_blank" rel={SAFE_REL} className="font-mono text-[12px] text-lumen-400 hover:text-lumen-300 break-all focus-ring rounded">
                            {selected.externalUri} ↗
                          </a>
                        ) : (
                          <p className="font-mono text-[12px] text-mist-600">URL preservada — nunca ancorada/exibida (sensibilidade {SENSITIVITY_LABEL[selected.sensitivity]}).</p>
                        )}
                      </div>
                    )}

                    <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                      {[
                        ["source_type", selected.sourceType],
                        ["content_kind", selected.contentKind],
                        ["language", selected.language ?? "—"],
                        ["sensibilidade", SENSITIVITY_LABEL[selected.sensitivity]],
                        ["source_ref", selected.sourceRef ? maskUnlessPublic(selected.sourceRef, selected.sensitivity) : "—"],
                        ["criado em", selected.createdAt],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-baseline gap-3">
                          <dt className="font-mono text-[9px] tracking-[0.16em] uppercase text-mist-600 w-24 shrink-0">{k}</dt>
                          <dd className="text-[13px] text-mist-300">{v}</dd>
                        </div>
                      ))}
                      <div className="flex items-baseline gap-3 sm:col-span-2">
                        <dt className="font-mono text-[9px] tracking-[0.16em] uppercase text-mist-600 w-24 shrink-0">provenance</dt>
                        <dd className="text-[13px] text-mist-300">
                          {selected.provenanceRefs.length > 0 ? selected.provenanceRefs.map((p) => maskUnlessPublic(p, selected.sensitivity)).join(" · ") : "—"}
                        </dd>
                      </div>
                    </dl>

                    {selected.potentialCreativeContribution && (
                      <p className="rounded-md border border-gild-400/40 bg-gild-400/6 px-4 py-2.5 text-[12px] text-gild-300 leading-relaxed">
                        Marcada como possível contribuição criativa — apenas marcador de preservação/revisão.{" "}
                        <span className="font-mono text-[10px] uppercase">Não é registro, tokenização, aceite nem AIPFIT.</span>
                      </p>
                    )}
                  </div>
                </article>
              </Reveal>

              {/* camada 2 — interpretação secundária */}
              <Reveal delay={80}>
                <article className="rounded-xl border border-seam bg-ink-900/70 p-6 sm:p-7">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="grid place-items-center w-8 h-8 rounded-full border border-lumen-500/60 text-lumen-300 font-mono text-[11px]" aria-hidden="true">2</span>
                    <h2 className="font-display text-xl font-medium text-mist-50">Camada 2 · interpretação secundária</h2>
                    <span className="px-2.5 py-1 rounded-full border border-seam-strong font-mono text-[8px] uppercase tracking-[0.14em] text-mist-400">tentativa · nunca cânone</span>
                  </div>

                  <fieldset className="mt-5">
                    <legend className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-2.5">tags tentativas</legend>
                    <div className="flex flex-wrap gap-2">
                      {TENTATIVE_TAGS.map((t) => (
                        <button
                          key={t}
                          onClick={() => mutateLayer((i) => ({ ...i.triage, tentativeTags: toggle(i.triage.tentativeTags, t as TentativeTag) }))}
                          aria-pressed={selected.triage.tentativeTags.includes(t)}
                          className={`px-3 py-1.5 rounded-full border font-mono text-[9px] uppercase tracking-[0.1em] transition-all duration-200 cursor-pointer focus-ring ${
                            selected.triage.tentativeTags.includes(t) ? "border-lumen-400/70 text-lumen-300 bg-lumen-500/10" : "border-seam text-mist-500 hover:border-seam-strong"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="mt-5">
                    <legend className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-2.5">ponteiros temáticos (múltiplos)</legend>
                    <div className="flex flex-wrap gap-2">
                      {THEMATIC_POINTERS.map((t) => (
                        <button
                          key={t}
                          onClick={() => mutateLayer((i) => ({ ...i.triage, thematicPointers: toggle(i.triage.thematicPointers, t as ThematicPointer) }))}
                          aria-pressed={selected.triage.thematicPointers.includes(t)}
                          className={`px-3 py-1.5 rounded-full border font-mono text-[9px] uppercase tracking-[0.1em] transition-all duration-200 cursor-pointer focus-ring ${
                            selected.triage.thematicPointers.includes(t) ? "border-gild-400/70 text-gild-300 bg-gild-400/10" : "border-seam text-mist-500 hover:border-seam-strong"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="mt-5">
                    <legend className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-2.5">
                      destinos — um drop pode apontar para vários Holons; não force classificação prematura
                    </legend>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {UNCLASSIFIED_VALUES.map((u) => (
                        <button
                          key={u}
                          onClick={() => mutateLayer((i) => ({ ...i.triage, destinations: toggle(i.triage.destinations, u) }))}
                          aria-pressed={selected.triage.destinations.includes(u)}
                          className={`px-3 py-1.5 rounded-full border font-mono text-[9px] uppercase tracking-[0.1em] transition-all duration-200 cursor-pointer focus-ring ${
                            selected.triage.destinations.includes(u) ? "border-ember-400/70 text-ember-300 bg-ember-400/10" : "border-seam text-mist-500 hover:border-seam-strong"
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <label className="sr-only" htmlFor="dest-pick">Adicionar bloco do registry como destino</label>
                      <select id="dest-pick" value={destPick} onChange={(e) => setDestPick(e.target.value)} className="max-w-xs rounded-md border border-seam bg-ink-950/70 px-3 py-2 text-[12px] text-mist-100 outline-none focus:border-lumen-500/60 cursor-pointer">
                        <option value="">+ bloco do registry…</option>
                        {REGISTRY.map((r) => (
                          <option key={r.id} value={r.id}>{r.canonicalName}</option>
                        ))}
                      </select>
                      <button onClick={addDestination} disabled={!destPick} className="px-3.5 py-2 rounded-md border border-lumen-500/45 font-mono text-[9px] uppercase tracking-[0.14em] text-lumen-300 hover:bg-lumen-500/10 transition-colors disabled:opacity-40 cursor-pointer focus-ring">
                        apontar
                      </button>
                    </div>
                    {selected.triage.destinations.filter((d) => !(UNCLASSIFIED_VALUES as readonly string[]).includes(d)).length > 0 && (
                      <ul className="flex flex-wrap gap-2 mt-3" aria-label="Destinos apontados">
                        {selected.triage.destinations
                          .filter((d) => !(UNCLASSIFIED_VALUES as readonly string[]).includes(d))
                          .map((d) => (
                            <li key={d} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-lumen-500/40 font-mono text-[9px] uppercase tracking-[0.1em] text-lumen-300">
                              {destLabel(d)}
                              <button
                                onClick={() => mutateLayer((i) => ({ ...i.triage, destinations: i.triage.destinations.filter((x) => x !== d) }))}
                                aria-label={`Remover destino ${destLabel(d)}`}
                                className="text-mist-500 hover:text-ember-300 transition-colors cursor-pointer focus-ring rounded"
                              >
                                ×
                              </button>
                            </li>
                          ))}
                      </ul>
                    )}
                  </fieldset>

                  <fieldset className="mt-5">
                    <legend className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mb-2.5">
                      perguntas de acompanhamento — permitidas sem resolução
                    </legend>
                    <div className="flex flex-wrap gap-2.5">
                      <input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addQuestion();
                          }
                        }}
                        placeholder={"ex.: “O que Sergio quer dizer com isto?”"}
                        className="flex-1 min-w-[240px] rounded-md border border-seam bg-ink-950/70 px-3.5 py-2.5 text-sm text-mist-100 placeholder:text-mist-600 outline-none focus:border-lumen-500/60 transition-colors"
                        aria-label="Nova pergunta de acompanhamento"
                      />
                      <button onClick={addQuestion} disabled={!question.trim()} className="px-3.5 py-2.5 rounded-md border border-seam-strong font-mono text-[9px] uppercase tracking-[0.14em] text-mist-300 hover:border-lumen-500/50 hover:text-lumen-300 transition-colors disabled:opacity-40 cursor-pointer focus-ring">
                        registrar pergunta
                      </button>
                    </div>
                    {selected.triage.questions.length > 0 && (
                      <ul className="mt-3 space-y-1.5" aria-label="Perguntas registradas">
                        {selected.triage.questions.map((q, i) => (
                          <li key={`${q}-${i}`} className="flex items-start gap-2.5 text-[13px] text-mist-300">
                            <span className="text-gild-300 font-mono text-[11px] mt-0.5" aria-hidden="true">?</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    )}
                  </fieldset>
                </article>
              </Reveal>

              {/* estado + ações */}
              <Reveal delay={140}>
                <article className="rounded-xl border border-seam bg-ink-900/70 p-6 sm:p-7">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-xl font-medium text-mist-50 mr-2">Estado & destinos</h2>
                    <span className="px-2.5 py-1 rounded-full border border-seam-strong font-mono text-[9px] uppercase tracking-[0.14em] text-mist-300">
                      {TRIAGE_STATUS_LABEL[selected.status]}
                    </span>
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-mist-600">estado representativo — backend de fila ainda não exposto</span>
                  </div>

                  <div className="flex flex-wrap gap-2.5 mt-5" role="group" aria-label="Progressão de estado">
                    {TRIAGE_STATUSES.filter((s) => s !== selected.status).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          refresh(adapter.setStatus(selected.id, s));
                          setAnnounce(`Estado alterado para ${TRIAGE_STATUS_LABEL[s]} (representativo).`);
                        }}
                        className={`px-4 py-2 rounded-md border font-mono text-[9px] uppercase tracking-[0.14em] transition-colors cursor-pointer focus-ring ${
                          s === "REJECTED" ? "border-ember-400/50 text-ember-300 hover:bg-ember-400/10" : "border-seam-strong text-mist-300 hover:border-lumen-500/50 hover:text-lumen-300"
                        }`}
                      >
                        → {TRIAGE_STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mt-6">
                    <button onClick={() => handoffCandidateToDiff(selected)} className="group px-5 py-4 rounded-lg border border-lumen-500/45 text-left transition-all duration-200 hover:bg-lumen-500/8 hover:-translate-y-0.5 cursor-pointer focus-ring">
                      <span className="block font-mono text-[10px] tracking-[0.18em] uppercase text-lumen-300">abrir no Snapshot Diff</span>
                      <span className="block text-[12px] text-mist-500 mt-1.5">candidato como fragmento snapshot/v1 · diff contra a base</span>
                    </button>
                    <button onClick={() => handoffCandidateToIntake(selected)} className="group px-5 py-4 rounded-lg border border-gild-400/45 text-left transition-all duration-200 hover:bg-gild-400/8 hover:-translate-y-0.5 cursor-pointer focus-ring">
                      <span className="block font-mono text-[10px] tracking-[0.18em] uppercase text-gild-300">desenvolver no Intake Studio</span>
                      <span className="block text-[12px] text-mist-500 mt-1.5">pré-preenche rascunho governado · rascunho ≠ adoção</span>
                    </button>
                    <button
                      onClick={() => inspect(buildCandidateRecord(selected))}
                      className="group px-5 py-4 rounded-lg border border-seam-strong text-left transition-all duration-200 hover:bg-ink-850 hover:-translate-y-0.5 cursor-pointer focus-ring"
                    >
                      <span className="block font-mono text-[10px] tracking-[0.18em] uppercase text-mist-300">inspecionar fonte/proveniência</span>
                      <span className="block text-[12px] text-mist-500 mt-1.5">Inspector com fonte, evidência e valor de continuidade</span>
                    </button>
                    <button
                      onClick={() => {
                        setCandidate(buildCandidateRecord(selected));
                        setAnnounce("Candidato estruturado criado — nenhuma adoção ocorreu.");
                      }}
                      className="group px-5 py-4 rounded-lg border border-seam-strong text-left transition-all duration-200 hover:bg-ink-850 hover:-translate-y-0.5 cursor-pointer focus-ring"
                    >
                      <span className="block font-mono text-[10px] tracking-[0.18em] uppercase text-mist-300">criar candidato estruturado</span>
                      <span className="block text-[12px] text-mist-500 mt-1.5">objeto explícito · CANDIDATE ≠ CANON · sem “adicionar ao Registry”</span>
                    </button>
                  </div>

                  {candidate && (
                    <div className="mt-5 rounded-lg border border-lumen-500/35 bg-ink-950/80 p-5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-lumen-300">candidato criado · sem adoção</p>
                        <LifecycleChip lifecycle={candidate.lifecycle} />
                      </div>
                      <p className="font-display text-lg text-mist-50 mt-3">{candidate.canonicalName}</p>
                      <p className="text-[13px] text-mist-400 leading-relaxed mt-2">{candidate.description}</p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600 mt-3">id {candidate.id}</p>
                    </div>
                  )}
                </article>
              </Reveal>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
