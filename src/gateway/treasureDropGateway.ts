/* ------------------------------------------------------------------ */
/*  Fronteira de submissão — ÚNICO caminho permitido:                  */
/*  UI → Supabase Edge Function `musa2-node-gateway` → /treasure-drop  */
/*                                                                     */
/*  PROIBIDO neste módulo e em qualquer código de browser:             */
/*   - acesso direto à tabela privada de drops no schema musa2         */
/*   - consulta direta de tabela ou RPC direto de submissão            */
/*   - qualquer chave de papel de serviço (service role)               */
/*  Sem sessão autenticada → fail-closed (nenhuma inserção anônima).   */
/*  Estas proibições são verificadas por testes estáticos de source.   */
/* ------------------------------------------------------------------ */

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeReceipt, type GatewayReceipt, type TreasureDropPayload } from "../apps/treasureModel";

export const GATEWAY_FUNCTION = "musa2-node-gateway";
export const GATEWAY_ROUTE = "/treasure-drop";
export const GATEWAY_INTERFACE = "musa2-node-v0.2";
export const GATEWAY_VERSION = "v3";

/**
 * Estado de ciclo de vida do backend (transparência obrigatória):
 * IMPLEMENTED_IN_DEV_BRANCH · DB_ROUNDTRIP_TESTED ·
 * SECURITY_ADVISOR_PARTIALLY_HARDENED · NOT_INDEPENDENTLY_ASSURED ·
 * NOT_MERGED · NOT_PRODUCTION_DEPLOYED · NOT_PUBLICLY_EXPOSED
 */
export const GATEWAY_LIFECYCLE =
  "IMPLEMENTED_IN_DEV_BRANCH · DB_ROUNDTRIP_TESTED · NOT_INDEPENDENTLY_ASSURED · NOT_PRODUCTION_DEPLOYED";

export class GatewayUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GatewayUnavailableError";
  }
}

export class GatewayAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GatewayAuthError";
  }
}

export class GatewayRejectedError extends Error {
  detail?: unknown;
  constructor(message: string, detail?: unknown) {
    super(message);
    this.name = "GatewayRejectedError";
    this.detail = detail;
  }
}

export interface TreasureDropGateway {
  readonly mode: "supabase-edge" | "unavailable";
  submit(payload: TreasureDropPayload): Promise<GatewayReceipt>;
}

/* ---------------- implementação Edge Function ---------------- */

export class SupabaseTreasureGateway implements TreasureDropGateway {
  readonly mode = "supabase-edge" as const;
  private url: string;
  private anon: string;
  /* SDK carregado sob demanda — nunca pesa no bundle quando não há alvo de sessão */
  private clientPromise: Promise<SupabaseClient> | null = null;

  constructor(url: string, anon: string) {
    this.url = url;
    this.anon = anon;
  }

  private client(): Promise<SupabaseClient> {
    this.clientPromise ??= import("@supabase/supabase-js").then(({ createClient }) => createClient(this.url, this.anon));
    return this.clientPromise;
  }

  async submit(payload: TreasureDropPayload): Promise<GatewayReceipt> {
    const client = await this.client();
    /* fail-closed: sem sessão legítima não há submissão — jamais anônima */
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) {
      throw new GatewayAuthError("Nenhuma sessão autenticada — submissão recusada (fail-closed). Nenhuma inserção ocorreu.");
    }

    /* única via: invoke autenticado da Edge Function com o JWT da sessão.
       A rota interna do gateway é parte do caminho da função —
       functions-js 2.112 não expõe `path`, então o segmento segue no nome. */
    const { data, error } = await client.functions.invoke(`${GATEWAY_FUNCTION}${GATEWAY_ROUTE}`, {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
    });

    if (error) {
      throw new GatewayRejectedError(`O gateway recusou ou não respondeu (${error.name ?? "erro"}). Nenhum aceite foi emitido.`, error);
    }
    return normalizeReceipt(data);
  }
}

/* ---------------- modo indisponível (protótipo sem credenciais) ---------------- */

export class UnavailableTreasureGateway implements TreasureDropGateway {
  readonly mode = "unavailable" as const;
  readonly reason: string;

  constructor(reason: string) {
    this.reason = reason;
  }

  submit(): Promise<GatewayReceipt> {
    /* fail-closed: indisponível NUNCA vira inserção silenciosa */
    return Promise.reject(new GatewayUnavailableError(this.reason));
  }
}

/* ---------------- fábrica (decisão única de caminho) ---------------- */

export function createTreasureGateway(): TreasureDropGateway {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const url = env.VITE_SUPABASE_URL;
  const anon = env.VITE_SUPABASE_ANON_KEY;

  if (url && anon) {
    /* apenas URL + anon key públicas; o JWT da sessão autentica a invocação */
    return new SupabaseTreasureGateway(url, anon);
  }

  return new UnavailableTreasureGateway(
    "Sessão/credenciais Supabase ausentes neste ambiente de protótipo — submissão ao gateway desativada (fail-closed). Capturas permanecem como rascunho local; nenhuma submissão de servidor foi simulada.",
  );
}
