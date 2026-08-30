/* ------------------------------------------------------------------ */
/*  Intake Studio · Crowd-Sourced — entrada governada de building      */
/*  blocks. RASCUNHO ≠ ADOÇÃO: o registry vivo nunca é mutado aqui.    */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CURRENTNESS,
  CURRENTNESS_LABEL,
  EVIDENCE_RUNGS,
  FAMILIES,
  KINDS,
  LIFECYCLE,
  LIFECYCLE_LABEL,
  SOURCE_CLASSES,
  SOURCE_CLASS_LABEL,
  type BuildingBlockRecord,
} from "../registry/model";
import { REGISTRY, applyFilters, parseQuery } from "../registry/queries";
import { LifecycleChip, RungChip } from "../registry/Inspector";
import { Scramble } from "../motion";
import {
  blockFails,
  draftToRecord,
  emptyDraft,
  emptySource,
  exportFragment,
  handoffToDiff,
  loadDrafts,
  newId,
  removeDraft,
  upsertDraft,
  validateDraft,
  type CapDraft,
  type IntakeDraft,
  type SourceDraft,
} from "./intakeModel";

const STEPS = ["Identidade", "Linhagem & fontes", "Estado & evidência", "Capacidades & futuro", "Revisão"];
const ROLES = ["primary", "derivative", "synthesis", "lineage", "snapshot"];
const ACCESS_OPTS = ["public", "metadata-only", "restricted"];
const AVAIL: CapDraft["availability"][] = ["now", "conditional", "planned"];

const inputCls =
  "w-full rounded-md border border-seam bg-ink-950/70 px-3.5 py-2.5 text-sm text-mist-100 placeholder:text-mist-600 outline-none focus:border-lumen-500/60 transition-colors";
const selectCls =
  "w-full rounded-md border border-seam bg-ink-950/70 px-3 py-2.5 text-sm text-mist-100 outline-none focus:border-lumen-500/60 transition-colors cursor-pointer";

export default function IntakeStudio() {
  const [draft, setDraft] = useState<IntakeDraft>(() => emptyDraft());
  const [step, setStep] = useState(0);
  const [drafts, setDrafts] = useState<IntakeDraft[]>(() => loadDrafts());
  const [pulse, setPulse] = useState(false);
  const [fragment, setFragment] = useState("");
  const [copied, setCopied] = useState(false);
  const [handed, setHanded] = useState(false);
  const formTopRef = useRef<HTMLDivElement | null>(null);

  const checks = useMemo(() => validateDraft(draft), [draft]);
  const fails = blockFails(checks);
  const okCount = checks.filter((c) => c.ok).length;

  /* autosave com debounce — só quando o rascunho tem nome */
  useEffect(() => {
    if (draft.canonicalName.trim().length < 3) return;
    const t = window.setTimeout(() => {
      setDrafts(upsertDraft({ ...draft, updatedAt: new Date().toISOString().slice(0, 10) }));
      setPulse(true);
      window.setTimeout(() => setPulse(false), 900);
    }, 400);
    return () => window.clearTimeout(t);
  }, [draft]);

  const up = (patch: Partial<IntakeDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const goto = (i: number) => {
    setStep(Math.max(0, Math.min(STEPS.length - 1, i)));
    setFragment("");
    setCopied(false);
    setHanded(false);
    formTopRef.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
  };

  const failOf = (id: string) => checks.find((c) => c.id === id && !c.ok);

  const generate = () => {
    if (fails.length > 0) return;
    setFragment(JSON.stringify(exportFragment(draft), null, 2));
  };

  const copyFragment = async () => {
    try {
      await navigator.clipboard?.writeText(fragment);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const downloadFragment = () => {
    try {
      const blob = new Blob([fragment], { type: "application/json" });
      if (typeof URL !== "undefined" && URL.createObjectURL) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${draftToRecord(draft).id}.snapshot.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } catch {
      /* ambiente sem Blob/URL — cópia manual segue disponível */
    }
  };

  const sendToDiff = () => {
    if (handoffToDiff(exportFragment(draft))) {
      setHanded(true);
      window.location.hash = "#/registry";
    }
  };

  return (
    <div className="relative min-h-screen bg-ink-950 text-mist-200 font-body">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="atlas-grid absolute inset-x-0 top-0 h-[380px] pointer-events-none" aria-hidden="true" />

      {/* cabeçalho */}
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
              <Scramble text="Intake Studio" />
            </h1>
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600 mt-2">
              Crowd-Sourced · entrada governada de building blocks
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full border border-gild-400/45 text-gild-300 font-mono text-[9px] uppercase tracking-[0.14em]">rascunho ≠ adoção</span>
            <span className="px-3 py-1.5 rounded-full border border-seam-strong text-mist-400 font-mono text-[9px] uppercase tracking-[0.14em]">vocabulário controlado</span>
            <span className="hidden md:inline-flex px-3 py-1.5 rounded-full border border-lumen-500/40 text-lumen-300 font-mono text-[9px] uppercase tracking-[0.14em]">sanitização fail-safe</span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-5 sm:px-8 py-10 pb-32 grid lg:grid-cols-12 gap-8 items-start">
        {/* trilho de etapas + rascunhos */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-8">
          <nav aria-label="Etapas do intake">
            <ol className="space-y-1.5">
              {STEPS.map((s, i) => {
                const active = i === step;
                const done = i < step;
                return (
                  <li key={s}>
                    <button
                      onClick={() => goto(i)}
                      aria-current={active ? "step" : undefined}
                      className={`w-full flex items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-all duration-300 cursor-pointer focus-ring ${
                        active
                          ? "border-lumen-500/60 bg-lumen-500/10 shadow-[0_0_22px_rgba(62,207,178,0.14)]"
                          : done
                            ? "border-seam-strong bg-ink-900/70 hover:border-lumen-500/40"
                            : "border-seam bg-ink-950/40 hover:border-seam-strong"
                      }`}
                    >
                      <span
                        className={`grid place-items-center w-7 h-7 shrink-0 rounded-full border font-mono text-[11px] ${
                          active ? "border-lumen-400 text-lumen-300" : done ? "border-gild-400/60 text-gild-300" : "border-mist-600/50 text-mist-500"
                        }`}
                        aria-hidden="true"
                      >
                        {done ? (
                          <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path d="M2 6.5 4.8 9 10 3.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className={`font-mono text-[11px] tracking-[0.12em] uppercase ${active ? "text-lumen-300" : "text-mist-400"}`}>{s}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* medidor de validação */}
          <div className="rounded-lg border border-seam bg-ink-900/60 p-4" role="status" aria-label={`Validação: ${okCount} de ${checks.length} verificações ok`}>
            <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600">
              <span>validação viva</span>
              <span className={fails.length ? "text-ember-300" : "text-lumen-300"}>
                {fails.length ? `${fails.length} bloqueio${fails.length > 1 ? "s" : ""}` : "pronto p/ fragmento"}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 rounded-full bg-ink-950 overflow-hidden" aria-hidden="true">
              <div
                className={`h-full rounded-full transition-all duration-500 ${fails.length ? "bg-ember-400/80" : "bg-lumen-400"}`}
                style={{ width: `${Math.round((okCount / Math.max(1, checks.length)) * 100)}%` }}
              />
            </div>
          </div>

          {/* rascunhos locais */}
          <div className="rounded-lg border border-seam bg-ink-900/60 p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600">rascunhos locais</p>
              <span className={`font-mono text-[9px] text-lumen-300 transition-opacity duration-500 ${pulse ? "opacity-100" : "opacity-0"}`} aria-hidden="true">
                salvo ✓
              </span>
            </div>
            {drafts.length === 0 ? (
              <p className="text-[12px] text-mist-600 italic mt-2.5">Nenhum rascunho nomeado ainda.</p>
            ) : (
              <ul className="mt-2.5 space-y-2 max-h-56 overflow-y-auto pr-1">
                {drafts.map((d) => (
                  <li key={d.id} className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setDraft(d);
                        setStep(0);
                      }}
                      className="flex-1 min-w-0 text-left rounded-md border border-seam bg-ink-950/50 px-3 py-2 hover:border-lumen-500/45 transition-colors cursor-pointer focus-ring"
                    >
                      <span className="block text-[12px] text-mist-200 truncate">{d.canonicalName || "(sem nome)"}</span>
                      <span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600 mt-0.5">
                        {LIFECYCLE_LABEL[d.lifecycle as keyof typeof LIFECYCLE_LABEL] ?? d.lifecycle} · {d.updatedAt}
                      </span>
                    </button>
                    <button
                      onClick={() => setDrafts(removeDraft(d.id))}
                      aria-label={`Excluir rascunho ${d.canonicalName || "sem nome"}`}
                      className="shrink-0 grid place-items-center w-7 h-7 rounded-md border border-seam text-mist-500 hover:text-ember-300 hover:border-ember-400/50 transition-colors cursor-pointer focus-ring"
                    >
                      <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" strokeLinecap="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => {
                setDraft(emptyDraft());
                setStep(0);
                setFragment("");
              }}
              className="mt-3 w-full rounded-md border border-dashed border-seam-strong px-3 py-2 font-mono text-[10px] tracking-[0.14em] uppercase text-mist-400 hover:text-lumen-300 hover:border-lumen-500/50 transition-colors cursor-pointer focus-ring"
            >
              + novo rascunho
            </button>
          </div>
        </div>

        {/* formulário da etapa */}
        <div className="lg:col-span-6" ref={formTopRef}>
          <div key={step} className="anim-step rounded-xl border border-seam-strong bg-gradient-to-b from-ink-850 to-ink-900 p-6 sm:p-8">
            <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-gild-300">etapa {step + 1} / {STEPS.length}</p>
            <h2 className="font-display text-3xl font-medium text-mist-50 mt-1.5">{STEPS[step]}</h2>

            {step === 0 && (
              <div className="mt-7 space-y-5">
                <Field label="Nome canônico" error={failOf("name")?.label}>
                  <input
                    value={draft.canonicalName}
                    onChange={(e) => up({ canonicalName: e.target.value })}
                    placeholder="ex.: Arquivo de Sementes Comunitárias"
                    aria-invalid={Boolean(failOf("name"))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Aliases (separados por vírgula)">
                  <input
                    value={draft.aliases.join(", ")}
                    onChange={(e) => up({ aliases: e.target.value.split(",").map((a) => a.trim()).filter(Boolean) })}
                    placeholder="ex.: Seed Archive, Banco de Sementes"
                    className={inputCls}
                  />
                </Field>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Tipo (kind)" error={failOf("kind")?.label}>
                    <select value={draft.kind} onChange={(e) => up({ kind: e.target.value })} className={selectCls}>
                      {KINDS.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Família" error={failOf("family")?.label}>
                    <select value={draft.family} onChange={(e) => up({ family: e.target.value })} className={selectCls}>
                      {FAMILIES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Descrição" hint="O que é, em linguagem que um estranho entenderia." error={failOf("desc")?.label}>
                  <textarea
                    value={draft.description}
                    onChange={(e) => up({ description: e.target.value })}
                    rows={4}
                    aria-invalid={Boolean(failOf("desc"))}
                    placeholder="Descreva o objeto, sua função e seu lugar na arquitetura…"
                    className={`${inputCls} resize-y`}
                  />
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="mt-7 space-y-6">
                {draft.sourceRefs.map((s, i) => (
                  <SourceEditor
                    key={s.id}
                    index={i}
                    src={s}
                    onChange={(patch) =>
                      up({ sourceRefs: draft.sourceRefs.map((x) => (x.id === s.id ? { ...x, ...patch } : x)) })
                    }
                    onRemove={
                      draft.sourceRefs.length > 1
                        ? () => up({ sourceRefs: draft.sourceRefs.filter((x) => x.id !== s.id) })
                        : undefined
                    }
                    failOf={(suffix) => failOf(`src-${i}-${suffix}`)?.label}
                  />
                ))}
                <button
                  onClick={() => up({ sourceRefs: [...draft.sourceRefs, emptySource()] })}
                  className="w-full rounded-md border border-dashed border-seam-strong px-4 py-3 font-mono text-[10px] tracking-[0.16em] uppercase text-mist-400 hover:text-lumen-300 hover:border-lumen-500/50 transition-colors cursor-pointer focus-ring"
                >
                  + adicionar fonte
                </button>

                <div className="grid sm:grid-cols-2 gap-6 pt-2">
                  <RecordPicker
                    label="Predecessores (de onde veio)"
                    selected={draft.predecessorIds}
                    onToggle={(id) =>
                      up({
                        predecessorIds: draft.predecessorIds.includes(id)
                          ? draft.predecessorIds.filter((x) => x !== id)
                          : [...draft.predecessorIds, id],
                      })
                    }
                  />
                  <RecordPicker
                    label="Sucessores (para onde aponta)"
                    selected={draft.successorIds}
                    onToggle={(id) =>
                      up({
                        successorIds: draft.successorIds.includes(id)
                          ? draft.successorIds.filter((x) => x !== id)
                          : [...draft.successorIds, id],
                      })
                    }
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="mt-7 space-y-6">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Ciclo de vida (lifecycle)" error={failOf("life")?.label}>
                    <select value={draft.lifecycle} onChange={(e) => up({ lifecycle: e.target.value })} className={selectCls}>
                      {LIFECYCLE.map((l) => (
                        <option key={l} value={l}>{l} — {LIFECYCLE_LABEL[l]}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Currentness" error={failOf("curr")?.label}>
                    <select value={draft.currentness} onChange={(e) => up({ currentness: e.target.value })} className={selectCls}>
                      {CURRENTNESS.map((c) => (
                        <option key={c} value={c}>{c} — {CURRENTNESS_LABEL[c]}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {draft.lifecycle === "CURRENT" && failOf("current") && (
                  <div className="flex flex-wrap items-center gap-4 rounded-md border border-ember-400/40 bg-ember-400/6 px-4 py-3.5">
                    <p className="flex-1 min-w-[220px] text-[13px] text-ember-300 leading-relaxed">
                      {failOf("current")?.detail ?? "CURRENT exige evidência ≥ verificação com lastro observável."}
                    </p>
                    <button
                      onClick={() => up({ lifecycle: "DEPLOYED_READBACK_PENDING", currentness: "candidate" })}
                      className="shrink-0 rounded-md border border-ember-400/50 px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ember-300 hover:bg-ember-400/10 transition-colors cursor-pointer focus-ring"
                    >
                      rebaixar p/ readback pendente
                    </button>
                  </div>
                )}

                <Field label={`Degrau de evidência · ${EVIDENCE_RUNGS[draft.rung] ?? "—"}`} error={failOf("rung")?.label}>
                  <input
                    type="range"
                    min={0}
                    max={EVIDENCE_RUNGS.length - 1}
                    value={draft.rung}
                    onChange={(e) => up({ rung: Number(e.target.value) })}
                    className="w-full accent-[#5fe3c8] cursor-pointer"
                    aria-valuetext={EVIDENCE_RUNGS[draft.rung]}
                  />
                  <div className="flex justify-between font-mono text-[8px] uppercase tracking-[0.1em] text-mist-600 mt-1.5" aria-hidden="true">
                    {EVIDENCE_RUNGS.map((r, i) => (
                      <span key={r} className={i === draft.rung ? "text-lumen-300" : undefined}>{r}</span>
                    ))}
                  </div>
                </Field>

                <Field label="Base da crença sobre o estado" hint="Por que este objeto está NESTE estado — não em outro." error={failOf("basis")?.label}>
                  <textarea
                    value={draft.basis}
                    onChange={(e) => up({ basis: e.target.value })}
                    rows={3}
                    aria-invalid={Boolean(failOf("basis"))}
                    placeholder="ex.: Implementado em source no commit X; sem deploy observado; sem readback externo."
                    className={`${inputCls} resize-y`}
                  />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div className="mt-7 space-y-6">
                <div className="space-y-3">
                  {draft.capabilities.map((c, i) => (
                    <div key={c.id} className="flex flex-wrap gap-3 items-center rounded-md border border-seam bg-ink-950/50 p-3">
                      <input
                        value={c.label}
                        onChange={(e) =>
                          up({ capabilities: draft.capabilities.map((x) => (x.id === c.id ? { ...x, label: e.target.value } : x)) })
                        }
                        placeholder={`Capacidade ${i + 1} — o que este objeto pode fazer hoje`}
                        className={`flex-1 min-w-[200px] ${inputCls}`}
                        aria-label={`Rótulo da capacidade ${i + 1}`}
                      />
                      <select
                        value={c.availability}
                        onChange={(e) =>
                          up({
                            capabilities: draft.capabilities.map((x) =>
                              x.id === c.id ? { ...x, availability: e.target.value as CapDraft["availability"] } : x,
                            ),
                          })
                        }
                        className={`w-40 ${selectCls}`}
                        aria-label={`Disponibilidade da capacidade ${i + 1}`}
                      >
                        {AVAIL.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => up({ capabilities: draft.capabilities.filter((x) => x.id !== c.id) })}
                        aria-label={`Remover capacidade ${i + 1}`}
                        className="grid place-items-center w-8 h-8 rounded-md border border-seam text-mist-500 hover:text-ember-300 hover:border-ember-400/50 transition-colors cursor-pointer focus-ring"
                      >
                        <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => up({ capabilities: [...draft.capabilities, { id: newId("cap"), label: "", availability: "now" }] })}
                    className="w-full rounded-md border border-dashed border-seam-strong px-4 py-3 font-mono text-[10px] tracking-[0.16em] uppercase text-mist-400 hover:text-lumen-300 hover:border-lumen-500/50 transition-colors cursor-pointer focus-ring"
                  >
                    + adicionar capacidade
                  </button>
                </div>

                <Field label="Incógnitas conhecidas (uma por linha)" hint="O que ainda não se sabe — declarado, nunca escondido.">
                  <textarea
                    value={draft.unknowns.join("\n")}
                    onChange={(e) => up({ unknowns: e.target.value.split("\n") })}
                    rows={3}
                    placeholder={"Estado de deploy desconhecido\nAutoria original a confirmar"}
                    className={`${inputCls} resize-y`}
                  />
                </Field>

                <Field label="Valor de continuidade (positiveNote)" hint="Por que este objeto merece existir na arquitetura, mesmo antigo." error={failOf("note")?.label}>
                  <textarea
                    value={draft.positiveNote}
                    onChange={(e) => up({ positiveNote: e.target.value })}
                    rows={3}
                    aria-invalid={Boolean(failOf("note"))}
                    placeholder="ex.: Preserva padrões de interação que podem fortalecer a arquitetura de participação atual."
                    className={`${inputCls} resize-y`}
                  />
                </Field>
              </div>
            )}

            {step === 4 && (
              <div className="mt-7 space-y-6">
                <p className="text-[14px] text-mist-300 leading-relaxed">
                  O fragmento abaixo é um <span className="font-mono text-[12px] text-lumen-300">hui.constellation.snapshot/v1</span>{" "}
                  sanitizado — consumível pelo Snapshot Diff sem reescrever nada. Ele <span className="text-gild-300">não altera o registry</span>:
                  adoção exige triagem governada.
                </p>

                <div className="rounded-md border border-seam bg-ink-950/70 p-5 grid sm:grid-cols-2 gap-x-8 gap-y-2.5 font-mono text-[11px]">
                  <p><span className="text-mist-600">id&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span className="text-lumen-300">{draftToRecord(draft).id}</span></p>
                  <p><span className="text-mist-600">família&nbsp;&nbsp;</span><span className="text-mist-200">{draft.family}</span></p>
                  <p><span className="text-mist-600">tipo&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span className="text-mist-200">{draft.kind}</span></p>
                  <p><span className="text-mist-600">fontes&nbsp;&nbsp;&nbsp;</span><span className="text-mist-200">{draft.sourceRefs.length}</span></p>
                  <p><span className="text-mist-600">capacid.&nbsp;</span><span className="text-mist-200">{draft.capabilities.filter((c) => c.label.trim()).length}</span></p>
                  <p><span className="text-mist-600">linhagem&nbsp;</span><span className="text-mist-200">{draft.predecessorIds.length} ← · → {draft.successorIds.length}</span></p>
                </div>

                <button
                  onClick={generate}
                  disabled={fails.length > 0}
                  className={`w-full rounded-md px-5 py-4 font-mono text-[11px] tracking-[0.18em] uppercase transition-all duration-300 focus-ring ${
                    fails.length > 0
                      ? "border border-seam text-mist-600 cursor-not-allowed"
                      : "border border-lumen-500/60 bg-lumen-500/10 text-lumen-300 hover:bg-lumen-500/20 hover:shadow-[0_0_28px_rgba(62,207,178,0.2)] cursor-pointer"
                  }`}
                >
                  {fails.length > 0 ? `resolver ${fails.length} bloqueio${fails.length > 1 ? "s" : ""} antes de gerar` : "gerar fragmento público-seguro"}
                </button>

                {fragment && (
                  <div className="anim-step space-y-3">
                    <pre className="max-h-72 overflow-auto rounded-md border border-seam bg-ink-950/90 p-4 font-mono text-[10.5px] leading-relaxed text-mist-300 whitespace-pre-wrap break-all">
                      {fragment}
                    </pre>
                    <div className="flex flex-wrap gap-2.5">
                      <button onClick={copyFragment} className="rounded-md border border-seam-strong px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mist-300 hover:text-lumen-300 hover:border-lumen-500/50 transition-colors cursor-pointer focus-ring">
                        {copied ? "copiado ✓" : "copiar JSON"}
                      </button>
                      <button onClick={downloadFragment} className="rounded-md border border-seam-strong px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mist-300 hover:text-lumen-300 hover:border-lumen-500/50 transition-colors cursor-pointer focus-ring">
                        baixar .json
                      </button>
                      <button onClick={sendToDiff} className="rounded-md border border-gild-400/50 bg-gild-400/8 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gild-300 hover:bg-gild-400/15 transition-colors cursor-pointer focus-ring">
                        {handed ? "encaminhado ✓" : "abrir no Snapshot Diff →"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* checklist de validação */}
          <section aria-label="Verificações do rascunho" className="mt-6 rounded-lg border border-seam bg-ink-900/60 p-5">
            <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-mist-600 mb-3.5">
              verificações · {okCount}/{checks.length}
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {checks.map((c) => (
                <li key={c.id} className="flex items-start gap-2.5 py-0.5">
                  <span className={`mt-0.5 grid place-items-center w-4 h-4 shrink-0 rounded-full border ${c.ok ? "border-lumen-500/60 text-lumen-300" : c.severity === "block" ? "border-ember-400/60 text-ember-300" : "border-gild-400/60 text-gild-300"}`} aria-hidden="true">
                    {c.ok ? (
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1.5 5.5 4 8 8.5 2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    ) : c.severity === "block" ? (
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 2l6 6M8 2 2 8" strokeLinecap="round" /></svg>
                    ) : (
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 2v4" strokeLinecap="round" /><circle cx="5" cy="8" r="0.8" fill="currentColor" stroke="none" /></svg>
                    )}
                  </span>
                  <span className={`text-[12px] leading-snug ${c.ok ? "text-mist-500" : c.severity === "block" ? "text-mist-200" : "text-mist-400"}`}>
                    {c.label}
                    {c.detail && !c.ok && <span className="block font-mono text-[10px] text-ember-300/90 mt-0.5">{c.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* navegação */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              onClick={() => goto(step - 1)}
              disabled={step === 0}
              className={`rounded-md border px-5 py-3 font-mono text-[10px] tracking-[0.16em] uppercase transition-colors focus-ring ${
                step === 0 ? "border-seam text-mist-700 cursor-not-allowed" : "border-seam-strong text-mist-300 hover:text-lumen-300 hover:border-lumen-500/50 cursor-pointer"
              }`}
            >
              ← voltar
            </button>
            {step < STEPS.length - 1 && (
              <button
                onClick={() => goto(step + 1)}
                className="rounded-md border border-lumen-500/60 bg-lumen-500/10 px-6 py-3 font-mono text-[10px] tracking-[0.16em] uppercase text-lumen-300 hover:bg-lumen-500/20 transition-all duration-300 cursor-pointer focus-ring"
              >
                próxima etapa →
              </button>
            )}
          </div>
        </div>

        {/* pré-visualização viva */}
        <aside className="lg:col-span-3 lg:sticky lg:top-8" aria-label="Pré-visualização do registro">
          <div className="rounded-xl border border-seam-strong bg-ink-900/80 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-seam bg-ink-950/60 flex items-center justify-between">
              <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-mist-600">registro em formação</p>
              <span className={`w-1.5 h-1.5 rounded-full ${pulse ? "bg-lumen-400 anim-led" : "bg-mist-600"}`} aria-hidden="true" />
            </div>
            <div className="p-5 space-y-4">
              <p className="font-mono text-[10px] text-lumen-300/90 break-all">{draftToRecord(draft).id}</p>
              <h3 className="font-display text-2xl font-medium text-mist-50 leading-tight min-h-[2.4rem]">
                {draft.canonicalName.trim() || <span className="text-mist-600 italic text-lg">sem nome ainda</span>}
              </h3>
              <div className="flex flex-wrap gap-2">
                <LifecycleChip lifecycle={(draft.lifecycle as BuildingBlockRecord["lifecycle"]) ?? "RESEARCH"} />
                <RungChip rung={draft.rung} />
              </div>
              <dl className="space-y-2 font-mono text-[10.5px]">
                <div className="flex justify-between gap-3"><dt className="text-mist-600">tipo</dt><dd className="text-mist-300">{draft.kind}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-mist-600">família</dt><dd className="text-mist-300">{draft.family}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-mist-600">fontes</dt><dd className="text-mist-300">{draft.sourceRefs.filter((s) => s.label.trim()).length}/{draft.sourceRefs.length}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-mist-600">predecessores</dt><dd className="text-mist-300">{draft.predecessorIds.length}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-mist-600">capacidades</dt><dd className="text-mist-300">{draft.capabilities.filter((c) => c.label.trim()).length}</dd></div>
              </dl>
              {draft.positiveNote.trim() && (
                <blockquote className="border-l-2 border-gild-400/60 pl-3.5">
                  <p className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-gild-300/90 mb-1">valor de continuidade</p>
                  <p className="text-[12px] text-mist-300 leading-relaxed italic font-display">{draft.positiveNote}</p>
                </blockquote>
              )}
              <p className="pt-2 border-t border-seam font-mono text-[8.5px] leading-relaxed text-mist-600 uppercase tracking-[0.12em]">
                presença ≠ currentness · relação ≠ identidade · rascunho ≠ adoção
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

/* ---------------- subcomponentes ---------------- */

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] tracking-[0.18em] uppercase text-mist-400 mb-2">{label}</span>
      {children}
      {hint && !error && <span className="block text-[11px] text-mist-600 mt-1.5">{hint}</span>}
      {error && (
        <span className="block font-mono text-[10px] text-ember-300 mt-1.5" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

function SourceEditor({
  index,
  src,
  onChange,
  onRemove,
  failOf,
}: {
  index: number;
  src: SourceDraft;
  onChange: (patch: Partial<SourceDraft>) => void;
  onRemove?: () => void;
  failOf: (suffix: string) => string | undefined;
}) {
  return (
    <fieldset className="rounded-lg border border-seam bg-ink-950/50 p-5">
      <legend className="px-2 font-mono text-[9px] tracking-[0.24em] uppercase text-lumen-300/90">
        fonte {index + 1} · proveniência da afirmação
      </legend>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Rótulo" error={failOf("label")}>
          <input value={src.label} onChange={(e) => onChange({ label: e.target.value })} placeholder="ex.: HUI-Mater-Core · Issue #97" className={inputCls} />
        </Field>
        <Field label="Classe da fonte" error={failOf("class")}>
          <select value={src.sourceClass} onChange={(e) => onChange({ sourceClass: e.target.value })} className={selectCls}>
            {SOURCE_CLASSES.map((c) => (
              <option key={c} value={c}>{c} — {SOURCE_CLASS_LABEL[c]}</option>
            ))}
          </select>
        </Field>
        <Field label="Papel" error={failOf("role")}>
          <select value={src.role} onChange={(e) => onChange({ role: e.target.value })} className={selectCls}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Acesso" error={failOf("access")}>
          <select value={src.access} onChange={(e) => onChange({ access: e.target.value })} className={selectCls}>
            {ACCESS_OPTS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </Field>
        {src.access === "public" && (
          <Field label="URL pública (https)" error={failOf("url")}>
            <input value={src.safeUrl} onChange={(e) => onChange({ safeUrl: e.target.value })} placeholder="https://…" className={inputCls} />
          </Field>
        )}
        {src.access !== "public" && (
          <p className="self-end rounded-md border border-ember-400/35 bg-ember-400/5 px-3.5 py-2.5 text-[11.5px] text-ember-300/90 leading-snug">
            Material protegido expõe presença + metadado seguro — <span className="font-mono">sem URL</span>.
          </p>
        )}
        <Field label="Observado em (data)">
          <input value={src.observedAt} onChange={(e) => onChange({ observedAt: e.target.value })} placeholder="2026-08-30" className={inputCls} />
        </Field>
        <Field label="SHA / versão exata (se conhecida)" error={failOf("sha")}>
          <input value={src.sha} onChange={(e) => onChange({ sha: e.target.value })} placeholder="bca6afd…" className={`${inputCls} font-mono`} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Por que acreditamos nisto" error={failOf("why")}>
            <textarea value={src.whyWeBelieveThis} onChange={(e) => onChange({ whyWeBelieveThis: e.target.value })} rows={2} placeholder="A base observável desta referência…" className={`${inputCls} resize-y`} />
          </Field>
        </div>
      </div>
      {onRemove && (
        <button onClick={onRemove} className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-mist-500 hover:text-ember-300 transition-colors cursor-pointer focus-ring rounded">
          − remover fonte
        </button>
      )}
    </fieldset>
  );
}

function RecordPicker({ label, selected, onToggle }: { label: string; selected: string[]; onToggle: (id: string) => void }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => (q.trim() ? applyFilters(REGISTRY, parseQuery(q)).slice(0, 5) : []), [q]);
  const chosen = selected.map((id) => REGISTRY.find((r) => r.id === id)).filter(Boolean) as BuildingBlockRecord[];

  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-mist-400 mb-2">{label}</p>
      {chosen.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mb-2.5">
          {chosen.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => onToggle(r.id)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-lumen-500/45 bg-lumen-500/8 pl-3 pr-2 py-1 font-mono text-[9.5px] text-lumen-300 hover:border-ember-400/50 hover:text-ember-300 transition-colors cursor-pointer focus-ring"
                aria-label={`Remover ${r.canonicalName} da linhagem`}
              >
                {r.canonicalName}
                <svg viewBox="0 0 10 10" className="w-2 h-2 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M2 2l6 6M8 2 2 8" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="buscar no registry…" className={inputCls} aria-label={`Buscar registro para ${label}`} />
      {results.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {results.map((r) => {
            const on = selected.includes(r.id);
            return (
              <li key={r.id}>
                <button
                  onClick={() => onToggle(r.id)}
                  aria-pressed={on}
                  className={`w-full flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors cursor-pointer focus-ring ${
                    on ? "border-lumen-500/55 bg-lumen-500/8" : "border-seam bg-ink-950/40 hover:border-seam-strong"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-[12px] text-mist-200 truncate">{r.canonicalName}</span>
                    <span className="block font-mono text-[8.5px] uppercase tracking-[0.14em] text-mist-600">{r.kind} · {r.family}</span>
                  </span>
                  <span className={`shrink-0 font-mono text-[9px] uppercase ${on ? "text-lumen-300" : "text-mist-600"}`}>{on ? "na linhagem" : "+ vincular"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
