/* ------------------------------------------------------------------ */
/*  Captura Rápida / Treasure Drop — preserve primeiro, estruture      */
/*  depois. Submissão SOMENTE via Edge Function autenticada;           */
/*  fail-closed sem sessão; rascunhos locais com idempotência.         */
/* ------------------------------------------------------------------ */

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Reveal, Scramble } from "../motion";
import { SAFE_REL } from "../registry/model";
import {
  CONTENT_KINDS,
  InvalidGatewayReceiptError,
  LOCAL_DROP_STATUS_LABEL,
  SENSITIVITY,
  SENSITIVITY_LABEL,
  SOURCE_TYPES,
  isPublicSafe,
  loadLocalDrops,
  maskUnlessPublic,
  newIdempotencyKey,
  upsertLocalDrop,
  validatePayload,
  type ContentKind,
  type GatewayReceipt,
  type LocalDrop,
  type Sensitivity,
  type SourceType,
  type TreasureDropPayload,
} from "./treasureModel";
import {
  GATEWAY_FUNCTION,
  GATEWAY_LIFECYCLE,
  GATEWAY_ROUTE,
  GatewayAuthError,
  GatewayRejectedError,
  UnavailableTreasureGateway,
  createTreasureGateway,
} from "../gateway/treasureDropGateway";

const PIPELINE = [
  { n: "01", t: "RAW HUMAN DISCOVERY", d: "a palavra, o link, a observação" },
  { n: "02", t: "TREASURE DROP", d: "preservação com idempotência" },
  { n: "03", t: "QUARANTINE", d: "REPORTED · autoridade NONE" },
  { n: "04", t: "TRIAGE", d: "interpretação secundária, nunca cânone" },
  { n: "05", t: "SNAPSHOT DIFF / INTAKE", d: "estrutura, quando útil" },
  { n: "06", t: "REGISTRY CANDIDATE", d: "possible later review/adoption" },
];

const SEMANTIC_LAW = [
  "DISCOVERED ≠ ADOPTED",
  "REPORTED ≠ VERIFIED",
  "TRIAGED ≠ ACCEPTED",
  "CANDIDATE ≠ CANON",
  "TESTED ≠ ASSURED",
  "MERGED ≠ DEPLOYED",
  "DEPLOYED ≠ EXTERNALLY_READ_BACK",
  "REGISTRATION ≠ AIPFIT",
];

const inputCls =
  "w-full rounded-md border border-seam bg-ink-950/70 px-3.5 py-2.5 text-sm text-mist-100 placeholder:text-mist-600 outline-none focus:border-lumen-500/60 transition-colors";

interface FormState {
  raw: string;
  uri: string;
  sourceType: SourceType;
  contentKind: ContentKind;
  sourceRef: string;
  sensitivity: Sensitivity;
  creative: boolean;
  language: string;
}

const emptyForm = (): FormState => ({
  raw: "",
  uri: "",
  sourceType: "MANUAL",
  contentKind: "TEXT",
  sourceRef: "",
  sensitivity: "PUBLIC_SAFE",
  creative: false,
  language: "pt-BR",
});

export default function TreasureDrop() {
  const [gateway] = useState(() => createTreasureGateway());
  const [form, setForm] = useState<FormState>(emptyForm);
  const formKeyRef = useRef(newIdempotencyKey());
  const [drops, setDrops] = useState<LocalDrop[]>(() => loadLocalDrops());
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ tone: "ok" | "warn" | "err"; msg: string } | null>(null);
  const [openReceipt, setOpenReceipt] = useState<string | null>(null);

  const unavailableReason = gateway.mode === "unavailable" ? (gateway as UnavailableTreasureGateway).reason : null;

  const effectiveKind = (f: FormState): ContentKind => {
    const hasRaw = f.raw.trim().length > 0;
    const hasUri = f.uri.trim().length > 0;
    if (f.contentKind !== "TEXT") return f.contentKind;
    if (hasRaw && hasUri) return "MIXED";
    if (hasUri) return "LINK";
    return "TEXT";
  };

  const resetForm = () => {
    setForm(emptyForm());
    formKeyRef.current = newIdempotencyKey();
  };

  const buildPayload = (f: FormState, key: string): TreasureDropPayload => ({
    idempotency_key: key,
    source_type: f.sourceType,
    content_kind: effectiveKind(f),
    raw_content: f.raw.trim() || undefined,
    external_uri: f.uri.trim() || undefined,
    source_ref: f.sourceRef.trim() || undefined,
    language: f.language,
    sensitivity: f.sensitivity,
    potential_creative_contribution: f.creative,
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busyKey) return;
    const payload = buildPayload(form, formKeyRef.current);
    const errs = validatePayload(payload);
    if (errs.length > 0) {
      setBanner({ tone: "err", msg: errs.join(" ") });
      return;
    }

    const now = new Date().toISOString();
    const base: LocalDrop = {
      key: payload.idempotency_key,
      payload,
      status: gateway.mode === "supabase-edge" ? "SUBMISSION_PENDING" : "LOCAL_DRAFT",
      gatewayNote: unavailableReason ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
    setDrops(upsertLocalDrop(base));

    if (gateway.mode === "unavailable") {
      setBanner({
        tone: "warn",
        msg: "Preservado localmente como LOCAL_DRAFT — gateway indisponível neste ambiente. Nenhuma submissão de servidor ocorreu nem foi simulada.",
      });
      resetForm();
      return;
    }

    setBusyKey(base.key);
    try {
      const receipt = await gateway.submit(payload);
      setDrops(upsertLocalDrop({ ...base, status: "RECEIVED_BY_GATEWAY", receipt, updatedAt: new Date().toISOString() }));
      setBanner({
        tone: "ok",
        msg: `Recebido pelo gateway (id ${receipt.id.slice(0, 8)}…) — QUARANTINED, autoridade NONE, nenhuma adoção.`,
      });
      resetForm();
    } catch (err) {
      const msg =
        err instanceof InvalidGatewayReceiptError
          ? "Recibo do gateway inválido ou mais maduro que o contrato — rejeitado (INVALID_GATEWAY_RECEIPT). Nenhum aceite registrado; rascunho preservado como NÃO RECEBIDO."
          : err instanceof GatewayAuthError
            ? err.message
            : err instanceof GatewayRejectedError
              ? err.message
              : "Falha inesperada ao submeter — rascunho preservado.";
      setDrops(upsertLocalDrop({ ...base, status: "FAILED_TO_SUBMIT", failure: msg, updatedAt: new Date().toISOString() }));
      setBanner({ tone: "err", msg: `${msg} A mesma idempotency_key será reutilizada no retry — sem duplicatas.` });
    } finally {
      setBusyKey(null);
    }
  };

  const retry = async (item: LocalDrop) => {
    if (busyKey || gateway.mode !== "supabase-edge") return;
    setBusyKey(item.key);
    const now = new Date().toISOString();
    setDrops(upsertLocalDrop({ ...item, status: "SUBMISSION_PENDING", failure: undefined, updatedAt: now }));
    try {
      const receipt = await gateway.submit(item.payload);
      setDrops(upsertLocalDrop({ ...item, status: "RECEIVED_BY_GATEWAY", receipt, updatedAt: new Date().toISOString() }));
      setBanner({ tone: "ok", msg: `Retry recebido (mesma idempotency_key) — ${receipt.triage_status}.` });
    } catch (err) {
      const msg =
        err instanceof InvalidGatewayReceiptError
          ? "Recibo do gateway inválido ou mais maduro que o contrato — rejeitado (INVALID_GATEWAY_RECEIPT). Nenhum aceite registrado; rascunho preservado como NÃO RECEBIDO."
          : err instanceof GatewayAuthError
            ? err.message
            : err instanceof GatewayRejectedError
              ? err.message
              : "Retry falhou — rascunho preservado.";
      setDrops(upsertLocalDrop({ ...item, status: "FAILED_TO_SUBMIT", failure: msg, updatedAt: new Date().toISOString() }));
      setBanner({ tone: "err", msg });
    } finally {
      setBusyKey(null);
    }
  };

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const charCount = form.raw.length;

  return (
    <div className="relative min-h-screen bg-ink-950 text-mist-200 font-body">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="atlas-grid absolute inset-x-0 top-0 h-[420px] pointer-events-none" aria-hidden="true" />

      <a
        href="#conteudo-captura"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById("conteudo-captura");
          el?.focus();
          el?.scrollIntoView?.();
        }}
        className="skip-link"
      >
        pular para a captura
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
              <Scramble text="Captura Rápida" />
            </h1>
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600 mt-2">
              treasure drop · capture agora · estruture depois
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full border border-gild-400/45 text-gild-300 font-mono text-[9px] uppercase tracking-[0.14em]">captura ≠ adoção</span>
            <span className="px-3 py-1.5 rounded-full border border-seam-strong text-mist-400 font-mono text-[9px] uppercase tracking-[0.14em]">REPORTED · QUARANTINED · NOT_ADOPTED</span>
            <span className="hidden md:inline-flex px-3 py-1.5 rounded-full border border-lumen-500/40 text-lumen-300 font-mono text-[9px] uppercase tracking-[0.14em]">AIPFIT: não solicitado por padrão</span>
          </div>
        </div>
      </header>

      <main id="conteudo-captura" tabIndex={-1} className="relative mx-auto max-w-7xl px-5 sm:px-8 py-10 pb-32 grid lg:grid-cols-12 gap-8 items-start">
        {/* ------------ superfície de captura ------------ */}
        <div className="lg:col-span-7 space-y-6">
          <Reveal>
            <form onSubmit={onSubmit} aria-label="Formulário de captura rápida" className="relative rounded-xl border border-seam-strong bg-gradient-to-b from-ink-850 to-ink-900 p-6 sm:p-8 overflow-hidden">
              <span className="absolute top-0 left-0 h-full w-[3px] bg-lumen-400" aria-hidden="true" />
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <h2 className="font-display text-2xl font-medium text-mist-50">O que você encontrou?</h2>
                <span className={`font-mono text-[9px] tracking-[0.16em] uppercase ${charCount > 65536 ? "text-ember-300" : "text-mist-600"}`}>{charCount} / 65536</span>
              </div>
              <p className="text-[13px] text-mist-400 leading-relaxed mt-1.5 max-w-xl">
                Uma palavra, um link, uma observação inacabada. Sem Holon, sem categoria de Registry, sem título formal, sem
                decisão de adoção. <span className="text-lumen-300">Estrutura vem depois da preservação.</span>
              </p>

              <textarea
                value={form.raw}
                onChange={(e) => set({ raw: e.target.value })}
                rows={4}
                maxLength={66000}
                placeholder={"“Abiu”\nou “11 frutas que o mercado de cosméticos compra pra extrair óleo”\nou uma observação qualquer do dia…"}
                className={`${inputCls} mt-5 resize-y leading-relaxed`}
                aria-label="Pensamento ou observação bruta"
              />

              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <label className="block">
                  <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-mist-600">URL (opcional)</span>
                  <input value={form.uri} onChange={(e) => set({ uri: e.target.value })} maxLength={4096} placeholder="https://…" className={`${inputCls} mt-1.5 font-mono text-[12px]`} />
                </label>
                <label className="block">
                  <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-mist-600">Fonte / proveniência (opcional)</span>
                  <input value={form.sourceRef} onChange={(e) => set({ sourceRef: e.target.value })} placeholder="quem contou, de onde veio, em que conversa…" className={`${inputCls} mt-1.5`} />
                </label>
                <label className="block">
                  <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-mist-600">tipo de fonte</span>
                  <select value={form.sourceType} onChange={(e) => set({ sourceType: e.target.value as SourceType })} className={`${inputCls} mt-1.5 cursor-pointer`}>
                    {SOURCE_TYPES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-mist-600">tipo de conteúdo</span>
                  <select value={form.contentKind} onChange={(e) => set({ contentKind: e.target.value as ContentKind })} className={`${inputCls} mt-1.5 cursor-pointer`}>
                    {CONTENT_KINDS.map((c) => (
                      <option key={c} value={c}>{c}{c === "TEXT" ? " (auto: LINK/MIXED)" : ""}</option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className="mt-5">
                <legend className="font-mono text-[9px] tracking-[0.18em] uppercase text-mist-600 mb-2.5">sensibilidade</legend>
                <div className="flex flex-wrap gap-2">
                  {SENSITIVITY.map((s) => (
                    <label key={s} className={`cursor-pointer px-3.5 py-2 rounded-full border font-mono text-[10px] tracking-[0.1em] uppercase transition-all duration-200 ${form.sensitivity === s ? "border-lumen-400/70 text-lumen-300 bg-lumen-500/10" : "border-seam text-mist-500 hover:border-seam-strong"}`}>
                      <input type="radio" name="sensitivity" value={s} checked={form.sensitivity === s} onChange={() => set({ sensitivity: s })} className="sr-only" />
                      {SENSITIVITY_LABEL[s]}
                    </label>
                  ))}
                </div>
                {form.sensitivity !== "PUBLIC_SAFE" && (
                  <p className="text-[11px] text-ember-300/90 leading-relaxed mt-2.5">
                    Conteúdo não público-seguro nunca aparece em exports, âncoras ou vistas públicas — só metadado de presença.
                  </p>
                )}
              </fieldset>

              <label className="flex items-start gap-3 mt-5 cursor-pointer group">
                <input type="checkbox" checked={form.creative} onChange={(e) => set({ creative: e.target.checked })} className="mt-1 w-4 h-4 accent-[#5fe3c8]" />
                <span className="text-[13px] text-mist-400 leading-relaxed group-hover:text-mist-300 transition-colors">
                  <span className="text-mist-200">Possível contribuição criativa</span> — apenas um marcador de preservação/revisão.{" "}
                  <span className="text-gild-300">Não significa</span> registro, tokenização, aceite, propriedade, atribuição legal ou AIPFIT.
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-4 mt-7">
                <button
                  type="submit"
                  disabled={busyKey !== null}
                  className="group flex items-center gap-3 px-6 py-3 rounded-lg bg-lumen-500/15 border border-lumen-400/60 text-lumen-300 font-mono text-[11px] tracking-[0.16em] uppercase transition-all duration-200 hover:bg-lumen-500/25 hover:shadow-[0_0_28px_rgba(62,207,178,0.25)] disabled:opacity-50 disabled:cursor-wait cursor-pointer focus-ring"
                >
                  <svg viewBox="0 0 20 20" className={`w-4 h-4 ${busyKey ? "anim-spin-slow" : "transition-transform duration-300 group-hover:translate-y-0.5"}`} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M10 3v10M5.5 9 10 13.5 14.5 9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3.5 16.5h13" strokeLinecap="round" />
                  </svg>
                  {busyKey ? "enviando…" : gateway.mode === "supabase-edge" ? "enviar ao gateway autenticado" : "preservar localmente"}
                </button>
                <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-mist-600">
                  idempotency_key: <span className="text-mist-400">{formKeyRef.current.slice(0, 13)}…</span>
                </p>
              </div>

              {banner && (
                <p
                  role={banner.tone === "err" ? "alert" : "status"}
                  className={`mt-5 rounded-md border px-4 py-3 text-[13px] leading-relaxed ${
                    banner.tone === "ok"
                      ? "border-lumen-500/45 bg-lumen-500/8 text-lumen-300"
                      : banner.tone === "warn"
                        ? "border-gild-400/45 bg-gild-400/8 text-gild-300"
                        : "border-ember-400/45 bg-ember-400/8 text-ember-300"
                  }`}
                >
                  {banner.msg}
                </p>
              )}
            </form>
          </Reveal>

          <Reveal delay={120}>
            <p className="text-[12px] text-mist-500 leading-relaxed max-w-2xl">
              Esta entrada será preservada como <span className="font-mono text-[11px] text-lumen-300">REPORTED</span> /{" "}
              <span className="font-mono text-[11px] text-gild-300">QUARANTINED</span> /{" "}
              <span className="font-mono text-[11px] text-mist-300">NOT_ADOPTED</span> — estados fixados pelo contrato do gateway, nunca
              alterados pelo cliente. Espontaneidade, voz, humor e ambiguidade são preservados antes de qualquer normalização.
            </p>
          </Reveal>
        </div>

        {/* ------------ trilho direito ------------ */}
        <div className="lg:col-span-5 space-y-6">
          <Reveal delay={80}>
            <div className="rounded-lg border border-seam bg-ink-900/70 p-6">
              <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-mist-600">fronteira de submissão</p>
              <p className="font-mono text-[12px] text-lumen-300 mt-3 break-all">
                UI → Edge Function <span className="text-mist-100">{GATEWAY_FUNCTION}</span> → <span className="text-mist-100">{GATEWAY_ROUTE}</span>
              </p>
              <p className="text-[12px] text-mist-500 leading-relaxed mt-2.5">
                Sem acesso direto a tabelas, sem RPC direto, sem chave de service role. Sem sessão autenticada:{" "}
                <span className="text-ember-300">fail-closed</span>.
              </p>
              <p className={`mt-3 rounded-md border px-3.5 py-2.5 font-mono text-[9px] tracking-[0.1em] uppercase leading-relaxed ${gateway.mode === "supabase-edge" ? "border-lumen-500/40 text-lumen-300" : "border-gild-400/45 text-gild-300"}`}>
                {gateway.mode === "supabase-edge" ? "gateway disponível · invocação autenticada" : "gateway indisponível neste ambiente · apenas rascunho local"}
              </p>
              <p className="font-mono text-[8.5px] tracking-[0.08em] uppercase text-mist-600 leading-relaxed mt-3">{GATEWAY_LIFECYCLE}</p>
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="rounded-lg border border-seam bg-ink-900/70 p-6">
              <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-mist-600 mb-4">pipeline humano</p>
              <ol className="relative space-y-3.5">
                <span className="absolute left-[11px] top-2 bottom-2 w-px bg-seam" aria-hidden="true" />
                {PIPELINE.map((p) => (
                  <li key={p.n} className="relative flex gap-3.5 group">
                    <span className="relative z-[1] grid place-items-center w-6 h-6 shrink-0 rounded-full border border-lumen-500/40 bg-ink-950 font-mono text-[8px] text-lumen-300 transition-colors duration-300 group-hover:border-lumen-300">
                      {p.n.slice(1)}
                    </span>
                    <span>
                      <span className="block font-mono text-[10px] tracking-[0.14em] uppercase text-mist-300 group-hover:text-lumen-300 transition-colors">{p.t}</span>
                      <span className="block text-[11px] text-mist-600 mt-0.5">{p.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="rounded-lg border border-seam bg-ink-900/70 p-6">
              <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-mist-600 mb-3.5">lei semântica</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {SEMANTIC_LAW.map((r) => (
                  <li key={r} className="font-mono text-[9.5px] tracking-[0.06em] text-mist-500 hover:text-gild-300 transition-colors cursor-default">{r}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* ------------ capturas locais ------------ */}
        <section className="lg:col-span-12" aria-label="Suas capturas locais">
          <div className="flex items-baseline gap-4 flex-wrap mb-5">
            <h2 className="font-display text-2xl font-medium text-mist-50">Suas capturas</h2>
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-lumen-400">{drops.length}</span>
            <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-mist-600">
              LOCAL_DRAFT · SUBMISSION_PENDING · RECEIVED_BY_GATEWAY · FAILED_TO_SUBMIT
            </span>
          </div>

          {unavailableReason && drops.length > 0 && (
            <p className="mb-5 rounded-md border border-gild-400/40 bg-gild-400/6 px-4 py-3 text-[12px] text-gild-300/90 leading-relaxed max-w-3xl">
              {unavailableReason}
            </p>
          )}

          {drops.length === 0 ? (
            <p className="text-sm text-mist-600 italic">Nenhuma captura ainda — a primeira pode ser uma palavra só.</p>
          ) : (
            <ul className="space-y-3">
              {drops.map((d) => (
                <DropRow key={d.key} drop={d} busy={busyKey === d.key} receiptOpen={openReceipt === d.key} onToggleReceipt={() => setOpenReceipt(openReceipt === d.key ? null : d.key)} onRetry={() => retry(d)} canRetry={gateway.mode === "supabase-edge"} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

/* ================= linha de captura ================= */

function DropRow({ drop, busy, receiptOpen, onToggleReceipt, onRetry, canRetry }: { drop: LocalDrop; busy: boolean; receiptOpen: boolean; onToggleReceipt: () => void; onRetry: () => void; canRetry: boolean }) {
  const p = drop.payload;
  const tone =
    drop.status === "RECEIVED_BY_GATEWAY"
      ? "border-lumen-500/50 text-lumen-300 bg-lumen-500/10"
      : drop.status === "FAILED_TO_SUBMIT"
        ? "border-ember-400/50 text-ember-300 bg-ember-400/8"
        : drop.status === "SUBMISSION_PENDING"
          ? "border-seam-strong text-mist-300 bg-ink-800/70"
          : "border-mist-600/50 text-mist-400 bg-ink-900/50";

  const snippet = p.raw_content ? maskUnlessPublic(p.raw_content, p.sensitivity) : null;
  const showUri = isPublicSafe(p.sensitivity);

  return (
    <li className="rounded-lg border border-seam bg-ink-900/60 p-5 transition-colors duration-300 hover:border-seam-strong">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`px-2.5 py-1 rounded-full border font-mono text-[9px] uppercase tracking-[0.12em] ${tone}`}>
          {LOCAL_DROP_STATUS_LABEL[drop.status]}
        </span>
        <span className="px-2.5 py-1 rounded-full border border-seam font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">
          {SENSITIVITY_LABEL[p.sensitivity]}
        </span>
        <span className="px-2.5 py-1 rounded-full border border-seam font-mono text-[9px] uppercase tracking-[0.12em] text-mist-500">
          {p.content_kind} · {p.source_type}
        </span>
        {p.potential_creative_contribution && (
          <span className="px-2.5 py-1 rounded-full border border-gild-400/45 font-mono text-[9px] uppercase tracking-[0.12em] text-gild-300" title="Marcador de preservação/revisão — não é registro AIPFIT">
            possível contribuição criativa ≠ registro
          </span>
        )}
        <span className="ml-auto font-mono text-[9px] text-mist-600">{new Date(drop.updatedAt).toLocaleString("pt-BR")}</span>
      </div>

      {snippet && <p className="text-sm text-mist-300 leading-relaxed mt-3.5 whitespace-pre-wrap">{snippet.length > 240 ? `${snippet.slice(0, 240)}…` : snippet}</p>}
      {p.external_uri &&
        (showUri ? (
          <a href={p.external_uri} target="_blank" rel={SAFE_REL} className="inline-block font-mono text-[11px] text-lumen-400 hover:text-lumen-300 mt-2 break-all focus-ring rounded">
            {p.external_uri} ↗
          </a>
        ) : (
          <p className="font-mono text-[11px] text-mist-600 mt-2">URL preservada — não exibida/ancorada (sensibilidade {SENSITIVITY_LABEL[p.sensitivity]}).</p>
        ))}
      {p.source_ref && <p className="text-[12px] text-mist-500 mt-2">proveniência: {maskUnlessPublic(p.source_ref, p.sensitivity)}</p>}

      <div className="flex flex-wrap gap-2.5 mt-4">
        {drop.status === "RECEIVED_BY_GATEWAY" && drop.receipt && (
          <button onClick={onToggleReceipt} aria-expanded={receiptOpen} className="px-3.5 py-1.5 rounded-md border border-lumen-500/45 font-mono text-[9px] uppercase tracking-[0.14em] text-lumen-300 hover:bg-lumen-500/10 transition-colors cursor-pointer focus-ring">
            {receiptOpen ? "ocultar receipt" : "ver receipt"}
          </button>
        )}
        {drop.status === "FAILED_TO_SUBMIT" && canRetry && (
          <button onClick={onRetry} disabled={busy} className="px-3.5 py-1.5 rounded-md border border-ember-400/50 font-mono text-[9px] uppercase tracking-[0.14em] text-ember-300 hover:bg-ember-400/10 transition-colors cursor-pointer disabled:opacity-50 focus-ring">
            {busy ? "reenviando…" : "retry · mesma idempotency_key"}
          </button>
        )}
        <span className="px-3.5 py-1.5 rounded-md border border-seam font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600">
          key {drop.key.slice(0, 13)}…
        </span>
      </div>

      {drop.status === "FAILED_TO_SUBMIT" && drop.failure && (
        <p role="alert" className="mt-3 text-[12px] text-ember-300/90 leading-relaxed">{drop.failure}</p>
      )}

      {receiptOpen && drop.receipt && <ReceiptBlock receipt={drop.receipt} />}
      {drop.status === "LOCAL_DRAFT" && <LocalSemantics />}
    </li>
  );
}

/* ================= receipt com estados exatos ================= */

export function ReceiptBlock({ receipt }: { receipt: GatewayReceipt }) {
  const rows: [string, string, string][] = [
    ["Evidence", receipt.evidence_state, "relato recebido — nada foi verificado"],
    ["Authority", receipt.authority_state, "nenhuma autoridade atribuída"],
    ["Triage", receipt.triage_status, "em quarentena, aguardando triagem"],
    ["Adoption", receipt.adoption_state, "nenhuma adoção ocorreu"],
    ["AIPFIT", receipt.aipfit_registration_state, "registro AIPFIT não solicitado — padrão"],
  ];
  return (
    <div className="mt-4 rounded-md border border-lumen-500/35 bg-ink-950/80 p-5" data-testid="receipt-block">
      <p className="font-mono text-[10px] tracking-[0.24em] uppercase text-lumen-300">recebido</p>
      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 mt-4">
        {rows.map(([k, v, human]) => (
          <div key={k} className="flex items-baseline gap-3">
            <dt className="font-mono text-[9px] tracking-[0.16em] uppercase text-mist-600 w-20 shrink-0">{k}</dt>
            <dd>
              <span className="font-mono text-[11px] text-mist-100">{v}</span>
              <span className="block text-[10.5px] text-mist-600">{human}</span>
            </dd>
          </div>
        ))}
        <div className="flex items-baseline gap-3">
          <dt className="font-mono text-[9px] tracking-[0.16em] uppercase text-mist-600 w-20 shrink-0">id</dt>
          <dd className="font-mono text-[11px] text-mist-300 break-all">{receipt.id}</dd>
        </div>
        {receipt.created_at && (
          <div className="flex items-baseline gap-3">
            <dt className="font-mono text-[9px] tracking-[0.16em] uppercase text-mist-600 w-20 shrink-0">created</dt>
            <dd className="font-mono text-[11px] text-mist-300">{receipt.created_at}</dd>
          </div>
        )}
      </dl>
      <p className="text-[11px] text-mist-600 leading-relaxed mt-4">
        Estes rótulos vêm do contrato do gateway e nunca são alterados no cliente para parecerem mais maduros.
      </p>
    </div>
  );
}

function LocalSemantics() {
  return (
    <p className="mt-3 text-[11px] text-mist-600 leading-relaxed">
      Sem receipt de servidor — rascunho local. O contrato do gateway imporia: <span className="font-mono text-mist-400">REPORTED · NONE · QUARANTINED · NOT_ADOPTED · REGISTRATION_NOT_REQUESTED</span>.
    </p>
  );
}
