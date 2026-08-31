/* ------------------------------------------------------------------ */
/*  Intake Studio · modelo puro (rascunhos, validação, handoff)        */
/*  RASCUNHO ≠ ADOÇÃO: nada aqui muta o registry vivo.                 */
/* ------------------------------------------------------------------ */

import {
  ACCESS,
  CURRENTNESS,
  FAMILIES,
  KINDS,
  LIFECYCLE,
  MIN_RUNG_FOR_CURRENT,
  EVIDENCE_RUNGS,
  SOURCE_CLASSES,
  sanitizeRecord,
  hasObservableBasis,
  type BuildingBlockRecord,
} from "../registry/model";

/* ---------------- tipos de rascunho ---------------- */

export interface SourceDraft {
  id: string;
  sourceClass: string;
  label: string;
  role: string;
  access: string;
  safeUrl: string;
  observedAt: string;
  sha: string;
  whyWeBelieveThis: string;
}

export interface CapDraft {
  id: string;
  label: string;
  availability: "now" | "conditional" | "planned";
}

export interface IntakeDraft {
  id: string;
  canonicalName: string;
  aliases: string[];
  kind: string;
  family: string;
  description: string;
  sourceRefs: SourceDraft[];
  lifecycle: string;
  currentness: string;
  rung: number;
  basis: string;
  predecessorIds: string[];
  successorIds: string[];
  capabilities: CapDraft[];
  unknowns: string[];
  positiveNote: string;
  updatedAt: string;
}

/* ---------------- ids determinísticos-ish ---------------- */

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "sem-nome";
}

let seq = 0;
export function newId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}${seq.toString(36)}`;
}

export function emptySource(): SourceDraft {
  return {
    id: newId("src"),
    sourceClass: "github-public",
    label: "",
    role: "primary",
    access: "public",
    safeUrl: "",
    observedAt: "",
    sha: "",
    whyWeBelieveThis: "",
  };
}

export function emptyDraft(): IntakeDraft {
  return {
    id: newId("intake"),
    canonicalName: "",
    aliases: [],
    kind: "experiment",
    family: "Registry",
    description: "",
    sourceRefs: [emptySource()],
    lifecycle: "RESEARCH",
    currentness: "research",
    rung: 1,
    basis: "",
    predecessorIds: [],
    successorIds: [],
    capabilities: [],
    unknowns: [],
    positiveNote: "",
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

/* ---------------- conversão (sempre via sanitizeRecord) ---------------- */

export function draftToRecord(d: IntakeDraft): BuildingBlockRecord {
  return sanitizeRecord({
    id: `intake-${slugify(d.canonicalName)}-${d.id.slice(-6)}`,
    canonicalName: d.canonicalName.trim(),
    aliases: d.aliases.map((a) => a.trim()).filter(Boolean),
    kind: d.kind as BuildingBlockRecord["kind"],
    family: d.family as BuildingBlockRecord["family"],
    description: d.description.trim(),
    sourceRefs: d.sourceRefs.map((s) => ({
      id: s.id,
      sourceClass: s.sourceClass as never,
      label: s.label.trim() || "fonte sem rótulo",
      role: s.role as never,
      access: s.access as never,
      safeUrl: s.access === "public" && s.safeUrl.trim() ? s.safeUrl.trim() : undefined,
      observedAt: s.observedAt || undefined,
      sha: s.sha.trim() || undefined,
      whyWeBelieveThis: s.whyWeBelieveThis.trim(),
    })),
    lifecycle: d.lifecycle as BuildingBlockRecord["lifecycle"],
    currentness: d.currentness as BuildingBlockRecord["currentness"],
    evidence: { rung: d.rung, basis: d.basis.trim() },
    predecessorIds: d.predecessorIds.length ? d.predecessorIds : undefined,
    successorIds: d.successorIds.length ? d.successorIds : undefined,
    capabilities: d.capabilities
      .filter((c) => c.label.trim())
      .map((c) => ({ id: c.id, label: c.label.trim(), availability: c.availability })),
    unknowns: d.unknowns.map((u) => u.trim()).filter(Boolean),
    positiveNote: d.positiveNote.trim(),
  });
}

/* ---------------- validação (cheks visíveis, nunca silenciosos) ---------------- */

export interface IntakeCheck {
  id: string;
  label: string;
  ok: boolean;
  severity: "block" | "warn";
  detail?: string;
}

const ROLES = ["primary", "derivative", "synthesis", "lineage", "snapshot"];
const HEX40 = /^[0-9a-f]{7,40}$/i;

export function validateDraft(d: IntakeDraft): IntakeCheck[] {
  const checks: IntakeCheck[] = [];
  const add = (id: string, label: string, ok: boolean, severity: "block" | "warn", detail?: string) =>
    checks.push({ id, label, ok, severity, detail });

  add("name", "Nome canônico (≥ 3 caracteres)", d.canonicalName.trim().length >= 3, "block");
  add("desc", "Descrição com corpo suficiente (≥ 20 caracteres)", d.description.trim().length >= 20, "block");
  add("kind", "Tipo no vocabulário controlado", (KINDS as readonly string[]).includes(d.kind), "block");
  add("family", "Família no vocabulário controlado", (FAMILIES as readonly string[]).includes(d.family), "block");

  add("src-min", "Ao menos uma referência de fonte", d.sourceRefs.length >= 1, "block");
  d.sourceRefs.forEach((s, i) => {
    const p = `src-${i}`;
    add(`${p}-label`, `Fonte ${i + 1}: rótulo (≥ 3 caracteres)`, s.label.trim().length >= 3, "block");
    add(`${p}-class`, `Fonte ${i + 1}: classe no vocabulário`, (SOURCE_CLASSES as readonly string[]).includes(s.sourceClass), "block");
    add(`${p}-role`, `Fonte ${i + 1}: papel no vocabulário`, ROLES.includes(s.role), "block");
    add(`${p}-access`, `Fonte ${i + 1}: acesso no vocabulário`, (ACCESS as readonly string[]).includes(s.access), "block");
    add(
      `${p}-why`,
      `Fonte ${i + 1}: por que acreditamos nisto (≥ 10 caracteres)`,
      s.whyWeBelieveThis.trim().length >= 10,
      "block",
    );
    add(
      `${p}-url`,
      `Fonte ${i + 1}: URL nunca acompanha material protegido`,
      s.access === "public" || !s.safeUrl.trim(),
      "block",
      s.access !== "public" && s.safeUrl.trim() ? "remova a URL ou marque a fonte como pública" : undefined,
    );
    if (s.access === "public" && s.safeUrl.trim()) {
      add(`${p}-https`, `Fonte ${i + 1}: URL pública usa https`, s.safeUrl.trim().startsWith("https://"), "warn");
    }
    if (s.sha.trim()) {
      add(`${p}-sha`, `Fonte ${i + 1}: SHA parece válido (7–40 hex)`, HEX40.test(s.sha.trim()), "warn");
    }
  });

  add("life", "Ciclo de vida no vocabulário controlado", (LIFECYCLE as readonly string[]).includes(d.lifecycle), "block");
  add("curr", "Currentness no vocabulário controlado", (CURRENTNESS as readonly string[]).includes(d.currentness), "block");
  add("rung", "Degrau de evidência entre 0 e 6", d.rung >= 0 && d.rung <= EVIDENCE_RUNGS.length - 1, "block");
  add("basis", "Base da crença sobre o estado (≥ 10 caracteres)", d.basis.trim().length >= 10, "block");

  const rec = draftToRecord(d);
  if (d.lifecycle === "CURRENT") {
    const ok = d.rung >= MIN_RUNG_FOR_CURRENT && hasObservableBasis(rec);
    add(
      "current",
      "CURRENT exige evidência ≥ verificação + lastro observável (SHA/observação)",
      ok,
      "block",
      ok ? undefined : "sugerido: DEPLOYED_READBACK_PENDING até o readback externo",
    );
  }

  add("note", "Valor de continuidade (positiveNote ≥ 10 caracteres)", d.positiveNote.trim().length >= 10, "block");
  d.capabilities.forEach((c, i) => {
    add(`cap-${i}`, `Capacidade ${i + 1}: rótulo (≥ 3 caracteres)`, c.label.trim().length >= 3, "warn");
  });

  return checks;
}

export const blockFails = (checks: IntakeCheck[]) => checks.filter((c) => !c.ok && c.severity === "block");

/* ---------------- export público-seguro ---------------- */

export interface SnapshotFragment {
  schema: "hui.constellation.snapshot/v1";
  source: string;
  generatedAt: string;
  records: BuildingBlockRecord[];
}

export function exportFragment(d: IntakeDraft): SnapshotFragment {
  return {
    schema: "hui.constellation.snapshot/v1",
    source: "intake-studio · rascunho governado",
    generatedAt: new Date().toISOString().slice(0, 10),
    records: [draftToRecord(d)],
  };
}

/* ---------------- persistência local (rascunhos) ---------------- */

const DRAFTS_KEY = "hui.intake.drafts.v1";

export function loadDrafts(): IntakeDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as IntakeDraft[]) : [];
  } catch {
    return [];
  }
}

export function saveDrafts(list: IntakeDraft[]): void {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(list));
  } catch {
    /* armazenamento indisponível — rascunho segue em memória */
  }
}

export function upsertDraft(d: IntakeDraft): IntakeDraft[] {
  const list = loadDrafts();
  const i = list.findIndex((x) => x.id === d.id);
  if (i >= 0) list[i] = d;
  else list.unshift(d);
  saveDrafts(list.slice(0, 12));
  return list.slice(0, 12);
}

export function removeDraft(id: string): IntakeDraft[] {
  const list = loadDrafts().filter((d) => d.id !== id);
  saveDrafts(list);
  return list;
}

/* ---------------- handoff para Snapshot Diff / Lentes ---------------- */

export const FRAGMENT_KEY = "hui.intake.fragment.v1";
export const LENS_FOCUS_KEY = "hui.lens.focus.v1";
export const PREFILL_KEY = "hui.intake.prefill.v1";

export interface IntakePrefill {
  canonicalName?: string;
  description?: string;
  positiveNote?: string;
  basis?: string;
  rung?: number;
  unknowns?: string[];
  sourceLabel?: string;
  whyWeBelieve?: string;
}

/** Consome o prefill uma única vez (Triage Workbench → Intake Studio). */
export function readPrefill(): IntakePrefill | null {
  try {
    const raw = sessionStorage.getItem(PREFILL_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PREFILL_KEY);
    const p = JSON.parse(raw) as unknown;
    return p && typeof p === "object" ? (p as IntakePrefill) : null;
  } catch {
    return null;
  }
}

export function handoffToDiff(fragment: SnapshotFragment): boolean {
  try {
    sessionStorage.setItem(FRAGMENT_KEY, JSON.stringify(fragment));
    sessionStorage.setItem(LENS_FOCUS_KEY, "snapshot");
    return true;
  } catch {
    return false;
  }
}
