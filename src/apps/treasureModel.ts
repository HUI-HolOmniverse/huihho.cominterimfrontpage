/* ------------------------------------------------------------------ */
/*  Captura Rápida / Treasure Drop — modelo + lei semântica            */
/*  RAW → DROP → QUARANTINE → TRIAGE → DIFF → CANDIDATE.               */
/*  DISCOVERED != ADOPTED · REPORTED != VERIFIED · Captura ≠ adoção.   */
/* ------------------------------------------------------------------ */

export const SOURCE_TYPES = ["WHATSAPP", "SLACK", "GOOGLE_DRIVE", "GMAIL", "MEETING", "WEB", "MANUAL", "AGENT", "OTHER"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const CONTENT_KINDS = ["TEXT", "LINK", "AUDIO_TRANSCRIPT", "FILE_REFERENCE", "OBSERVATION", "MIXED"] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export const SENSITIVITY = ["PUBLIC_SAFE", "GOVERNED_PRIVATE", "SENSITIVE_PRIVATE", "RESTRICTED"] as const;
export type Sensitivity = (typeof SENSITIVITY)[number];

export const SENSITIVITY_LABEL: Record<Sensitivity, string> = {
  PUBLIC_SAFE: "público-seguro",
  GOVERNED_PRIVATE: "privado governado",
  SENSITIVE_PRIVATE: "privado sensível",
  RESTRICTED: "restrito",
};

/* ---------------- estados fixados pelo backend (não rebaixar, não inflar) ---------------- */
export const BACKEND_IMPOSED = {
  evidence_state: "REPORTED",
  authority_state: "NONE",
  triage_status: "QUARANTINED",
  adoption_state: "NOT_ADOPTED",
  aipfit_registration_state: "REGISTRATION_NOT_REQUESTED",
} as const;

export const MAX_RAW = 65536;
export const MAX_URI = 4096;

export interface TreasureDropPayload {
  idempotency_key: string;
  source_type: SourceType;
  source_node_key?: string;
  content_kind: ContentKind;
  raw_content?: string;
  external_uri?: string;
  source_ref?: string;
  provenance_refs?: string[];
  classification_hints?: string[];
  thematic_pointers?: string[];
  language?: string;
  sensitivity: Sensitivity;
  metadata?: Record<string, string>;
  potential_creative_contribution: boolean;
}

/* ---------------- idempotência ---------------- */

export function newIdempotencyKey(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    /* fallback abaixo */
  }
  return `td-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------------- validação do contrato ---------------- */

export function validatePayload(p: TreasureDropPayload): string[] {
  const errs: string[] = [];
  if (!p.idempotency_key || p.idempotency_key.trim().length < 8) errs.push("idempotency_key é obrigatória.");
  const hasRaw = (p.raw_content ?? "").trim().length > 0;
  const hasUri = (p.external_uri ?? "").trim().length > 0;
  if (!hasRaw && !hasUri) errs.push("Inclua ao menos um pensamento (texto) ou um link.");
  if ((p.raw_content ?? "").length > MAX_RAW) errs.push(`Texto acima de ${MAX_RAW} caracteres.`);
  if ((p.external_uri ?? "").length > MAX_URI) errs.push(`URL acima de ${MAX_URI} caracteres.`);
  if (hasUri && !/^https?:\/\/\S+$/i.test((p.external_uri ?? "").trim())) errs.push("URL deve começar com http(s):// — sem exceções.");
  return errs;
}

/* ---------------- recibos ---------------- */

export interface GatewayReceipt {
  id: string;
  evidence_state: string;
  authority_state: string;
  triage_status: string;
  adoption_state: string;
  aipfit_registration_state: string;
  sensitivity: string;
  created_at?: string;
}

/** Recibo malformado/mais-maduro do gateway — nunca aceito silenciosamente. */
export class InvalidGatewayReceiptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "INVALID_GATEWAY_RECEIPT";
  }
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim().length > 0 ? v.trim() : null);

/**
 * Fail-closed (BLOCKER: GATEWAY RECEIPT) — um recibo "de sucesso" malformado é
 * REJEITADO, nunca preenchido com defaults maduros. Exige valores exatos do
 * contrato; qualquer ausência, malformação ou estado mais maduro lança
 * INVALID_GATEWAY_RECEIPT.
 */
export function normalizeReceipt(raw: unknown): GatewayReceipt {
  const r = (raw ?? {}) as Record<string, unknown>;

  const id = str(r.id);
  if (!id) throw new InvalidGatewayReceiptError("Recibo sem id válido — rejeitado (INVALID_GATEWAY_RECEIPT).");

  const checks: Array<[keyof GatewayReceipt, string, string]> = [
    ["evidence_state", str(r.evidence_state) ?? "", BACKEND_IMPOSED.evidence_state],
    ["authority_state", str(r.authority_state) ?? "", BACKEND_IMPOSED.authority_state],
    ["triage_status", str(r.triage_status) ?? "", BACKEND_IMPOSED.triage_status],
    ["adoption_state", str(r.adoption_state) ?? "", BACKEND_IMPOSED.adoption_state],
    ["aipfit_registration_state", str(r.aipfit_registration_state) ?? "", BACKEND_IMPOSED.aipfit_registration_state],
  ];
  for (const [field, got, want] of checks) {
    if (got !== want) {
      throw new InvalidGatewayReceiptError(
        `Recibo com ${field}="${got || "<ausente>"}" — esperado exatamente "${want}". Rejeitado (INVALID_GATEWAY_RECEIPT); nada foi aceito.`,
      );
    }
  }

  const sensitivity = str(r.sensitivity) ?? "";
  if (!(SENSITIVITY as readonly string[]).includes(sensitivity)) {
    throw new InvalidGatewayReceiptError(`Recibo com sensitivity="${sensitivity || "<ausente>"}" fora do vocabulário controlado. Rejeitado (INVALID_GATEWAY_RECEIPT).`);
  }

  return {
    id,
    evidence_state: BACKEND_IMPOSED.evidence_state,
    authority_state: BACKEND_IMPOSED.authority_state,
    triage_status: BACKEND_IMPOSED.triage_status,
    adoption_state: BACKEND_IMPOSED.adoption_state,
    aipfit_registration_state: BACKEND_IMPOSED.aipfit_registration_state,
    sensitivity,
    created_at: typeof r.created_at === "string" ? r.created_at : undefined,
  };
}

/* ---------------- camada local (local-first, nunca "salvo" sem local conhecido) ---------------- */

export type LocalDropStatus = "LOCAL_DRAFT" | "SUBMISSION_PENDING" | "RECEIVED_BY_GATEWAY" | "FAILED_TO_SUBMIT";

export const LOCAL_DROP_STATUS_LABEL: Record<LocalDropStatus, string> = {
  LOCAL_DRAFT: "rascunho local",
  SUBMISSION_PENDING: "submissão pendente",
  RECEIVED_BY_GATEWAY: "recebido pelo gateway",
  FAILED_TO_SUBMIT: "falha ao submeter · rascunho preservado",
};

export interface LocalDrop {
  key: string;
  payload: TreasureDropPayload;
  status: LocalDropStatus;
  receipt?: GatewayReceipt;
  failure?: string;
  gatewayNote?: string;
  createdAt: string;
  updatedAt: string;
}

const STORE_KEY = "hui.treasure.local.v1";

export function loadLocalDrops(): LocalDrop[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LocalDrop[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalDrops(list: LocalDrop[]): LocalDrop[] {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch {
    /* storage indisponível — estado permanece em memória */
  }
  return list;
}

export function upsertLocalDrop(d: LocalDrop): LocalDrop[] {
  const list = loadLocalDrops();
  const i = list.findIndex((x) => x.key === d.key);
  if (i >= 0) list[i] = d;
  else list.unshift(d);
  return saveLocalDrops(list);
}

/* ---------------- privacidade / publicabilidade ---------------- */

export function isPublicSafe(s: Sensitivity): boolean {
  return s === "PUBLIC_SAFE";
}

/** Conteúdo não público-seguro NUNCA vira âncora, export ou texto público. */
export function maskUnlessPublic(text: string, sensitivity: Sensitivity): string {
  return isPublicSafe(sensitivity) ? text : `[conteúdo protegido · sensibilidade ${SENSITIVITY_LABEL[sensitivity]}]`;
}
