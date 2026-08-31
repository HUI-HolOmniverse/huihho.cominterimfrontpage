/* Treasure Drop + Triage Workbench — suite executável (jsdom) */
import { describe, expect, it, afterEach, beforeEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import App from "../App";
import TreasureDrop, { ReceiptBlock } from "./TreasureDrop";
import TriageWorkbench from "./TriageWorkbench";
import { RegistryProvider } from "../registry/Inspector";
import { REGISTRY } from "../registry/queries";
import {
  BACKEND_IMPOSED,
  loadLocalDrops,
  maskUnlessPublic,
  newIdempotencyKey,
  normalizeReceipt,
  saveLocalDrops,
  upsertLocalDrop,
  validatePayload,
  type LocalDrop,
  type TreasureDropPayload,
} from "./treasureModel";
import {
  LocalTriageAdapter,
  buildCandidateRecord,
  handoffCandidateToDiff,
  handoffCandidateToIntake,
  fromLocalDrop,
} from "./triageModel";
import { FRAGMENT_KEY, LENS_FOCUS_KEY, PREFILL_KEY } from "./intakeModel";
import { GatewayUnavailableError, UnavailableTreasureGateway, createTreasureGateway, GATEWAY_FUNCTION, GATEWAY_ROUTE } from "../gateway/treasureDropGateway";

function projectRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    if (existsSync(resolve(dir, "package.json")) && existsSync(resolve(dir, "index.html"))) return dir;
    dir = resolve(dir, "..");
  }
  return process.cwd();
}
const readSrc = (rel: string) => readFileSync(resolve(projectRoot(), rel), "utf-8");

const basePayload = (over: Partial<TreasureDropPayload> = {}): TreasureDropPayload => ({
  idempotency_key: newIdempotencyKey(),
  source_type: "MANUAL",
  content_kind: "TEXT",
  raw_content: "Abiu",
  sensitivity: "PUBLIC_SAFE",
  potential_creative_contribution: false,
  ...over,
});

const baseDrop = (over: Partial<LocalDrop> = {}): LocalDrop => {
  const p = basePayload(over.payload ?? {});
  const now = new Date().toISOString();
  return { key: p.idempotency_key, payload: p, status: "LOCAL_DRAFT", createdAt: now, updatedAt: now, ...over };
};

beforeEach(() => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    /* sem storage */
  }
});
afterEach(cleanup);

/* ============ 1–5 · guardas estáticas do caminho de submissão ============ */

describe("fronteira de submissão (prova de caminho)", () => {
  it("usa a Edge Function autenticada: UI → musa2-node-gateway → /treasure-drop", () => {
    const gw = readSrc("src/gateway/treasureDropGateway.ts");
    expect(gw).toContain("functions.invoke");
    expect(gw).toContain(GATEWAY_FUNCTION);
    expect(gw).toContain(GATEWAY_ROUTE);
    expect(gw).toContain("getSession");
  });

  it("NENHUM acesso direto a tabela/RPC/service-role no caminho de submissão", () => {
    for (const f of ["src/gateway/treasureDropGateway.ts", "src/apps/TreasureDrop.tsx", "src/apps/TriageWorkbench.tsx", "src/apps/treasureModel.ts", "src/apps/triageModel.ts"]) {
      const src = readSrc(f);
      expect(src, `${f} acessa tabela diretamente`).not.toMatch(/\.from\(\s*["']treasure_drops["']\s*\)/);
      expect(src, `${f} usa schema privado`).not.toMatch(/\.schema\(\s*["']musa2_ingest["']\s*\)/);
      expect(src, `${f} chama RPC proibido`).not.toContain("submit_musa2_treasure_drop");
      expect(src, `${f} contém service-role`).not.toMatch(/service[-_]role/i);
      expect(src, `${f} chama .rpc(`).not.toContain(".rpc(");
    }
  });

  it("sem sessão autenticada não há submissão silenciosa (fail-closed)", async () => {
    const gw = createTreasureGateway();
    /* neste ambiente não há credenciais Supabase — o gateway é explicitamente indisponível */
    expect(gw.mode).toBe("unavailable");
    await expect(gw.submit(basePayload())).rejects.toBeInstanceOf(GatewayUnavailableError);
    expect(new UnavailableTreasureGateway("x").mode).toBe("unavailable");
  });
});

/* ============ 6–11 · contrato, idempotência, local-first ============ */

describe("contrato Treasure Drop", () => {
  it("aceita pensamento puro, link puro e misto", () => {
    expect(validatePayload(basePayload({ raw_content: "Abiu", external_uri: undefined }))).toEqual([]);
    expect(validatePayload(basePayload({ raw_content: undefined, external_uri: "https://exemplo.org/a", content_kind: "LINK" }))).toEqual([]);
    expect(validatePayload(basePayload({ raw_content: "Abiu", external_uri: "https://exemplo.org/a", content_kind: "MIXED" }))).toEqual([]);
  });

  it("exige idempotency_key e ao menos um conteúdo; rejeita URL malformada", () => {
    expect(validatePayload(basePayload({ idempotency_key: "", raw_content: "x" })).join(" ")).toMatch(/idempotency/i);
    expect(validatePayload(basePayload({ raw_content: "   ", external_uri: undefined })).join(" ")).toMatch(/ao menos/i);
    expect(validatePayload(basePayload({ raw_content: undefined, external_uri: "ftp://nope" })).join(" ")).toMatch(/http/i);
  });

  it("retry reutiliza a mesma chave — nunca duplica a captura", () => {
    const d = baseDrop();
    upsertLocalDrop(d);
    upsertLocalDrop({ ...d, status: "FAILED_TO_SUBMIT", failure: "rede", updatedAt: new Date().toISOString() });
    upsertLocalDrop({ ...d, status: "SUBMISSION_PENDING", updatedAt: new Date().toISOString() });
    const list = loadLocalDrops();
    expect(list.filter((x) => x.key === d.key).length).toBe(1);
    expect(list[0].status).toBe("SUBMISSION_PENDING");
    expect(list[0].payload.raw_content).toBe("Abiu");
  });

  it("submissão falha preserva o rascunho local com o conteúdo bruto", () => {
    const d = baseDrop({ status: "FAILED_TO_SUBMIT", failure: "gateway recusou" });
    saveLocalDrops([d]);
    const kept = loadLocalDrops()[0];
    expect(kept.status).toBe("FAILED_TO_SUBMIT");
    expect(kept.payload.raw_content).toBe("Abiu");
    expect(kept.failure).toContain("gateway");
  });

  it("recibo normalizado mostra os estados exatos do contrato — e nada mais maduro", () => {
    const r = normalizeReceipt({});
    expect(r.evidence_state).toBe("REPORTED");
    expect(r.authority_state).toBe("NONE");
    expect(r.triage_status).toBe("QUARANTINED");
    expect(r.adoption_state).toBe("NOT_ADOPTED");
    expect(r.aipfit_registration_state).toBe("REGISTRATION_NOT_REQUESTED");
    expect(JSON.stringify(r)).not.toContain("VERIFIED");
    expect(JSON.stringify(r)).not.toContain("ACCEPTED");
    expect(JSON.stringify(BACKEND_IMPOSED)).toContain("REGISTRATION_NOT_REQUESTED");
  });
});

/* ============ 12–17 · receipt visível + AIPFIT ============ */

describe("receipt e AIPFIT", () => {
  it("renderiza RECEBIDO com os rótulos exatos; REPORTED nunca vira VERIFIED, QUARANTINED nunca vira ACCEPTED", () => {
    render(<ReceiptBlock receipt={{ id: "td-123", ...BACKEND_IMPOSED, sensitivity: "PUBLIC_SAFE", created_at: "2026-08-30T12:00:00Z" }} />);
    expect(screen.getByText("recebido")).toBeInTheDocument();
    expect(screen.getByText("REPORTED")).toBeInTheDocument();
    expect(screen.getByText("NONE")).toBeInTheDocument();
    expect(screen.getByText("QUARANTINED")).toBeInTheDocument();
    expect(screen.getByText("NOT_ADOPTED")).toBeInTheDocument();
    expect(screen.getByText("REGISTRATION_NOT_REQUESTED")).toBeInTheDocument();
    const block = screen.getByTestId("receipt-block").textContent ?? "";
    expect(block).not.toContain("VERIFIED");
    expect(block).not.toContain("ACCEPTED");
  });

  it("possível contribuição criativa nunca implica registro/AIPFIT", () => {
    render(
      <RegistryProvider>
        <TreasureDrop />
      </RegistryProvider>,
    );
    expect(screen.getByText(/Não significa/i)).toBeInTheDocument();
    expect(screen.getByText(/AIPFIT: não solicitado por padrão/i)).toBeInTheDocument();
  });
});

/* ============ UI Captura Rápida (fail-closed + teclado + reduced motion) ============ */

describe("Captura Rápida (UI)", () => {
  it("sem gateway: captura vira LOCAL_DRAFT preservado — nunca receipt de servidor falso", async () => {
    render(
      <RegistryProvider>
        <TreasureDrop />
      </RegistryProvider>,
    );
    fireEvent.change(screen.getByLabelText(/pensamento ou observação bruta/i), { target: { value: "Abiu" } });
    fireEvent.submit(screen.getByRole("form", { name: /captura rápida/i }));
    await waitFor(() => expect(loadLocalDrops().length).toBe(1));
    expect(loadLocalDrops()[0].status).toBe("LOCAL_DRAFT");
    expect(screen.getByText(/Preservado localmente como LOCAL_DRAFT/i)).toBeInTheDocument();
    expect(screen.queryByTestId("receipt-block")).toBeNull();
    expect(screen.getByText(/Sem receipt de servidor/i)).toBeInTheDocument();
  });

  it("captura vazia é bloqueada com aviso visível (role=alert)", () => {
    render(
      <RegistryProvider>
        <TreasureDrop />
      </RegistryProvider>,
    );
    fireEvent.submit(screen.getByRole("form", { name: /captura rápida/i }));
    expect(screen.getByRole("alert").textContent).toMatch(/ao menos/i);
    expect(loadLocalDrops().length).toBe(0);
  });

  it("renderiza sob prefers-reduced-motion sem quebrar", () => {
    const original = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (q: string) => ({ matches: true, media: q, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false }),
    });
    render(
      <RegistryProvider>
        <TreasureDrop />
      </RegistryProvider>,
    );
    expect(screen.getByRole("form", { name: /captura rápida/i })).toBeInTheDocument();
    Object.defineProperty(window, "matchMedia", { writable: true, value: original });
  });
});

/* ============ 18–22 · privacidade + triagem sem cânone ============ */

describe("Triage Workbench", () => {
  const adapterWith = (drop: LocalDrop) => new LocalTriageAdapter([drop]);

  it("a triagem NUNCA sobrescreve a fonte bruta", () => {
    const a = adapterWith(baseDrop({ payload: basePayload({ raw_content: "Abiu" }) }));
    const item = a.list().find((i) => i.origin === "local-drop")!;
    a.setLayer(item.id, { ...item.triage, tentativeTags: ["HYPOTHESIS"], note: "interpretação do triador" });
    const after = a.list().find((i) => i.id === item.id)!;
    expect(after.rawContent).toBe("Abiu");
    expect(after.triage.tentativeTags).toEqual(["HYPOTHESIS"]);
  });

  it("UNCLASSIFIED é válido e destinos/ponteiros múltiplos são permitidos", () => {
    const a = adapterWith(baseDrop());
    const item = a.list().find((i) => i.origin === "local-drop")!;
    a.setLayer(item.id, { ...item.triage, destinations: ["UNCLASSIFIED", "NEEDS_SOURCE_CHECK"], thematicPointers: ["SOCIOBIOECONOMIA", "EVIDENCIAS_FONTES"] });
    const after = a.list().find((i) => i.id === item.id)!;
    expect(after.triage.destinations).toContain("UNCLASSIFIED");
    expect(after.triage.thematicPointers.length).toBe(2);
  });

  it("a triagem não muta o Registry vivo — candidatos são objetos novos", () => {
    const before = REGISTRY.map((r) => r.id).join(",");
    const a = adapterWith(baseDrop());
    const item = a.list().find((i) => i.origin === "local-drop")!;
    const cand = buildCandidateRecord(item);
    handoffCandidateToDiff(item);
    handoffCandidateToIntake(item);
    expect(REGISTRY.map((r) => r.id).join(",")).toBe(before);
    expect(REGISTRY.some((r) => r.id === cand.id)).toBe(false);
    expect(cand.lifecycle).toBe("DRAFT_PROPOSAL");
  });

  it("handoffs escrevem fragmento (Diff) e prefill (Intake) com foco correto", () => {
    const a = adapterWith(baseDrop());
    const item = a.list().find((i) => i.origin === "local-drop")!;
    handoffCandidateToDiff(item);
    expect(JSON.parse(sessionStorage.getItem(FRAGMENT_KEY)!).schema).toBe("hui.constellation.snapshot/v1");
    expect(sessionStorage.getItem(LENS_FOCUS_KEY)).toBe("snapshot");
    handoffCandidateToIntake(item);
    const prefill = JSON.parse(sessionStorage.getItem(PREFILL_KEY)!);
    expect(prefill.canonicalName).toContain("Abiu");
    expect(prefill.lifecycle).toBe("DRAFT_PROPOSAL");
  });

  it("conteúdo sensível nunca vira âncora/export; máscara aplicada", () => {
    expect(maskUnlessPublic("segredo", "SENSITIVE_PRIVATE")).toMatch(/protegido/);
    expect(maskUnlessPublic("público", "PUBLIC_SAFE")).toBe("público");

    const d = baseDrop({ payload: basePayload({ raw_content: "relato sensível", external_uri: "https://privado.example/x", sensitivity: "RESTRICTED" }) });
    const a = adapterWith(d);
    const item = a.list().find((i) => i.origin === "local-drop")!;
    const cand = buildCandidateRecord(item);
    expect(cand.externalUrl).toBeUndefined();
    expect(cand.description).not.toContain("privado.example");
    expect(cand.description).toMatch(/protegido/);
    expect(cand.sourceRefs[0].safeUrl).toBeUndefined();
  });

  it("UI: fila representativa rotulada, item sensível mascarado, candidato sem adoção, pergunta via Enter", async () => {
    render(
      <RegistryProvider>
        <TriageWorkbench />
      </RegistryProvider>,
    );
    expect(screen.getByText(/fila representativa/i)).toBeInTheDocument();

    const sensivel = screen.getByRole("button", { name: /conteúdo protegido/i });
    fireEvent.click(sensivel);
    /* camada bruta mascarada + nenhuma âncora no detalhe do item sensível */
    expect(screen.getByText(/intocável pela triagem/i)).toBeInTheDocument();
    const detalhe = screen.getByRole("region", { name: /Detalhe do item em triagem/i });
    for (const a of Array.from(detalhe.querySelectorAll("a[href]"))) {
      expect(a.getAttribute("href")).not.toContain("example.org");
    }
    expect(detalhe.textContent).toMatch(/conteúdo protegido/);

    fireEvent.click(screen.getByRole("button", { name: /criar candidato estruturado/i }));
    expect(await screen.findByText(/candidato criado · sem adoção/i)).toBeInTheDocument();

    const q = screen.getByLabelText(/nova pergunta de acompanhamento/i);
    fireEvent.change(q, { target: { value: "O que Sergio quer dizer com isto?" } });
    fireEvent.keyDown(q, { key: "Enter" });
    expect(await screen.findByText("O que Sergio quer dizer com isto?")).toBeInTheDocument();
  });

  it("camada bruta e estados fixados permanecem visíveis no detalhe", () => {
    render(
      <RegistryProvider>
        <TriageWorkbench />
      </RegistryProvider>,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /representativo/i })[0]);
    expect(screen.getByText(/Camada 1 · fonte bruta/i)).toBeInTheDocument();
    expect(screen.getByText(/Camada 2 · interpretação secundária/i)).toBeInTheDocument();
  });
});

/* ============ 25–26 · rotas ============ */

describe("rotas", () => {
  it("#/captura carrega a Captura Rápida", async () => {
    window.location.hash = "#/captura";
    render(<App />);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: /Captura Rápida/i })).toBeInTheDocument(), { timeout: 6000 });
    expect(screen.getByText(/capture agora · estruture depois/i)).toBeInTheDocument();
  });

  it("#/triage carrega o Triage Workbench", async () => {
    window.location.hash = "#/triage";
    render(<App />);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: /Triage Workbench/i })).toBeInTheDocument(), { timeout: 6000 });
  });

  it("registro dos tools entra no registry e fica buscável", () => {
    expect(REGISTRY.some((r) => r.id === "tool-treasure-drop")).toBe(true);
    expect(REGISTRY.some((r) => r.id === "tool-triage-workbench")).toBe(true);
  });

  it("fromLocalDrop preserva idempotência como identidade do item", () => {
    const d = baseDrop();
    expect(fromLocalDrop(d).id).toBe(`ti-${d.key}`);
  });
});
