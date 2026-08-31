/* ------------------------------------------------------------------ */
/*  Triage Workbench — modelo + adaptador de fila                      */
/*  A camada de triagem NUNCA sobrescreve a fonte bruta e NUNCA muta   */
/*  o Registry vivo: produz apenas CANDIDATOS explícitos.              */
/* ------------------------------------------------------------------ */

import { sanitizeRecord, type BuildingBlockRecord } from "../registry/model";
import { publicSafeSnapshot } from "../registry/diff";
import { FRAGMENT_KEY, LENS_FOCUS_KEY, PREFILL_KEY } from "./intakeModel";
import { isPublicSafe, maskUnlessPublic, type LocalDrop, type Sensitivity } from "./treasureModel";

/* ---------------- vocabulários secundários (interpretação, não cânone) ---------------- */

export const TENTATIVE_TAGS = [
  "FACT_OR_EXTERNAL_CLAIM",
  "PERSONAL_OBSERVATION",
  "HYPOTHESIS",
  "PROPOSAL",
  "DESIGN_IDEA",
  "RESEARCH_LEAD",
  "DECISION_OR_ORIENTATION",
  "QUESTION",
  "CORRECTION",
  "RELATIONSHIP_OR_CONTACT_SIGNAL",
  "PROJECT_OPPORTUNITY",
  "OTHER",
] as const;
export type TentativeTag = (typeof TENTATIVE_TAGS)[number];

export const THEMATIC_POINTERS = [
  "SOCIOBIOECONOMIA",
  "ECONOMIAS_REGENERATIVAS",
  "P&D_PROTOTIPOS",
  "PRODUTORES_TERRITORIOS",
  "EVIDENCIAS_FONTES",
  "AUTORIA_CONTRIBUICAO",
  "CONTRADICAO_QUESTAO_ABERTA",
] as const;
export type ThematicPointer = (typeof THEMATIC_POINTERS)[number];

export const UNCLASSIFIED_VALUES = ["UNCLASSIFIED", "UNKNOWN", "NEEDS_CONTEXT", "NEEDS_SOURCE_CHECK"] as const;
export type UnclassifiedValue = (typeof UNCLASSIFIED_VALUES)[number];

export const TRIAGE_STATUSES = ["QUARANTINED", "IN_TRIAGE", "TRIAGED", "REJECTED"] as const;
export type TriageStatus = (typeof TRIAGE_STATUSES)[number];

export const TRIAGE_STATUS_LABEL: Record<TriageStatus, string> = {
  QUARANTINED: "em quarentena",
  IN_TRIAGE: "em triagem",
  TRIAGED: "triado",
  REJECTED: "rejeitado",
};

/* ---------------- camadas ---------------- */

export interface TriageLayer {
  tentativeTags: TentativeTag[];
  thematicPointers: ThematicPointer[];
  destinations: string[]; /* ids de blocos do registry e/ou valores UNCLASSIFIED — múltiplos */
  questions: string[]; /* perguntas sem obrigação de resposta */
  note?: string;
}

export const emptyTriageLayer = (): TriageLayer => ({ tentativeTags: [], thematicPointers: [], destinations: [], questions: [], note: "" });

export interface TriageItem {
  id: string;
  /** camada 1 — fonte bruta: imutável pela triagem */
  rawContent?: string;
  externalUri?: string;
  sourceType: string;
  contentKind: string;
  sourceRef?: string;
  provenanceRefs: string[];
  language?: string;
  sensitivity: Sensitivity;
  createdAt: string;
  /** marcação de preservação/revisão — nunca registro AIPFIT */
  potentialCreativeContribution: boolean;
  /** camada 2 — interpretação secundária */
  status: TriageStatus;
  triage: TriageLayer;
  /** procedência da exibição */
  origin: "local-drop" | "representative-demo";
}

export function fromLocalDrop(d: LocalDrop): TriageItem {
  return {
    id: `ti-${d.key}`,
    rawContent: d.payload.raw_content,
    externalUri: d.payload.external_uri,
    sourceType: d.payload.source_type,
    contentKind: d.payload.content_kind,
    sourceRef: d.payload.source_ref,
    provenanceRefs: d.payload.provenance_refs ?? [],
    language: d.payload.language,
    sensitivity: d.payload.sensitivity,
    createdAt: d.createdAt,
    potentialCreativeContribution: d.payload.potential_creative_contribution,
    status: "QUARANTINED",
    triage: emptyTriageLayer(),
    origin: "local-drop",
  };
}

/* ---------------- itens representativos (demo rotulado, nunca fingido de backend) ---------------- */

const rep = (partial: Partial<TriageItem> & { id: string }): TriageItem => {
  const base: TriageItem = {
    id: partial.id,
    sourceType: "MANUAL",
    contentKind: "TEXT",
    provenanceRefs: [],
    language: "pt-BR",
    sensitivity: "PUBLIC_SAFE",
    createdAt: "2026-08-30",
    potentialCreativeContribution: false,
    status: "QUARANTINED",
    triage: emptyTriageLayer(),
    origin: "representative-demo",
  };
  return { ...base, ...partial };
};

/**
 * SYNTHETIC_DEMO_INPUT (BLOCKER 3) — itens 100% sintéticos e anônimos.
 * Nenhuma pessoa, fonte, canal ou evento real é representado. DEMO != SOURCE · DEMO != EVIDENCE.
 */
export const REPRESENTATIVE_ITEMS: TriageItem[] = [
  rep({
    id: "rep-abiu",
    rawContent: "Abiu",
    sourceType: "MANUAL",
    contentKind: "TEXT",
    sourceRef: "SYNTHETIC_DEMO_INPUT · anonymous human collaboration pattern",
    provenanceRefs: ["SYNTHETIC_DEMO_INPUT"],
    status: "IN_TRIAGE",
    triage: { ...emptyTriageLayer(), tentativeTags: ["RESEARCH_LEAD"], thematicPointers: ["SOCIOBIOECONOMIA"], questions: ["Trata-se de fruta, produto ou ponto de entrada de cadeia produtiva?"] },
  }),
  rep({
    id: "rep-frutas",
    rawContent: "11 frutas que o mercado de cosméticos compra pra extrair óleo",
    sourceType: "MANUAL",
    contentKind: "OBSERVATION",
    sourceRef: "SYNTHETIC_DEMO_INPUT · afirmação de mercado simulada",
    provenanceRefs: ["SYNTHETIC_DEMO_INPUT"],
    potentialCreativeContribution: true,
    triage: { ...emptyTriageLayer(), tentativeTags: ["FACT_OR_EXTERNAL_CLAIM", "RESEARCH_LEAD"], thematicPointers: ["ECONOMIAS_REGENERATIVAS", "PRODUTORES_TERRITORIOS"], questions: ["De onde vem essa afirmação de mercado?", "Há contribuição criativa atribuível aqui?"] },
  }),
  rep({
    id: "rep-link",
    rawContent: undefined,
    externalUri: "https://example.org/estudo-poluinizacao-comunitaria",
    sourceType: "WEB",
    contentKind: "LINK",
    sourceRef: "SYNTHETIC_DEMO_INPUT · link de demonstração",
    provenanceRefs: ["SYNTHETIC_DEMO_INPUT"],
    sensitivity: "PUBLIC_SAFE",
    triage: { ...emptyTriageLayer(), tentativeTags: ["FACT_OR_EXTERNAL_CLAIM"], thematicPointers: ["EVIDENCIAS_FONTES"], destinations: ["NEEDS_SOURCE_CHECK"] },
  }),
  rep({
    id: "rep-sensivel",
    rawContent: "[conteúdo sensível de demonstração — não reproduzir]",
    sourceType: "MANUAL",
    contentKind: "TEXT",
    sensitivity: "SENSITIVE_PRIVATE",
    sourceRef: "SYNTHETIC_DEMO_INPUT · item sensível simulado",
    provenanceRefs: ["SYNTHETIC_DEMO_INPUT"],
    triage: { ...emptyTriageLayer(), tentativeTags: ["RELATIONSHIP_OR_CONTACT_SIGNAL"], thematicPointers: ["PRODUTORES_TERRITORIOS"], questions: ["Quem pode acessar este contexto?"] },
  }),
];

/* ---------------- adaptador de fila (interface isolada p/ backend real) ---------------- */

export interface TriageQueueAdapter {
  readonly kind: string;
  readonly isBackendLive: boolean;
  list(): TriageItem[];
  setStatus(id: string, s: TriageStatus): TriageItem[];
  setLayer(id: string, layer: TriageLayer): TriageItem[];
}

const STORE_KEY = "hui.triage.local.v1";

/**
 * REPRESENTATIVE DEMO — o gateway musa2-node-gateway v3 ainda não expõe
 * operações de listagem/atualização da fila de quarentena. Este adaptador
 * mantém a fila localmente (drops locais + itens sintéticos rotulados)
 * atrás da interface TriageQueueAdapter, para que o backend real possa
 * substituí-lo sem reescrever a UI.
 */
export class LocalTriageAdapter implements TriageQueueAdapter {
  readonly kind = "representative-demo-local";
  readonly isBackendLive = false;
  private items: TriageItem[];

  constructor(localDrops: LocalDrop[]) {
    const saved = this.load();
    if (saved) {
      this.items = saved;
    } else {
      this.items = [...localDrops.filter((d) => d.status !== "SUBMISSION_PENDING").map(fromLocalDrop), ...REPRESENTATIVE_ITEMS.map((r) => ({ ...r, triage: { ...r.triage } }))];
    }
    /* novas capturas locais entram na fila sem duplicar */
    for (const d of localDrops) {
      if (d.status === "SUBMISSION_PENDING") continue;
      if (!this.items.some((i) => i.id === `ti-${d.key}`)) this.items.unshift(fromLocalDrop(d));
    }
    this.persist();
  }

  private load(): TriageItem[] | null {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as TriageItem[]) : null;
    } catch {
      return null;
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.items));
    } catch {
      /* memória apenas */
    }
  }

  list(): TriageItem[] {
    return this.items.map((i) => ({ ...i, triage: { ...i.triage } }));
  }

  /** Muda SOMENTE a camada secundária — a fonte bruta permanece intocada. */
  setStatus(id: string, s: TriageStatus): TriageItem[] {
    this.items = this.items.map((i) => (i.id === id ? { ...i, status: s } : i));
    this.persist();
    return this.list();
  }

  setLayer(id: string, layer: TriageLayer): TriageItem[] {
    this.items = this.items.map((i) => (i.id === id ? { ...i, triage: { ...layer } } : i));
    this.persist();
    return this.list();
  }
}

/* ---------------- candidato estruturado (nunca adoção) ---------------- */

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export function isRepresentativeDemo(item: TriageItem): boolean {
  return item.origin === "representative-demo";
}

/** Gate de export (BLOCKER 4): item representativo NUNCA exporta evidência/candidato-evidência. */
export function canExportCandidate(item: TriageItem): { ok: boolean; reason: string } {
  if (isRepresentativeDemo(item)) {
    return { ok: false, reason: "SYNTHETIC_DEMO_NON_EVIDENCE — item representativo não exporta evidência nem candidato-evidência. DEMO != SOURCE · DEMO != EVIDENCE. Inspeção apenas como objeto de demonstração." };
  }
  return { ok: true, reason: "" };
}

/**
 * Constrói um CANDIDATO — objeto explícito de registry, rotulado como tal.
 * Privacidade: nada não público-seguro vira externalUrl/descrição/âncora.
 * Representativo → objeto sintético de demonstração, NUNCA historical-record/primary (BLOCKER 3/4).
 */
export function buildCandidateRecord(item: TriageItem): BuildingBlockRecord {
  const pub = isPublicSafe(item.sensitivity);
  const demo = isRepresentativeDemo(item);
  const raw = item.rawContent?.trim() ?? "";
  const title = demo
    ? `Demo sintético · ${item.id}`
    : pub && raw.length > 0
      ? (raw.length > 64 ? `${raw.slice(0, 61)}…` : raw)
      : `Captura triada · ${item.id}`;
  const safePointers = item.triage.thematicPointers.length > 0 ? item.triage.thematicPointers.join(", ") : "sem ponteiros";

  return sanitizeRecord({
    id: `${demo ? "demo" : "cand"}-${slug(title) || item.id}-${item.id.slice(-4)}`,
    canonicalName: title,
    kind: "experiment",
    family: "Registry",
    description: demo
      ? `SYNTHETIC_DEMO_NON_EVIDENCE — objeto de demonstração sintético e anônimo (padrão de co-criação humana · DEMO). DEMO != SOURCE · DEMO != EVIDENCE. Não é evidência, não é fonte, não exporta.`
      : pub
        ? `Candidato oriundo de Treasure Drop triado. Bruto: ${raw || item.externalUri || "link preservado"}. Interpretação secundária: ${safePointers}. CANDIDATE ≠ CANON — nenhuma adoção ocorreu.`
        : `Candidato oriundo de Treasure Drop triado. ${maskUnlessPublic(raw, item.sensitivity)} Interpretação secundária: ${safePointers}. CANDIDATE ≠ CANON — nenhuma adoção ocorreu.`,
    sourceRefs: [
      demo
        ? {
            id: `demo-src-${item.id}`,
            /* explicitamente NÃO-evidência: nunca historical-record, nunca primary (BLOCKER 3) */
            sourceClass: "local-source",
            label: "SYNTHETIC_DEMO_INPUT · anonymous human collaboration pattern",
            role: "synthesis",
            access: "public",
            observedAt: item.createdAt,
            whyWeBelieveThis: "Objeto sintético de demonstração — deliberadamente sem valor de evidência (DEMO != EVIDENCE).",
          }
        : {
            id: `cand-src-${item.id}`,
            sourceClass: "local-source",
            label: pub && item.externalUri ? item.externalUri : `Treasure Drop · ${item.sourceType} · ${item.contentKind}`,
            role: "primary",
            access: pub ? "public" : "restricted",
            safeUrl: pub && item.externalUri && /^https?:\/\//i.test(item.externalUri) ? item.externalUri : undefined,
            observedAt: item.createdAt,
            whyWeBelieveThis: `Preservado como REPORTED/QUARANTINED; triagem secundária registrada sem alterar a fonte bruta.`,
          },
    ],
    lifecycle: "DRAFT_PROPOSAL",
    currentness: "unknown",
    evidence: { rung: 0, basis: demo ? "SYNTHETIC_DEMO_NON_EVIDENCE — sem valor de evidência por desenho." : "REPORTED via Treasure Drop — sem verificação; base da crença documentada na triagem." },
    visibility: demo ? "public" : pub ? "public" : "metadata-only",
    publicability: demo ? "public-safe" : pub ? "public-safe" : "metadata-only",
    externalUrl: !demo && pub && item.externalUri && /^https?:\/\//i.test(item.externalUri) ? item.externalUri : undefined,
    unknowns: demo
      ? ["SYNTHETIC_DEMO_NON_EVIDENCE", "DEMO != SOURCE", "DEMO != EVIDENCE"]
      : [
          ...(item.triage.questions.length > 0 ? item.triage.questions : ["Perguntas de triagem não registradas"]),
          "AIPFIT: REGISTRATION_NOT_REQUESTED (padrão)",
        ],
    positiveNote: demo
      ? "Padrão de co-criação humana demonstrado de forma anônima e sintética — útil para exercitar a triagem sem expor pessoa, fonte ou canal real."
      : `Preserva voz, cronologia e proveniência da descoberta humana — material fértil para o Snapshot Diff e o Intake Studio quando a estrutura fizer sentido.`,
  });
}

/* ---------------- handoffs ---------------- */

export function handoffCandidateToDiff(item: TriageItem) {
  if (!canExportCandidate(item).ok) return; /* representativo nunca exporta evidência (BLOCKER 4) */
  const rec = buildCandidateRecord(item);
  const frag = publicSafeSnapshot([rec], { source: "triage-workbench · candidato", generatedAt: new Date().toISOString().slice(0, 10) });
  try {
    sessionStorage.setItem(FRAGMENT_KEY, JSON.stringify(frag));
    sessionStorage.setItem(LENS_FOCUS_KEY, "snapshot");
  } catch {
    /* sem storage */
  }
  window.location.hash = "#/registry";
}

export function handoffCandidateToIntake(item: TriageItem) {
  if (!canExportCandidate(item).ok) return; /* representativo nunca exporta candidato-evidência (BLOCKER 4) */
  const rec = buildCandidateRecord(item);
  const pub = isPublicSafe(item.sensitivity);
  try {
    sessionStorage.setItem(
      PREFILL_KEY,
      JSON.stringify({
        canonicalName: rec.canonicalName,
        description: rec.description,
        family: "Registry",
        kind: "experiment",
        lifecycle: "DRAFT_PROPOSAL",
        currentness: "unknown",
        rung: 0,
        basis: rec.evidence.basis,
        positiveNote: rec.positiveNote,
        sourceLabel: pub && item.externalUri ? `Treasure Drop · ${item.externalUri}` : `Treasure Drop · ${item.sourceType} · ${item.contentKind}`,
        whyWeBelieve: rec.sourceRefs[0]?.whyWeBelieveThis ?? "REPORTED via Treasure Drop.",
        unknowns: rec.unknowns ?? [],
      }),
    );
  } catch {
    /* sem storage */
  }
  window.location.hash = "#/intake";
}
