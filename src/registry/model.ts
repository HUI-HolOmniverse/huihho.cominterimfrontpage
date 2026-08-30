/* ------------------------------------------------------------------ */
/*  HUI Building-Block Registry · modelo de dados compartilhado        */
/*  P0 — vocabulários controlados + registro único de blocos           */
/* ------------------------------------------------------------------ */

export const LIFECYCLE = [
  "DRAFT_PROPOSAL",
  "RESEARCH",
  "PROTOTYPE",
  "IMPLEMENTED_CANDIDATE",
  "HELD",
  "ACCEPTED_NOT_DEPLOYED",
  "DEPLOYED_READBACK_PENDING",
  "DEPLOYED_READBACK_VERIFIED",
  "SUPERSEDED_BUT_RETAINED",
  "PREDECESSOR",
  "PROPOSED_NOT_CONFIGURED",
  "CURRENT",
] as const;
export type Lifecycle = (typeof LIFECYCLE)[number];

export const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  DRAFT_PROPOSAL: "proposta",
  RESEARCH: "pesquisa",
  PROTOTYPE: "protótipo",
  IMPLEMENTED_CANDIDATE: "candidato implementado",
  HELD: "retido",
  ACCEPTED_NOT_DEPLOYED: "aceito · não deployado",
  DEPLOYED_READBACK_PENDING: "deploy · readback pendente",
  DEPLOYED_READBACK_VERIFIED: "deploy · readback verificado",
  SUPERSEDED_BUT_RETAINED: "superado · retido",
  PREDECESSOR: "predecessor",
  PROPOSED_NOT_CONFIGURED: "proposto · não configurado",
  CURRENT: "corrente",
};

export const CURRENTNESS = [
  "current",
  "candidate",
  "binding-candidate",
  "prototype",
  "predecessor",
  "research",
  "held",
  "historical",
  "unknown",
] as const;
export type Currentness = (typeof CURRENTNESS)[number];

export const CURRENTNESS_LABEL: Record<Currentness, string> = {
  current: "corrente",
  candidate: "candidato",
  "binding-candidate": "binding-candidate",
  prototype: "protótipo",
  predecessor: "predecessor",
  research: "pesquisa",
  held: "retido",
  historical: "histórico",
  unknown: "desconhecido",
};

/** A escada epistêmica governante — não é redefinida pelo registry. */
export const EVIDENCE_RUNGS = [
  "visão",
  "desenho",
  "representação",
  "corroboração",
  "verificação",
  "aprovação",
  "vigência",
] as const;

export const SOURCE_CLASSES = [
  "github-public",
  "github-private",
  "lovable",
  "gamma",
  "portal-html",
  "founder-direction",
  "historical-record",
  "local-source",
] as const;
export type SourceClass = (typeof SOURCE_CLASSES)[number];

export const SOURCE_CLASS_LABEL: Record<SourceClass, string> = {
  "github-public": "GitHub · público",
  "github-private": "GitHub · privado",
  lovable: "Lovable · manifestação pública",
  gamma: "Gamma · apresentação pública",
  "portal-html": "portal-html · produção observada",
  "founder-direction": "direção fundadora",
  "historical-record": "registro histórico",
  "local-source": "source local (este repositório)",
};

export const ACCESS = ["public", "metadata-only", "restricted"] as const;
export type Access = (typeof ACCESS)[number];

export const PUBLICABILITY = ["live-public", "public-safe", "metadata-only", "restricted"] as const;
export type Publicability = (typeof PUBLICABILITY)[number];

export const VISIBILITY = ["public", "metadata-only", "restricted"] as const;
export type Visibility = (typeof VISIBILITY)[number];

export const KINDS = [
  "route",
  "root",
  "manifestation",
  "capability",
  "tool",
  "runtime",
  "concept",
  "predecessor",
  "experiment",
  "research",
  "framework",
  "participation",
] as const;
export type Kind = (typeof KINDS)[number];

export const FAMILIES = [
  "HUI",
  "ICEBERG",
  "HolOmniverse",
  "Holo-Logoi",
  "Arquitetura",
  "Participação",
  "Federadas",
  "Manifestações",
  "Registry",
] as const;
export type Family = (typeof FAMILIES)[number];

export interface SourceReference {
  id: string;
  sourceClass: SourceClass;
  label: string;
  role: "primary" | "derivative" | "synthesis" | "lineage" | "snapshot";
  access: Access;
  /** Somente quando access === "public". Nunca para material restrito. */
  safeUrl?: string;
  observedAt?: string;
  sha?: string;
  whyWeBelieveThis: string;
}

export interface CapabilityRecord {
  id: string;
  label: string;
  availability: "now" | "conditional" | "planned";
  note?: string;
  action?: {
    kind: "inspect" | "open-external" | "open-route" | "descend" | "filter-lens";
    target?: string;
  };
}

export interface BuildingBlockRecord {
  id: string;
  canonicalName: string;
  aliases?: string[];
  family: Family;
  kind: Kind;
  description: string;

  sourceRefs: SourceReference[];

  lifecycle: Lifecycle;
  currentness: Currentness;
  evidence: { rung: number; basis: string };
  visibility: Visibility;
  publicability: Publicability;

  route?: string;
  externalUrl?: string;

  predecessorIds?: string[];
  successorIds?: string[];
  relatedIds?: string[];

  capabilities?: CapabilityRecord[];
  unknowns?: string[];

  positiveNote: string;
}

/* ---------- regras do modelo ---------- */

/** CURRENT exige evidência ≥ verificação (rung 4) com lastro observável. */
export const MIN_RUNG_FOR_CURRENT = 4;

export function hasObservableBasis(rec: BuildingBlockRecord): boolean {
  return rec.sourceRefs.some((s) => Boolean(s.sha || s.observedAt));
}

export function canBeCurrent(rec: BuildingBlockRecord): boolean {
  return rec.evidence.rung >= MIN_RUNG_FOR_CURRENT && hasObservableBasis(rec);
}

/* ---------- sanitização fail-safe ---------- */

/**
 * Nunca fabrica estado: estados inválidos caem para o nível seguro mais
 * próximo; URLs nunca acompanham material restrito/metadata-only.
 */
export function sanitizeRecord(input: Partial<BuildingBlockRecord> & { id: string }): BuildingBlockRecord {
  const lifecycle = (LIFECYCLE as readonly string[]).includes(String(input.lifecycle))
    ? (input.lifecycle as Lifecycle)
    : "RESEARCH";

  const currentness = (CURRENTNESS as readonly string[]).includes(String(input.currentness))
    ? (input.currentness as Currentness)
    : "unknown";

  const rungRaw = Number(input.evidence?.rung);
  const rung = Number.isFinite(rungRaw) ? Math.min(Math.max(Math.floor(rungRaw), 0), EVIDENCE_RUNGS.length - 1) : 0;

  const sourceRefs = (input.sourceRefs ?? []).map((s) => ({
    ...s,
    sourceClass: (SOURCE_CLASSES as readonly string[]).includes(String(s.sourceClass))
      ? s.sourceClass
      : "historical-record",
    access: (ACCESS as readonly string[]).includes(String(s.access)) ? s.access : "restricted",
    safeUrl: s.access === "public" ? s.safeUrl : undefined,
  }));

  const rec: BuildingBlockRecord = {
    id: input.id,
    canonicalName: input.canonicalName ?? input.id,
    aliases: input.aliases,
    family: (FAMILIES as readonly string[]).includes(String(input.family)) ? (input.family as Family) : "Registry",
    kind: (KINDS as readonly string[]).includes(String(input.kind)) ? (input.kind as Kind) : "concept",
    description: input.description ?? "",
    sourceRefs,
    lifecycle,
    currentness,
    evidence: { rung, basis: input.evidence?.basis ?? "base não documentada" },
    visibility: (VISIBILITY as readonly string[]).includes(String(input.visibility))
      ? (input.visibility as Visibility)
      : "metadata-only",
    publicability: (PUBLICABILITY as readonly string[]).includes(String(input.publicability))
      ? (input.publicability as Publicability)
      : "metadata-only",
    route: input.route,
    externalUrl: input.externalUrl,
    predecessorIds: input.predecessorIds,
    successorIds: input.successorIds,
    relatedIds: input.relatedIds,
    capabilities: input.capabilities,
    unknowns: input.unknowns,
    positiveNote: input.positiveNote ?? "Valor de continuidade ainda não documentado — reter e reavaliar.",
  };

  /* CURRENT sem lastro exigido → desce um degrau, nunca fabrica vigência. */
  if (rec.lifecycle === "CURRENT" && !canBeCurrent(rec)) {
    rec.lifecycle = "DEPLOYED_READBACK_PENDING";
  }

  /* externalUrl só sobrevive com publicabilidade public-safe ou live-public. */
  if (rec.externalUrl && rec.publicability !== "public-safe" && rec.publicability !== "live-public") {
    rec.externalUrl = undefined;
  }

  return rec;
}

export function validateRegistry(records: BuildingBlockRecord[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    if (seen.has(r.id)) problems.push(`id duplicado: ${r.id}`);
    seen.add(r.id);
    if (!r.positiveNote.trim()) problems.push(`${r.id}: positiveNote vazio`);
    if (!(LIFECYCLE as readonly string[]).includes(r.lifecycle)) problems.push(`${r.id}: lifecycle inválido`);
    if (r.lifecycle === "CURRENT" && !canBeCurrent(r)) problems.push(`${r.id}: CURRENT sem evidência suficiente`);
    for (const s of r.sourceRefs) {
      if (s.access !== "public" && s.safeUrl) problems.push(`${r.id}/${s.id}: URL exposta em fonte não pública`);
    }
    if (r.externalUrl && r.publicability !== "public-safe" && r.publicability !== "live-public") {
      problems.push(`${r.id}: externalUrl sem publicabilidade adequada`);
    }
  }
  return problems;
}

export const SAFE_REL = "noopener noreferrer";
