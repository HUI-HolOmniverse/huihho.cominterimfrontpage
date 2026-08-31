/* ------------------------------------------------------------------ */
/*  Snapshot diff — compara base local com snapshot recebido (P0)      */
/*  Toda entrada é sanitizada ANTES do diff: saída nunca vaza URLs.    */
/* ------------------------------------------------------------------ */

import { sanitizeRecord, type BuildingBlockRecord } from "./model";

export type DiffKind = "added" | "reclassified" | "changed" | "unchanged" | "absent-retained";

export interface DiffEntry {
  id: string;
  kind: DiffKind;
  label: string;
  fields?: string[];
  note: string;
}

export interface DiffResult {
  entries: DiffEntry[];
  counts: Record<DiffKind, number>;
  baseCount: number;
  incomingCount: number;
}

const STATE_FIELDS = ["lifecycle", "currentness", "evidence.rung", "publicability", "visibility"] as const;
const TEXT_FIELDS = ["canonicalName", "description"] as const;

function stateOf(r: BuildingBlockRecord) {
  return [r.lifecycle, r.currentness, String(r.evidence.rung), r.publicability, r.visibility].join("|");
}

function textOf(r: BuildingBlockRecord) {
  return [r.canonicalName, r.description].join("|");
}

/**
 * Diff seguro e determinístico.
 * - `incoming` pode ser JSON arbitrário (ex.: PR #111) — sanitizado registro a registro.
 * - Itens ausentes no snapshot NÃO são apagados: marcados `absent-retained`.
 */
export function diffSnapshots(base: BuildingBlockRecord[], incomingRaw: unknown[]): DiffResult {
  const incoming = incomingRaw
    .filter((r): r is object => !!r && typeof r === "object")
    .map((r) => sanitizeRecord(r as Partial<BuildingBlockRecord> & { id: string }));

  const baseById = new Map(base.map((r) => [r.id, r]));
  const inById = new Map(incoming.map((r) => [r.id, r]));

  const entries: DiffEntry[] = [];
  const counts: Record<DiffKind, number> = { added: 0, reclassified: 0, changed: 0, unchanged: 0, "absent-retained": 0 };

  for (const r of incoming) {
    const b = baseById.get(r.id);
    if (!b) {
      entries.push({ id: r.id, kind: "added", label: r.canonicalName, note: "novo no snapshot — requer triagem e rotulagem antes de adoção" });
      counts.added++;
      continue;
    }
    const stateChanged = stateOf(b) !== stateOf(r);
    const textChanged = textOf(b) !== textOf(r);
    if (!stateChanged && !textChanged) {
      counts.unchanged++;
      entries.push({ id: r.id, kind: "unchanged", label: r.canonicalName, note: "idêntico à base local" });
      continue;
    }
    const fields: string[] = [];
    if (b.lifecycle !== r.lifecycle) fields.push("lifecycle");
    if (b.currentness !== r.currentness) fields.push("currentness");
    if (b.evidence.rung !== r.evidence.rung) fields.push("evidence.rung");
    if (b.publicability !== r.publicability) fields.push("publicability");
    if (b.visibility !== r.visibility) fields.push("visibility");
    if (b.canonicalName !== r.canonicalName) fields.push("canonicalName");
    if (b.description !== r.description) fields.push("description");
    if (stateChanged) {
      entries.push({ id: r.id, kind: "reclassified", label: r.canonicalName, fields, note: `estado reclassificado (${fields.filter((f) => (STATE_FIELDS as readonly string[]).includes(f)).join(", ") || "estado"})` });
      counts.reclassified++;
    } else if (textChanged) {
      entries.push({ id: r.id, kind: "changed", label: r.canonicalName, fields, note: "apenas texto/descrição alterados" });
      counts.changed++;
    }
  }

  for (const b of base) {
    if (!inById.has(b.id)) {
      entries.push({ id: b.id, kind: "absent-retained", label: b.canonicalName, note: "ausente do snapshot — retido localmente (não-apagamento)" });
      counts["absent-retained"]++;
    }
  }

  const order: Record<DiffKind, number> = { reclassified: 0, added: 1, changed: 2, "absent-retained": 3, unchanged: 4 };
  entries.sort((a, z) => order[a.kind] - order[z.kind] || a.label.localeCompare(z.label, "pt"));

  return { entries, counts, baseCount: base.length, incomingCount: incoming.length };
}

/** Variante SINTÉTICA rotulada — apenas para demonstrar o diff sem tocar dados reais. */
export function makeSyntheticVariant(base: BuildingBlockRecord[]): unknown[] {
  const clone: unknown[] = base.slice(0, -2).map((r) => ({ ...r }));
  const target = base[0];
  if (target) {
    clone[0] = { ...target, lifecycle: "HELD", currentness: "held", positiveNote: target.positiveNote };
  }
  clone.push({
    id: "syn-incoming-demo",
    canonicalName: "Bloco sintético de demonstração",
    kind: "experiment",
    family: "HUI",
    description: "Item sintético rotulado — existe apenas para exercitar o diff.",
    lifecycle: "RESEARCH",
    currentness: "research",
    evidence: { rung: 0, basis: "sintético" },
    positiveNote: "Demonstração controlada do mecanismo de intake.",
    sourceRefs: [{ id: "syn-src", sourceClass: "other", label: "gerado localmente", role: "synthesis", access: "public", whyWeBelieveThis: "criado pelo próprio diff-tool para teste" }],
  });
  return clone;
}

/** Export público-seguro do registry atual (sanitizado de novo, por defesa). */
export function publicSafeSnapshot(records: BuildingBlockRecord[], meta: { source: string; generatedAt: string }) {
  return {
    schema: "hui.constellation.snapshot/v1",
    ...meta,
    records: records.map((r) => sanitizeRecord(r)),
  };
}
