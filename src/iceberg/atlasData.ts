/* ------------------------------------------------------------------ */
/*  Conteúdo do atlas derivado do registry — sem claims hardcoded (P4) */
/* ------------------------------------------------------------------ */

import { REGISTRY, getRecord } from "../registry/queries";
import type { BuildingBlockRecord } from "../registry/model";

export const ICE = getRecord("iceberg-root")!;
export const HUI = getRecord("hui-meta")!;

/* nós da convergência — ids do registry + geometria estável */
export const CONVERGENCE_IDS = [
  "hui-meta",
  "mani-wtv",
  "mani-abundance-gamma",
  "mani-ciessm",
  "mani-holopolis",
  "mani-agoras",
  "route-artepraamarerir",
];

export interface ConvergenceNode {
  record: BuildingBlockRecord;
  angle: number; // graus
  ring: number; // 0 interno, 1 externo
}

export const CONVERGENCE_NODES: ConvergenceNode[] = CONVERGENCE_IDS.map((id, i) => ({
  record: getRecord(id)!,
  angle: -90 + i * (360 / CONVERGENCE_IDS.length),
  ring: i % 2,
})).filter((n) => Boolean(n.record));

export const CONVERGENCE_CORE = getRecord("iceberg-convergence-core")!;

/* ledger de currentness — blocos, não strings soltas */
export const LEDGER_IDS = [
  "prototype-interim-frontpage",
  "rt-holo",
  "rt-knowledge",
  "rt-api",
  "mani-hui-hho-portal",
  "hui-meta",
];

export function ledgerRows(): BuildingBlockRecord[] {
  return LEDGER_IDS.map((id) => getRecord(id)).filter((r): r is BuildingBlockRecord => Boolean(r));
}

/* linha do tempo ontogônica — manifestações do registry, ordem de linhagem */
export function ontogenesisTimeline(): BuildingBlockRecord[] {
  return REGISTRY.filter((r) => r.kind === "manifestation");
}

export const RUNG_MEANINGS = [
  "A intenção existe e foi declarada publicamente.",
  "Há desenho estruturado: arquitetura, rotas, contratos.",
  "Há representação pública legível — portal, protótipo, apresentação.",
  "Fontes independentes corroboram a representação.",
  "Verificação externa: leitura do destino, testes, auditoria.",
  "Aprovação governada registrada em source.",
  "Vigência: deploy com readback externo confirmado e indexado.",
];
