/* ------------------------------------------------------------------ */
/*  Consultas sobre o registry — um motor para lançador + lentes       */
/* ------------------------------------------------------------------ */

import {
  EVIDENCE_RUNGS,
  LIFECYCLE,
  LIFECYCLE_LABEL,
  SOURCE_CLASSES,
  type BuildingBlockRecord,
  type Currentness,
  type Lifecycle,
} from "./model";
import { activeAdapter } from "./adapter";

export const REGISTRY = activeAdapter.list();
export const REGISTRY_META = activeAdapter.meta;

export const byId = new Map(REGISTRY.map((r) => [r.id, r]));

export function getRecord(id: string): BuildingBlockRecord | undefined {
  return byId.get(id);
}

/* ---------------- parser de comandos ---------------- */

export interface ParsedQuery {
  text: string;
  type?: string;
  state?: string;
  family?: string;
  evidence?: string;
  source?: string;
  available?: string;
}

const PREFIXES = ["type", "state", "family", "evidence", "source", "available"] as const;

/** Tokens desconhecidos nunca quebram: viram texto livre (fail-safe). */
export function parseQuery(input: string): ParsedQuery {
  const out: ParsedQuery = { text: "" };
  const rest: string[] = [];
  for (const token of input.trim().split(/\s+/).filter(Boolean)) {
    const m = token.match(/^([a-z]+):(.+)$/i);
    if (m && (PREFIXES as readonly string[]).includes(m[1].toLowerCase())) {
      (out as unknown as Record<string, string | undefined>)[m[1].toLowerCase()] = m[2].toLowerCase();
    } else {
      rest.push(token);
    }
  }
  out.text = rest.join(" ").toLowerCase();
  return out;
}

/* ---------------- filtros ---------------- */

function matchesEvidence(rec: BuildingBlockRecord, value: string): boolean {
  switch (value) {
    case "verified":
      return rec.evidence.rung >= 4;
    case "approved":
      return rec.evidence.rung >= 5;
    case "live":
      return rec.evidence.rung >= 6;
    case "represented":
      return rec.evidence.rung >= 2;
    default: {
      const idx = (EVIDENCE_RUNGS as readonly string[]).indexOf(value);
      return idx >= 0 ? rec.evidence.rung === idx : true;
    }
  }
}

export function applyFilters(records: BuildingBlockRecord[], q: ParsedQuery): BuildingBlockRecord[] {
  return records.filter((rec) => {
    if (q.type) {
      const t = q.type;
      const ok =
        t === "tool"
          ? rec.kind === "tool"
          : t === "manifestation"
            ? rec.kind === "manifestation"
            : t === "route"
              ? rec.kind === "route"
              : t === "predecessor"
                ? rec.lifecycle === "PREDECESSOR" || rec.currentness === "predecessor"
                : rec.kind === t;
      if (!ok) return false;
    }
    if (q.state) {
      const s = q.state;
      const life = rec.lifecycle.toLowerCase();
      const ok =
        s === "current"
          ? rec.lifecycle === "CURRENT"
          : s === "prototype"
            ? rec.lifecycle === "PROTOTYPE" || rec.currentness === "prototype"
            : s === "predecessor"
              ? rec.lifecycle === "PREDECESSOR" || rec.currentness === "predecessor"
              : s === "held"
                ? rec.lifecycle === "HELD" || rec.currentness === "held"
                : s === "research"
                  ? rec.lifecycle === "RESEARCH" || rec.currentness === "research"
                  : s === "historical"
                    ? rec.currentness === "historical"
                    : s === "proposed"
                      ? rec.lifecycle === "PROPOSED_NOT_CONFIGURED"
                      : life.includes(s);
      if (!ok) return false;
    }
    if (q.family && rec.family.toLowerCase() !== q.family && !rec.family.toLowerCase().startsWith(q.family)) return false;
    if (q.evidence && !matchesEvidence(rec, q.evidence)) return false;
    if (q.source && !rec.sourceRefs.some((sr) => sr.sourceClass.toLowerCase().includes(q.source!))) return false;
    if (q.available === "now" && !(rec.capabilities ?? []).some((c) => c.availability === "now")) return false;
    if (q.text) {
      const hay = [rec.canonicalName, rec.id, rec.description, ...(rec.aliases ?? []), rec.family, rec.kind]
        .join(" ")
        .toLowerCase();
      if (!q.text.split(" ").every((t) => hay.includes(t))) return false;
    }
    return true;
  });
}

export function searchRecords(input: string): BuildingBlockRecord[] {
  return applyFilters(REGISTRY, parseQuery(input));
}

/* ---------------- agrupamentos das lentes ---------------- */

export function groupByCurrentness(records: BuildingBlockRecord[]): Map<Currentness, BuildingBlockRecord[]> {
  const order: Currentness[] = ["current", "candidate", "binding-candidate", "prototype", "predecessor", "research", "held", "historical", "unknown"];
  const map = new Map<Currentness, BuildingBlockRecord[]>();
  for (const o of order) map.set(o, []);
  for (const r of records) map.get(r.currentness)?.push(r) ?? map.set(r.currentness, [r]);
  return map;
}

export function groupByEvidence(records: BuildingBlockRecord[]): Map<number, BuildingBlockRecord[]> {
  const map = new Map<number, BuildingBlockRecord[]>();
  for (let i = 0; i < EVIDENCE_RUNGS.length; i++) map.set(i, []);
  for (const r of records) map.get(r.evidence.rung)?.push(r);
  return map;
}

export function groupBySourceClass(records: BuildingBlockRecord[]): Map<string, BuildingBlockRecord[]> {
  const map = new Map<string, BuildingBlockRecord[]>();
  for (const c of SOURCE_CLASSES) map.set(c, []);
  for (const r of records) {
    for (const s of r.sourceRefs) {
      const arr = map.get(s.sourceClass) ?? [];
      if (!arr.includes(r)) arr.push(r);
      map.set(s.sourceClass, arr);
    }
  }
  return map;
}

export function groupByLifecycle(records: BuildingBlockRecord[]): Map<Lifecycle, BuildingBlockRecord[]> {
  const map = new Map<Lifecycle, BuildingBlockRecord[]>();
  for (const l of LIFECYCLE) map.set(l, []);
  for (const r of records) map.get(r.lifecycle)?.push(r);
  return map;
}

export const lifecycleLabel = (l: Lifecycle) => LIFECYCLE_LABEL[l] ?? l.toLowerCase();
