/* ------------------------------------------------------------------ */
/*  Building Block Inspector v0.1 — P1                                 */
/*  Abre qualquer bloco do registry sem sair da experiência.           */
/* ------------------------------------------------------------------ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  EVIDENCE_RUNGS,
  LIFECYCLE_LABEL,
  CURRENTNESS_LABEL,
  SOURCE_CLASS_LABEL,
  SAFE_REL,
  type BuildingBlockRecord,
} from "./model";
import { getRecord } from "./queries";

/* ---------------- contexto ---------------- */

interface InspectorCtx {
  open(record: BuildingBlockRecord): void;
  openById(id: string): void;
  close(): void;
  current: BuildingBlockRecord | null;
}

const Ctx = createContext<InspectorCtx | null>(null);

export function useInspector(): InspectorCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useInspector fora do RegistryProvider");
  return v;
}

export function RegistryProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<BuildingBlockRecord | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const open = useCallback((record: BuildingBlockRecord) => {
    lastFocus.current = (document.activeElement as HTMLElement) ?? null;
    setCurrent(record);
  }, []);

  const openById = useCallback(
    (id: string) => {
      const r = getRecord(id);
      if (r) open(r);
    },
    [open],
  );

  const close = useCallback(() => {
    setCurrent(null);
    lastFocus.current?.focus?.();
  }, []);

  const value = useMemo(() => ({ open, openById, close, current }), [open, openById, close, current]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <InspectorDrawer record={current} onClose={close} />
    </Ctx.Provider>
  );
}

/* ---------------- chips de estado ---------------- */

export function LifecycleChip({ lifecycle }: { lifecycle: BuildingBlockRecord["lifecycle"] }) {
  const tone =
    lifecycle === "CURRENT"
      ? "border-lumen-500/60 text-lumen-300 bg-lumen-500/10"
      : lifecycle === "PREDECESSOR" || lifecycle === "SUPERSEDED_BUT_RETAINED" || lifecycle === "HELD"
        ? "border-gild-400/50 text-gild-300 bg-gild-400/8"
        : lifecycle === "PROPOSED_NOT_CONFIGURED" || lifecycle === "RESEARCH"
          ? "border-mist-600/60 text-mist-400"
          : "border-seam-strong text-mist-300 bg-ink-800/60";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-mono text-[9px] uppercase tracking-[0.12em] whitespace-nowrap ${tone}`}>
      {LIFECYCLE_LABEL[lifecycle] ?? lifecycle}
    </span>
  );
}

export function RungChip({ rung }: { rung: number }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-ember-400/40 text-ember-300 font-mono text-[9px] uppercase tracking-[0.12em] whitespace-nowrap">
      evidência · {EVIDENCE_RUNGS[rung] ?? "visão"}
    </span>
  );
}

/* ---------------- drawer ---------------- */

const TABS = ["Visão geral", "Fonte", "Currentness", "Evidência", "Linhagem", "Capacidades", "Próximos passos"] as const;

function InspectorDrawer({ record, onClose }: { record: BuildingBlockRecord | null; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const [announce, setAnnounce] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);

  useEffect(() => {
    if (record) {
      openRef.current = true;
      setTab(0);
      document.body.style.overflow = "hidden";
      setAnnounce(`Inspector aberto: ${record.canonicalName}. Estado: ${LIFECYCLE_LABEL[record.lifecycle]}.`);
      const t = window.setTimeout(() => panelRef.current?.focus(), 40);
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
    if (openRef.current) {
      openRef.current = false;
      document.body.style.overflow = "";
      setAnnounce("Inspector fechado.");
    }
  }, [record]);

  /* Esc (captura) + armadilha de foco */
  useEffect(() => {
    if (!record) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const els = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (els.length === 0) return;
        const first = els[0];
        const last = els[els.length - 1];
        const active = document.activeElement as HTMLElement;
        if (e.shiftKey && (active === first || active === panelRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [record, onClose]);

  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const n = (tab + 1) % TABS.length;
      setTab(n);
      tabsRef.current?.querySelectorAll<HTMLButtonElement>("button")[n]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const n = (tab - 1 + TABS.length) % TABS.length;
      setTab(n);
      tabsRef.current?.querySelectorAll<HTMLButtonElement>("button")[n]?.focus();
    }
  };

  return (
    <>
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      <div
        className={`fixed inset-0 z-[80] transition-opacity duration-300 ${record ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!record}
      >
        <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-[4px]" onMouseDown={onClose} />
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={record ? `Inspector: ${record.canonicalName}` : "Inspector"}
          className={`absolute right-0 top-0 h-full w-full sm:w-[480px] bg-ink-900 border-l border-seam-strong shadow-[-30px_0_80px_rgba(0,0,0,0.6)] flex flex-col outline-none transition-transform duration-300 ease-out ${
            record ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {record && (
            <>
              {/* header */}
              <header className="px-6 pt-6 pb-4 border-b border-seam shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.26em] uppercase text-mist-600">
                      {record.kind} · {record.family} · <span className="text-lumen-400/80">{record.id}</span>
                    </p>
                    <h2 className="font-display text-2xl font-medium text-mist-50 leading-tight mt-2">{record.canonicalName}</h2>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Fechar inspector"
                    className="shrink-0 grid place-items-center w-9 h-9 rounded-md border border-seam text-mist-400 hover:text-lumen-300 hover:border-lumen-500/50 transition-colors cursor-pointer focus-ring"
                  >
                    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <LifecycleChip lifecycle={record.lifecycle} />
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-seam text-mist-400 font-mono text-[9px] uppercase tracking-[0.12em]">
                    {CURRENTNESS_LABEL[record.currentness]}
                  </span>
                  <RungChip rung={record.evidence.rung} />
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-seam text-mist-500 font-mono text-[9px] uppercase tracking-[0.12em]">
                    {record.publicability}
                  </span>
                </div>
              </header>

              {/* tabs */}
              <div ref={tabsRef} role="tablist" aria-label="Lentes do inspector" onKeyDown={onTabKey} className="flex gap-1 px-4 pt-3 overflow-x-auto border-b border-seam shrink-0 [scrollbar-width:none]">
                {TABS.map((t, i) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === i}
                    tabIndex={tab === i ? 0 : -1}
                    onClick={() => setTab(i)}
                    className={`shrink-0 px-3 py-2 rounded-t-md font-mono text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer focus-ring ${
                      tab === i ? "text-lumen-300 border-b-2 border-lumen-400 bg-lumen-500/5" : "text-mist-500 hover:text-mist-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* corpo */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {tab === 0 && <OverviewTab r={record} />}
                {tab === 1 && <SourceTab r={record} />}
                {tab === 2 && <CurrentnessTab r={record} />}
                {tab === 3 && <EvidenceTab r={record} />}
                {tab === 4 && <LineageTab r={record} />}
                {tab === 5 && <CapabilitiesTab r={record} />}
                {tab === 6 && <NextTab r={record} />}
              </div>

              {/* nota de valor de continuidade — sempre visível */}
              <footer className="shrink-0 border-t border-gild-400/30 bg-gild-400/5 px-6 py-4">
                <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-gild-400 mb-1.5">valor de continuidade</p>
                <p className="text-[13px] text-mist-200 leading-relaxed font-display italic">“{record.positiveNote}”</p>
              </footer>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------- abas ---------------- */

function H({ children }: { children: ReactNode }) {
  return <h3 className="font-mono text-[9px] tracking-[0.26em] uppercase text-mist-600 mb-3">{children}</h3>;
}

function OverviewTab({ r }: { r: BuildingBlockRecord }) {
  return (
    <div className="space-y-7">
      <section>
        <H>o que é</H>
        <p className="text-sm text-mist-300 leading-relaxed">{r.description}</p>
        {r.aliases && r.aliases.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {r.aliases.map((a) => (
              <span key={a} className="px-2.5 py-1 rounded-full border border-seam font-mono text-[10px] text-mist-500">
                {a}
              </span>
            ))}
          </div>
        )}
      </section>
      <section>
        <H>destinos permitidos</H>
        <div className="flex flex-wrap gap-3">
          {r.route && (
            <a href={`#${r.route}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-lumen-500/50 bg-lumen-500/10 text-lumen-300 font-mono text-[11px] tracking-[0.12em] uppercase hover:bg-lumen-500/20 transition-colors focus-ring">
              abrir rota local {r.route}
              <ArrowIcon />
            </a>
          )}
          {r.externalUrl && (
            <a href={r.externalUrl} target="_blank" rel={SAFE_REL} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-seam-strong text-mist-300 font-mono text-[11px] tracking-[0.12em] uppercase hover:border-lumen-500/50 hover:text-lumen-300 transition-colors focus-ring">
              abrir destino externo
              <ExternalIcon />
            </a>
          )}
          {!r.route && !r.externalUrl && <p className="text-sm text-mist-500 italic">Nenhum destino público autorizado — presença é metadado, não acesso.</p>}
        </div>
      </section>
    </div>
  );
}

function SourceTab({ r }: { r: BuildingBlockRecord }) {
  return (
    <div className="space-y-5">
      <H>proveniência · por que acreditamos nisto</H>
      {r.sourceRefs.map((s) => (
        <article key={s.id} className="rounded-lg border border-seam bg-ink-950/60 p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="font-mono text-[11px] text-mist-100">{s.label}</p>
            <span className={`px-2 py-0.5 rounded-full border font-mono text-[8px] uppercase tracking-[0.14em] ${s.access === "public" ? "border-lumen-500/50 text-lumen-300" : "border-ember-400/40 text-ember-300"}`}>
              {s.access}
            </span>
          </div>
          <p className="font-mono text-[10px] text-mist-500 mt-2">
            {SOURCE_CLASS_LABEL[s.sourceClass]} · papel: {s.role}
            {s.observedAt && <> · observado em {s.observedAt}</>}
          </p>
          {s.sha && (
            <p className="font-mono text-[10px] text-gild-300/90 mt-1.5 break-all">sha {s.sha}</p>
          )}
          <blockquote className="mt-3 border-l-2 border-seam-strong pl-3 text-[13px] text-mist-400 italic leading-relaxed">
            {s.whyWeBelieveThis}
          </blockquote>
          {s.access !== "public" && (
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-ember-300">
              url protegida — somente metadados seguros são expostos
            </p>
          )}
          {s.safeUrl && (
            <a href={s.safeUrl} target="_blank" rel={SAFE_REL} className="inline-flex items-center gap-2 mt-3 font-mono text-[10px] text-lumen-400 hover:text-lumen-300 break-all focus-ring">
              {s.safeUrl} <ExternalIcon />
            </a>
          )}
        </article>
      ))}
    </div>
  );
}

function CurrentnessTab({ r }: { r: BuildingBlockRecord }) {
  return (
    <div className="space-y-6">
      <section>
        <H>estado de correnteza</H>
        <p className="font-display text-4xl font-medium text-mist-50">{CURRENTNESS_LABEL[r.currentness]}</p>
        <p className="text-sm text-mist-400 mt-2">ciclo de vida: <span className="text-mist-200">{LIFECYCLE_LABEL[r.lifecycle]}</span></p>
      </section>
      <section className="rounded-lg border border-seam bg-ink-950/60 p-5 space-y-2.5">
        {["IMPLEMENTED ≠ ACCEPTED", "ACCEPTED ≠ DEPLOYED", "DEPLOYED ≠ EXTERNAL_READBACK", "EXTERNAL_READBACK ≠ INDEXED", "PRESENCE ≠ CURRENTNESS"].map((rule) => (
          <p key={rule} className="font-mono text-[10px] tracking-[0.14em] text-mist-500 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-lumen-400/70" aria-hidden="true" />
            {rule}
          </p>
        ))}
      </section>
      <section>
        <H>visibilidade & publicabilidade</H>
        <p className="text-sm text-mist-400">
          visibilidade <span className="text-mist-200 font-mono text-xs">{r.visibility}</span> · publicabilidade{" "}
          <span className="text-mist-200 font-mono text-xs">{r.publicability}</span>
        </p>
      </section>
    </div>
  );
}

function EvidenceTab({ r }: { r: BuildingBlockRecord }) {
  return (
    <div className="space-y-6">
      <section>
        <H>escada epistêmica governante</H>
        <ol className="space-y-1.5" aria-label="Escada de evidência">
          {EVIDENCE_RUNGS.map((rung, i) => {
            const active = i === r.evidence.rung;
            const reached = i <= r.evidence.rung;
            return (
              <li key={rung} className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${active ? "bg-lumen-500/10 border border-lumen-500/40" : "border border-transparent"}`}>
                <span className={`font-mono text-[10px] w-5 ${reached ? "text-lumen-300" : "text-mist-600"}`}>{i}</span>
                <span className={`text-sm ${active ? "text-lumen-300 font-medium" : reached ? "text-mist-300" : "text-mist-600"}`}>{rung}</span>
                {active && <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.2em] text-lumen-400">estado atual</span>}
              </li>
            );
          })}
        </ol>
      </section>
      <section>
        <H>base declarada</H>
        <p className="text-sm text-mist-300 leading-relaxed">{r.evidence.basis}</p>
        <p className="font-mono text-[10px] text-mist-600 mt-3">
          CURRENT exige evidência ≥ {EVIDENCE_RUNGS[4]} com sha/observação — o modelo rebaixa automaticamente quem não sustenta.
        </p>
      </section>
    </div>
  );
}

function IdChips({ title, ids, empty }: { title: string; ids?: string[]; empty: string }) {
  const { openById } = useInspector();
  return (
    <section>
      <H>{title}</H>
      {ids && ids.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {ids.map((id) => {
            const rec = getRecord(id);
            if (!rec) return null;
            return (
              <button key={id} onClick={() => openById(id)} className="group px-3 py-1.5 rounded-md border border-seam hover:border-lumen-500/50 text-left transition-colors cursor-pointer focus-ring">
                <span className="block text-[12px] text-mist-200 group-hover:text-lumen-300 transition-colors">{rec.canonicalName}</span>
                <span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-mist-600">{LIFECYCLE_LABEL[rec.lifecycle]}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-mist-600 italic">{empty}</p>
      )}
    </section>
  );
}

function LineageTab({ r }: { r: BuildingBlockRecord }) {
  return (
    <div className="space-y-6">
      <IdChips title="predecessores" ids={r.predecessorIds} empty="Nenhum predecessor mapeado — linhagem em aberto." />
      <IdChips title="sucessores" ids={r.successorIds} empty="Nenhum sucessor declarado — o futuro deste bloco ainda está sendo escrito." />
      <IdChips title="relacionados" ids={r.relatedIds} empty="Sem relações registradas." />
      <p className="font-mono text-[10px] text-mist-600 leading-relaxed">
        RELATIONSHIP ≠ IDENTITY · CONVERGENCE ≠ INSTITUTIONAL_COLLAPSE — navegar a linhagem não funde as partes.
      </p>
    </div>
  );
}

function CapabilitiesTab({ r }: { r: BuildingBlockRecord }) {
  const { openById } = useInspector();
  const caps = r.capabilities ?? [];
  return (
    <div className="space-y-4">
      <H>o que pode fazer agora</H>
      {caps.length === 0 && <p className="text-sm text-mist-600 italic">Nenhuma capacidade instrumental registrada — presença e valor permanecem.</p>}
      {caps.map((c) => (
        <div key={c.id} className="rounded-lg border border-seam bg-ink-950/60 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-mist-200">{c.label}</p>
            <span className={`inline-block mt-2 px-2 py-0.5 rounded-full border font-mono text-[8px] uppercase tracking-[0.14em] ${
              c.availability === "now" ? "border-lumen-500/50 text-lumen-300" : c.availability === "conditional" ? "border-gild-400/50 text-gild-300" : "border-mist-600/60 text-mist-500"
            }`}>
              {c.availability === "now" ? "disponível agora" : c.availability === "conditional" ? "condicional" : "planejado"}
            </span>
          </div>
          {c.action?.kind === "open-external" && r.externalUrl && (
            <a href={r.externalUrl} target="_blank" rel={SAFE_REL} className="px-3 py-2 rounded-md border border-seam-strong font-mono text-[10px] uppercase tracking-[0.12em] text-mist-300 hover:text-lumen-300 hover:border-lumen-500/50 transition-colors focus-ring">
              abrir ↗
            </a>
          )}
          {c.action?.kind === "open-route" && c.action.target && (
            <a href={`#${c.action.target}`} className="px-3 py-2 rounded-md border border-lumen-500/50 bg-lumen-500/10 font-mono text-[10px] uppercase tracking-[0.12em] text-lumen-300 hover:bg-lumen-500/20 transition-colors focus-ring">
              entrar →
            </a>
          )}
          {c.action?.kind === "inspect" && c.action.target && (
            <button onClick={() => openById(c.action!.target!)} className="px-3 py-2 rounded-md border border-seam-strong font-mono text-[10px] uppercase tracking-[0.12em] text-mist-300 hover:text-lumen-300 transition-colors cursor-pointer focus-ring">
              inspecionar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function NextTab({ r }: { r: BuildingBlockRecord }) {
  return (
    <div className="space-y-6">
      <section>
        <H>incógnitas conhecidas</H>
        {r.unknowns && r.unknowns.length > 0 ? (
          <ul className="space-y-2.5">
            {r.unknowns.map((u) => (
              <li key={u} className="flex gap-3 text-sm text-mist-400 leading-relaxed">
                <span className="font-mono text-gild-400 mt-0.5" aria-hidden="true">?</span>
                {u}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-mist-600 italic">Nenhuma incógnita registrada.</p>
        )}
      </section>
      <section>
        <H>o que pode vir a ser</H>
        <p className="text-sm text-mist-300 leading-relaxed">
          {r.lifecycle === "PREDECESSOR" || r.lifecycle === "SUPERSEDED_BUT_RETAINED"
            ? "Candidato natural a colheita: padrões, dados e desenho preservados aqui podem alimentar as frentes correntes sem reescrita."
            : r.lifecycle === "RESEARCH" || r.lifecycle === "PROPOSED_NOT_CONFIGURED"
              ? "Candidato a protótipo assim que houver lastro de verificação — a retenção com rótulo mantém o caminho aberto."
              : "Candidato a readback externo e, com verificação independente, a vigência plena dentro do First Cycle."}
        </p>
      </section>
      <section className="rounded-lg border border-lumen-500/30 bg-lumen-500/5 p-5">
        <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-lumen-400 mb-2">regra de leitura</p>
        <p className="text-[13px] text-mist-300 leading-relaxed">
          HISTORICAL ≠ OBSOLETE · HELD ≠ REJECTED · PROTOTYPE ≠ PRODUCTION. Este bloco segue disponível para inspeção,
          citação e colheita governada.
        </p>
      </section>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 12" className="w-4 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M1 6h16M12 1.5 17 6l-5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 14 14" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M5 2H2v10h10V9M8 2h4v4M12 2 6.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
