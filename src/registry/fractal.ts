/* ------------------------------------------------------------------ */
/*  Navegação fractal ROOT → DOMAIN → TOPIC → PROVENANCE (P0)          */
/*  Derivada do registry — nenhuma hierarquia paralela hardcoded.      */
/* ------------------------------------------------------------------ */

import type { BuildingBlockRecord, SourceReference } from "./model";
import { LIFECYCLE_LABEL } from "./model";

export type FractalLevel = "ROOT" | "DOMAIN" | "TOPIC" | "PROVENANCE";

export const FRACTAL_LEVELS: FractalLevel[] = ["ROOT", "DOMAIN", "TOPIC", "PROVENANCE"];

export interface FractalNode {
  key: string;
  level: FractalLevel;
  label: string;
  hint?: string;
  lifecycle?: BuildingBlockRecord["lifecycle"];
  recordId?: string;
  sourceRef?: SourceReference;
  children: FractalNode[];
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Árvore determinística: famílias → registros → proveniência. */
export function buildFractalTree(records: BuildingBlockRecord[]): FractalNode {
  const families = new Map<string, BuildingBlockRecord[]>();
  for (const r of records) {
    const arr = families.get(r.family) ?? [];
    arr.push(r);
    families.set(r.family, arr);
  }

  const root: FractalNode = {
    key: "root",
    level: "ROOT",
    label: "Constelação HUI",
    hint: "uma raiz · profundidade fractal",
    children: [],
  };

  const familyNames = [...families.keys()].sort((a, b) => a.localeCompare(b, "pt"));
  for (const fam of familyNames) {
    const recs = families.get(fam)!;
    const domain: FractalNode = {
      key: `root/${slug(fam)}`,
      level: "DOMAIN",
      label: fam,
      hint: `${recs.length} bloco${recs.length > 1 ? "s" : ""}`,
      children: recs.map((r) => ({
        key: `root/${slug(fam)}/${r.id}`,
        level: "TOPIC" as FractalLevel,
        label: r.canonicalName,
        hint: LIFECYCLE_LABEL[r.lifecycle] ?? r.lifecycle,
        lifecycle: r.lifecycle,
        recordId: r.id,
        children: r.sourceRefs.map((s) => ({
          key: `root/${slug(fam)}/${r.id}/${slug(s.id)}`,
          level: "PROVENANCE" as FractalLevel,
          label: s.label,
          hint: s.sourceClass,
          sourceRef: s,
          recordId: r.id,
          children: [],
        })),
      })),
    };
    root.children.push(domain);
  }
  return root;
}

export function nodeAtPath(root: FractalNode, path: string[]): FractalNode | null {
  let cur: FractalNode = root;
  for (let i = 1; i < path.length; i++) {
    const next = cur.children.find((c) => c.key === path[i]);
    if (!next) return null; // caminho desconhecido → falha segura, nunca fabrica
    cur = next;
  }
  return cur;
}

/** Rótulos humanos do caminho (para breadcrumb + anúncio SR). */
export function pathLabels(root: FractalNode, path: string[]): string[] {
  const out: string[] = [];
  let cur: FractalNode | null = root;
  out.push(cur.label);
  for (let i = 1; i < path.length && cur; i++) {
    cur = cur.children.find((c) => c.key === path[i]) ?? null;
    if (cur) out.push(cur.label);
  }
  return out;
}

/** Garantias estruturais usadas em testes determinísticos. */
export function fractalInvariants(root: FractalNode, records: BuildingBlockRecord[]): string[] {
  const problems: string[] = [];
  const topics = new Set<string>();
  const walk = (n: FractalNode, depth: number) => {
    if (depth > 3) problems.push(`profundidade excedida em ${n.key}`);
    if (n.level === "TOPIC" && n.recordId) topics.add(n.recordId);
    if (n.level === "PROVENANCE" && !n.sourceRef) problems.push(`proveniência sem fonte em ${n.key}`);
    n.children.forEach((c) => walk(c, depth + 1));
  };
  walk(root, 0);
  for (const r of records) {
    if (!topics.has(r.id)) problems.push(`registro ${r.id} inalcançável na árvore fractal`);
  }
  return problems;
}
