/* ------------------------------------------------------------------ */
/*  Ciclo Vivo · Readback Console — observações externas sobre itens   */
/*  reais. READBACK ≠ ACCEPTANCE. Exporta SOMENTE EVIDENCE_CANDIDATE.  */
/*                                                                     */
/*  A máquina NÃO é linear: CONTRADICTED e UNRESOLVED são ramos/estados */
/*  válidos, não falhas após VERIFIED. Nenhuma promoção silenciosa a    */
/*  VERIFIED sem evidência + corroboração + interpretação.             */
/* ------------------------------------------------------------------ */

import { sanitizeRecord, type BuildingBlockRecord } from "../registry/model";
import { publicSafeSnapshot } from "../registry/diff";
import { FRAGMENT_KEY, LENS_FOCUS_KEY } from "../apps/intakeModel";

export const READBACK_STATES = ["OBSERVED", "REPORTED", "CORROBORATED", "VERIFIED", "CONTRADICTED", "UNRESOLVED"] as const;
export type ReadbackState = (typeof READBACK_STATES)[number];

export const READBACK_LABEL: Record<ReadbackState, string> = {
  OBSERVED: "observado",
  REPORTED: "reportado",
  CORROBORATED: "corroborado",
  VERIFIED: "verificado",
  CONTRADICTED: "contradito",
  UNRESOLVED: "não resolvido",
};

export const READBACK_TONE: Record<ReadbackState, string> = {
  OBSERVED: "border-mist-500/50 text-mist-300",
  REPORTED: "border-lumen-500/45 text-lumen-300",
  CORROBORATED: "border-lumen-500/60 text-lumen-300",
  VERIFIED: "border-gild-400/60 text-gild-300",
  CONTRADICTED: "border-ember-400/60 text-ember-300",
  UNRESOLVED: "border-ember-300/40 text-ember-300/80",
};

/** Máquina de estados ramificada — cada estado lista seus destinos legítimos. */
export const TRANSITIONS: Record<ReadbackState, ReadbackState[]> = {
  OBSERVED: ["REPORTED", "CONTRADICTED", "UNRESOLVED"],
  REPORTED: ["CORROBORATED", "CONTRADICTED", "UNRESOLVED"],
  CORROBORATED: ["VERIFIED", "CONTRADICTED", "UNRESOLVED"],
  VERIFIED: ["CONTRADICTED", "UNRESOLVED"],
  CONTRADICTED: ["REPORTED", "UNRESOLVED"],
  UNRESOLVED: ["REPORTED", "OBSERVED"],
};

export interface Corroboration {
  actor: string;
  sourceRef: string;
  evidencePointer: string;
  observedAt: string;
}

export interface ReadbackRecord {
  id: string;
  targetId: string;
  targetLabel: string;
  observer: string;
  observedAt: string;
  sourceRef?: string;
  sourceIsPublic: boolean;
  rawObservation: string;
  evidencePointers: string[];
  interpretation: string;
  /** Corroborações estruturadas — obrigatórias p/ CORROBORATED e VERIFIED. */
  corroborations?: Corroboration[];
  state: ReadbackState;
  contradictionFlag: boolean;
  notes?: string;
  representative?: boolean;
  createdAt: string;
}

/* ---------------- corroboração estruturada (BLOCKER 1) ---------------- */

/**
 * Corroboração válida = ator + fonte + ponteiro de evidência presentes.
 * Quando a fonte original é conhecida, a corroboração NÃO pode repetir o mesmo
 * localizador de fonte — corroborar exige uma fonte distinta.
 */
export function validCorroborations(r: ReadbackRecord): Corroboration[] {
  const list = r.corroborations ?? [];
  const knownSource = (r.sourceRef ?? "").trim();
  return list.filter((c) => {
    if (!c || typeof c !== "object") return false;
    const actor = (c.actor ?? "").trim();
    const src = (c.sourceRef ?? "").trim();
    const ev = (c.evidencePointer ?? "").trim();
    if (actor.length === 0 || src.length === 0 || ev.length === 0) return false;
    if (knownSource.length > 0 && src === knownSource) return false; /* repete a fonte — não corrobora */
    return true;
  });
}

const STATE_INDEX: Record<ReadbackState, number> = { OBSERVED: 0, REPORTED: 1, CORROBORATED: 2, VERIFIED: 3, CONTRADICTED: -1, UNRESOLVED: -1 };
const MATURITY_TO_STATE: Record<number, ReadbackState> = { 0: "OBSERVED", 1: "REPORTED", 2: "CORROBORATED", 3: "VERIFIED" };

/** Maturidade máxima suportada pela evidência: 0=OBSERVED 1=REPORTED 2=CORROBORATED 3=VERIFIED. */
export function evidenceMaturity(r: ReadbackRecord): number {
  const hasInitial = r.evidencePointers.length > 0;
  const hasCorrob = validCorroborations(r).length > 0;
  const hasInterp = r.interpretation.trim().length >= 10;
  if (hasInitial && hasCorrob && hasInterp) return 3;
  if (hasInitial && hasCorrob) return 2;
  return 1;
}

/* ---------------- guarda de transição: nenhuma promoção silenciosa ---------------- */

export function canTransition(r: ReadbackRecord, to: ReadbackState): { ok: boolean; reason: string } {
  const allowed = TRANSITIONS[r.state] ?? [];
  if (!allowed.includes(to)) {
    return {
      ok: false,
      reason: `Transição ${r.state} → ${to} fora da máquina. Destinos legítimos a partir de ${r.state}: ${allowed.map((s) => READBACK_LABEL[s]).join(", ")}.`,
    };
  }
  /* Registro sintético/representativo NUNCA alcança CORROBORATED ou VERIFIED. */
  if (r.representative && (to === "CORROBORATED" || to === "VERIFIED")) {
    return { ok: false, reason: "SYNTHETIC_DEMO_NON_EVIDENCE — registro representativo nunca é corroborado nem verificado (DEMO != EVIDENCE)." };
  }
  if (to === "CORROBORATED") {
    if (r.evidencePointers.length === 0) {
      return { ok: false, reason: "CORROBORATED exige ao menos um ponteiro de evidência inicial." };
    }
    if (validCorroborations(r).length === 0) {
      return { ok: false, reason: "CORROBORATED exige ao menos uma corroboração válida (ator + fonte distinta + ponteiro de evidência)." };
    }
  }
  if (to === "VERIFIED") {
    if (r.state !== "CORROBORATED") {
      return { ok: false, reason: "VERIFIED exige corroboração prévia (somente a partir de CORROBORATED)." };
    }
    if (r.evidencePointers.length === 0) {
      return { ok: false, reason: "VERIFIED exige ao menos um ponteiro de evidência inicial." };
    }
    if (validCorroborations(r).length === 0) {
      return { ok: false, reason: "VERIFIED exige corroboração válida (ator + fonte distinta + ponteiro de evidência)." };
    }
    if (r.interpretation.trim().length < 10) {
      return { ok: false, reason: "VERIFIED exige interpretação substantiva registrada (mínimo 10 caracteres)." };
    }
  }
  return { ok: true, reason: "" };
}

/* ---------------- sementes: observações reais do ambiente + DEMO rotulado ---------------- */

export const SEED_READBACKS: ReadbackRecord[] = [
  {
    id: "rb-suite79",
    targetId: "tool-treasure-drop",
    targetLabel: "Captura Rápida / Treasure Drop",
    observer: "Suite Vitest · execução em sandbox (verifier7)",
    observedAt: "2026-08-31",
    sourceRef: "verifier7/vitest-run.log",
    sourceIsPublic: false,
    rawObservation: "79/79 testes passaram, incluindo guardas estáticas do caminho de gateway, fail-closed sem sessão, idempotência e proteções de privacidade.",
    evidencePointers: ["verifier7/vitest-run.log", "Test Files 6 passed (6) · Tests 79 passed (79)"],
    interpretation: "Evidência de teste executada em sandbox. TESTED ≠ ASSURED — assurance independente permanece pendente.",
    state: "OBSERVED",
    contradictionFlag: false,
    notes: "Observação real deste ambiente de trabalho — não é dado representativo.",
    createdAt: "2026-08-31",
  },
  {
    id: "rb-reclass-portal",
    targetId: "prototype-interim-frontpage",
    targetLabel: "huihho interim frontpage — protótipo funcional",
    observer: "Releitura do portal público · tranche de correção de claims",
    observedAt: "2026-08-30",
    sourceIsPublic: true,
    rawObservation: "O rótulo “canônico · live” excedia a evidência disponível; reclassificado para “protótipo interim · readback externo pendente”.",
    evidencePointers: ["src/chrome.tsx — diff da tranche de correção"],
    interpretation: "Contradição entre rótulo e evidência resolvida por reclassificação documentada, sem apagar histórico.",
    state: "CONTRADICTED",
    contradictionFlag: true,
    createdAt: "2026-08-30",
  },
  {
    id: "rb-demo-castanhas",
    targetId: "iceberg-root",
    targetLabel: "ICEBERG",
    observer: "Padrão de co-criação humana · DEMO",
    observedAt: "2026-08-31",
    sourceIsPublic: false,
    rawObservation: "[REPRESENTATIVO] Observação de mercado sobre castanhas — origem e autoria a verificar.",
    evidencePointers: [],
    interpretation: "Claim externo ou observação pessoal? Atribuição mantida não resolvida por desenho.",
    state: "UNRESOLVED",
    contradictionFlag: false,
    representative: true,
    notes: "SYNTHETIC_DEMO_INPUT — dado sintético e anônimo; nenhuma pessoa, fonte ou canal real representado; nenhuma fala inventada.",
    createdAt: "2026-08-31",
  },
];

/* ---------------- persistência local ---------------- */

const STORE_KEY = "hui.readback.local.v1";

/**
 * Fail-closed (BLOCKER 2): um registro persistido alegando CORROBORATED/VERIFIED
 * sem a evidência exigida é rebaixado ao estado verdadeiro mais alto suportado.
 * Nunca preserva VERIFIED/CORROBORATED forjado e jamais promove um registro.
 */
export function downgradeToTruthful(r: ReadbackRecord): ReadbackRecord {
  const base: ReadbackRecord = {
    ...r,
    evidencePointers: Array.isArray(r.evidencePointers) ? r.evidencePointers : [],
    corroborations: Array.isArray(r.corroborations) ? r.corroborations : [],
    interpretation: typeof r.interpretation === "string" ? r.interpretation : "",
  };
  const claimed = STATE_INDEX[base.state];
  /* Estados-ramo e estados sem alegação de maturidade são preservados. */
  if (claimed < 2) return base;
  let supported = evidenceMaturity(base);
  if (base.representative) supported = Math.min(supported, 1); /* representativo nunca ≥ CORROBORATED */
  const target = Math.min(claimed, supported); /* só rebaixa, nunca promove */
  if (target === claimed) return base;
  const truthful = MATURITY_TO_STATE[target];
  return {
    ...base,
    state: truthful,
    notes: `${base.notes ? base.notes + " · " : ""}Rebaixado de ${base.state} para ${truthful} na carga (fail-closed): evidência/corroboração insuficiente.`,
  };
}

export function loadReadbacks(): ReadbackRecord[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return (parsed as ReadbackRecord[]).map(downgradeToTruthful);
    }
  } catch {
    /* fallback para sementes */
  }
  return SEED_READBACKS.map((r) => ({ ...r, evidencePointers: [...r.evidencePointers] }));
}

export function saveReadbacks(list: ReadbackRecord[]): ReadbackRecord[] {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch {
    /* memória apenas */
  }
  return list;
}

export function newReadbackId(): string {
  return `rb-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function readbacksForTarget(list: ReadbackRecord[], targetId: string): ReadbackRecord[] {
  return list.filter((r) => r.targetId === targetId);
}

/* ---------------- export: SOMENTE EVIDENCE_CANDIDATE ---------------- */

export interface EvidenceFragment {
  schema: string;
  source: string;
  generatedAt: string;
  records: BuildingBlockRecord[];
}

/** Gate de export (BLOCKER 4): registro representativo NUNCA exporta evidência. */
export function canExportEvidence(rb: ReadbackRecord): { ok: boolean; reason: string } {
  if (rb.representative) {
    return { ok: false, reason: "SYNTHETIC_DEMO_NON_EVIDENCE — registro representativo não exporta evidência. DEMO != SOURCE · DEMO != EVIDENCE. Inspeção apenas como objeto de demonstração." };
  }
  return { ok: true, reason: "" };
}

export function exportEvidenceCandidate(rb: ReadbackRecord): EvidenceFragment {
  const gate = canExportEvidence(rb);
  if (!gate.ok) throw new Error(gate.reason);
  const safeUrl = rb.sourceIsPublic && rb.sourceRef && /^https?:\/\//i.test(rb.sourceRef) ? rb.sourceRef : undefined;
  const rec = sanitizeRecord({
    id: `evcand-${rb.id}`,
    canonicalName: `Candidato de evidência · ${rb.targetLabel}`,
    kind: "experiment",
    family: "Building",
    description: `EVIDENCE_CANDIDATE oriundo de readback (${READBACK_LABEL[rb.state]}). Alvo: ${rb.targetLabel}. Observação bruta: ${rb.rawObservation.slice(0, 200)}. READBACK ≠ ACCEPTANCE — nenhum aceite ocorreu.`,
    sourceRefs: [
      {
        id: `evcand-src-${rb.id}`,
        /* nunca historical-record: apenas readback real (não-demo) exporta, como fonte local */
        sourceClass: "local-source",
        label: rb.sourceIsPublic && rb.sourceRef ? rb.sourceRef : `readback · ${rb.observer}`,
        role: "primary",
        access: rb.sourceIsPublic ? "public" : "restricted",
        safeUrl,
        observedAt: rb.observedAt,
        whyWeBelieveThis: rb.interpretation.trim() || "Interpretação pendente — evidência insuficiente.",
      },
    ],
    lifecycle: "DRAFT_PROPOSAL",
    currentness: "unknown",
    evidence: { rung: 0, basis: `Estado de readback: ${rb.state}. Não altera o degrau do alvo — maturação exige fluxo governado (Snapshot Diff → Intake → revisão).` },
    visibility: "metadata-only",
    publicability: "metadata-only",
    unknowns: [
      ...(rb.contradictionFlag ? ["Contradição sinalizada — requer revisão humana"] : []),
      "READBACK ≠ ACCEPTANCE",
      "AIPFIT: REGISTRATION_NOT_REQUESTED",
    ],
    positiveNote: "Observação externa preservada com alvo, observador, cronologia e ponteiros — insumo vivo para correção e sucessores governados.",
  });
  return publicSafeSnapshot([rec], { source: "readback-console · EVIDENCE_CANDIDATE", generatedAt: new Date().toISOString().slice(0, 10) });
}

export function handoffEvidenceToDiff(rb: ReadbackRecord) {
  if (!canExportEvidence(rb).ok) return; /* representativo nunca exporta */
  try {
    sessionStorage.setItem(FRAGMENT_KEY, JSON.stringify(exportEvidenceCandidate(rb)));
    sessionStorage.setItem(LENS_FOCUS_KEY, "snapshot");
  } catch {
    /* sem storage */
  }
  window.location.hash = "#/registry";
}
