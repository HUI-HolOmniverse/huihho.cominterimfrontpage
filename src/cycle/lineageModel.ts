/* ------------------------------------------------------------------ */
/*  Ciclo Vivo · Lineage Graph — modelo determinístico                 */
/*  Arestas derivam do registry + âncoras externas reais/rotuladas.    */
/*  EXISTÊNCIA DE ARESTA NUNCA IMPLICA DEPENDÊNCIA CANÔNICA.           */
/* ------------------------------------------------------------------ */

import type { BuildingBlockRecord } from "../registry/model";
import { REGISTRY } from "../registry/queries";
import { publicSafeSnapshot } from "../registry/diff";
import { FRAGMENT_KEY, LENS_FOCUS_KEY } from "../apps/intakeModel";

export const LINEAGE_KINDS = [
  "SOURCE_LINEAGE",
  "HUMAN_CO_CREATION_LINEAGE",
  "IMPLEMENTATION_LINEAGE",
  "ASSURANCE_LINEAGE",
  "DEPLOYMENT_LINEAGE",
  "READBACK_LINEAGE",
  "CONTRADICTION",
  "UNRESOLVED",
  "RELATED",
] as const;
export type LineageKind = (typeof LINEAGE_KINDS)[number];

export const LINEAGE_LABEL: Record<LineageKind, string> = {
  SOURCE_LINEAGE: "linhagem de fonte",
  HUMAN_CO_CREATION_LINEAGE: "co-criação humana",
  IMPLEMENTATION_LINEAGE: "implementação",
  ASSURANCE_LINEAGE: "asseguração",
  DEPLOYMENT_LINEAGE: "deployment",
  READBACK_LINEAGE: "readback",
  CONTRADICTION: "contradição",
  UNRESOLVED: "não resolvido",
  RELATED: "relação (sem dependência)",
};

/* distinção que não depende de cor: padrão de traço por tipo */
export const LINEAGE_DASH: Record<LineageKind, string> = {
  SOURCE_LINEAGE: "none",
  HUMAN_CO_CREATION_LINEAGE: "7 5",
  IMPLEMENTATION_LINEAGE: "2 4",
  ASSURANCE_LINEAGE: "10 4 2 4",
  DEPLOYMENT_LINEAGE: "1 5",
  READBACK_LINEAGE: "12 4",
  CONTRADICTION: "3 3",
  UNRESOLVED: "1 3",
  RELATED: "6 6",
};

export interface LineageNode {
  id: string;
  label: string;
  kind: "registry" | "external";
  family: string;
  lifecycle?: string;
  rung?: number;
  representative?: boolean;
  note?: string;
}

export interface LineageEdge {
  id: string;
  from: string;
  to: string;
  kind: LineageKind;
  role?: string;
  label: string;
  representative?: boolean;
}

/* ---------------- âncoras externas (reais ou representativas — sempre rotuladas) ---------------- */

const EXT: LineageNode[] = [
  { id: "ext-sergio", label: "Sérgio “Da Floresta” · fonte humana", kind: "external", family: "Âncoras externas", representative: true, note: "Padrão representativo de co-criação humana. Dados DEMO rotulados — nenhuma fala ou autoria inventada." },
  { id: "ext-leiteria", label: "Leiteria Vegetal · tema (DEMO)", kind: "external", family: "Âncoras externas", representative: true, note: "Tema representativo — não é fonte governada real." },
  { id: "ext-castanhas", label: "Castanhas & agro-bio Poconé · tema (DEMO)", kind: "external", family: "Âncoras externas", representative: true, note: "Tema representativo — não é fonte governada real." },
  { id: "ext-gateway", label: "musa2-node-gateway v3 · dev branch", kind: "external", family: "Âncoras externas", note: "IMPLEMENTED_IN_DEV_BRANCH · DB_ROUNDTRIP_TESTED · NOT_INDEPENDENTLY_ASSURED · NOT_PRODUCTION_DEPLOYED." },
  { id: "ext-pr111", label: "PR #111 · constellation snapshot", kind: "external", family: "Âncoras externas", note: "Insumo planejado do adapter público-seguro — não consumido ainda." },
  { id: "ext-suite79", label: "Suite Vitest · 79 testes (sandbox)", kind: "external", family: "Âncoras externas", note: "Evidência de teste executada em sandbox — não é assurance independente." },
];

const CURATED: Omit<LineageEdge, "id">[] = [
  { from: "tool-treasure-drop", to: "ext-gateway", kind: "SOURCE_LINEAGE", label: "contrato de ingestão (dev branch · não produção)" },
  { from: "ext-suite79", to: "tool-treasure-drop", kind: "ASSURANCE_LINEAGE", label: "cobertura executada 79/79" },
  { from: "ext-suite79", to: "tool-triage-workbench", kind: "ASSURANCE_LINEAGE", label: "cobertura executada 79/79" },
  { from: "ext-suite79", to: "tool-intake-studio", kind: "ASSURANCE_LINEAGE", label: "cobertura executada 79/79" },
  { from: "mani-hui-hho-portal", to: "prototype-interim-frontpage", kind: "CONTRADICTION", label: "reclassificação documentada: “canônico · live” → protótipo interim" },
  { from: "rt-apius", to: "hui-meta", kind: "UNRESOLVED", label: "contrato público publicado · runtime não configurado" },
  { from: "ext-sergio", to: "ext-leiteria", kind: "HUMAN_CO_CREATION_LINEAGE", label: "tema representativo (DEMO)", representative: true },
  { from: "ext-sergio", to: "ext-castanhas", kind: "HUMAN_CO_CREATION_LINEAGE", label: "tema representativo (DEMO)", representative: true },
  { from: "ext-pr111", to: "tool-snapshot-diff", kind: "SOURCE_LINEAGE", label: "insumo planejado do adapter" },
  /* DEPLOYMENT_LINEAGE: suportado pelo modelo — ZERO arestas reais. Nada foi deployado. */
];

export interface ReadbackRef {
  id: string;
  targetId: string;
  state: string;
}

export function buildLineage(readbacks: ReadbackRef[] = []): { nodes: LineageNode[]; edges: LineageEdge[] } {
  const byId = new Map(REGISTRY.map((r) => [r.id, r]));
  const nodes: LineageNode[] = [
    ...REGISTRY.map((r) => ({
      id: r.id,
      label: r.canonicalName,
      kind: "registry" as const,
      family: r.family,
      lifecycle: r.lifecycle,
      rung: r.evidence.rung,
      note: r.description,
    })),
    ...EXT.map((e) => ({ ...e })),
  ];

  const seen = new Set<string>();
  const edges: LineageEdge[] = [];
  const add = (e: Omit<LineageEdge, "id">) => {
    const key = `${e.from}|${e.to}|${e.kind}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ ...e, id: `e-${edges.length + 1}` });
  };

  for (const r of REGISTRY) {
    for (const p of r.predecessorIds ?? []) {
      if (byId.has(p)) add({ from: p, to: r.id, kind: "IMPLEMENTATION_LINEAGE", role: "predecessor", label: "predecessor → successor" });
    }
    for (const s of r.successorIds ?? []) {
      if (byId.has(s)) add({ from: r.id, to: s, kind: "IMPLEMENTATION_LINEAGE", role: "successor", label: "successor" });
    }
  }
  for (const c of CURATED) add(c);
  for (const r of REGISTRY) {
    for (const rel of r.relatedIds ?? []) {
      if (!byId.has(rel)) continue;
      const key = `${r.id}|${rel}`;
      if (seen.has(`${r.id}|${rel}|IMPLEMENTATION_LINEAGE`) || seen.has(`${rel}|${r.id}|IMPLEMENTATION_LINEAGE`)) continue;
      if (seen.has(`${key}|RELATED`) || seen.has(`${rel}|${r.id}|RELATED`)) continue;
      add({ from: r.id, to: rel, kind: "RELATED", label: "relação — não implica dependência" });
    }
  }

  for (const rb of readbacks) {
    nodes.push({ id: `rb-node-${rb.id}`, label: `readback · ${rb.state}`, kind: "external", family: "Âncoras externas", note: "Observação externa registrada no Readback Console." });
    add({ from: `rb-node-${rb.id}`, to: rb.targetId, kind: "READBACK_LINEAGE", label: `observação ${rb.state}` });
  }

  return { nodes, edges };
}

/* ---------------- realce de caminhos (ancestrais + descendentes) ---------------- */

export function lineagePaths(nodeId: string, edges: LineageEdge[]): Set<string> {
  const out = new Set<string>([nodeId]);
  const walk = (dir: "up" | "down") => {
    let changed = true;
    while (changed) {
      changed = false;
      for (const e of edges) {
        if (dir === "down" && out.has(e.from) && !out.has(e.to)) {
          out.add(e.to);
          changed = true;
        }
        if (dir === "up" && out.has(e.to) && !out.has(e.from)) {
          out.add(e.from);
          changed = true;
        }
      }
    }
  };
  walk("up");
  walk("down");
  return out;
}

/* ---------------- layout determinístico ---------------- */

const FAMILY_COLS = ["HUI", "ICEBERG", "HolOmniverse", "Holo-Logoi", "Arquitetura", "Participação", "Federadas", "Manifestações", "Registry", "Building", "Âncoras externas"];

export function layoutGraph(nodes: LineageNode[]): { pos: Map<string, { x: number; y: number }>; width: number; height: number } {
  const pos = new Map<string, { x: number; y: number }>();
  const byFamily = new Map<string, LineageNode[]>();
  for (const n of nodes) {
    const fam = FAMILY_COLS.includes(n.family) ? n.family : "Registry";
    const arr = byFamily.get(fam) ?? [];
    arr.push(n);
    byFamily.set(fam, arr);
  }
  let maxRows = 0;
  FAMILY_COLS.forEach((fam, ci) => {
    const arr = (byFamily.get(fam) ?? []).sort((a, z) => a.label.localeCompare(z.label, "pt"));
    maxRows = Math.max(maxRows, arr.length);
    arr.forEach((n, ri) => pos.set(n.id, { x: 70 + ci * 152, y: 66 + ri * 34 }));
  });
  return { pos, width: 70 * 2 + (FAMILY_COLS.length - 1) * 152 + 120, height: 66 * 2 + maxRows * 34 };
}

/* ---------------- handoffs ---------------- */

export const LINEAGE_FOCUS_KEY = "hui.lineage.focus.v1";
export const LEDGER_ENTRY_KEY = "hui.ledger.entry.v1";
export const READBACK_TARGET_KEY = "hui.readback.target.v1";

export function handoffRecordToDiff(record: BuildingBlockRecord) {
  const frag = publicSafeSnapshot([record], { source: "lineage-graph · registro selecionado", generatedAt: new Date().toISOString().slice(0, 10) });
  try {
    sessionStorage.setItem(FRAGMENT_KEY, JSON.stringify(frag));
    sessionStorage.setItem(LENS_FOCUS_KEY, "snapshot");
  } catch {
    /* sem storage */
  }
  window.location.hash = "#/registry";
}

export function focusLineageNode(id: string) {
  try {
    sessionStorage.setItem(LINEAGE_FOCUS_KEY, id);
  } catch {
    /* sem storage */
  }
  window.location.hash = "#/linhagem";
}

export function focusLedgerEntry(workId: string) {
  try {
    sessionStorage.setItem(LEDGER_ENTRY_KEY, workId);
  } catch {
    /* sem storage */
  }
  window.location.hash = "#/ledger";
}

export function focusReadbackTarget(targetId: string) {
  try {
    sessionStorage.setItem(READBACK_TARGET_KEY, targetId);
  } catch {
    /* sem storage */
  }
  window.location.hash = "#/readback";
}
