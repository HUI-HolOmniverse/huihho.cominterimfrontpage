/* Ciclo Vivo — Lineage Graph · Work Ledger · Readback Console (jsdom) */
import { describe, expect, it, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import App from "../App";
import LineageGraph from "./LineageGraph";
import WorkLedger from "./WorkLedger";
import ReadbackConsole from "./ReadbackConsole";
import { RegistryProvider } from "../registry/Inspector";
import {
  LINEAGE_KINDS,
  LINEAGE_DASH,
  buildLineage,
  lineagePaths,
} from "./lineageModel";
import {
  WORK_ENTRIES,
  assertNoRankings,
  CONTRIBUTOR_ROLES,
} from "./workLedgerModel";
import {
  READBACK_STATES,
  TRANSITIONS,
  canTransition,
  exportEvidenceCandidate,
  loadReadbacks,
  SEED_READBACKS,
  type ReadbackRecord,
} from "./readbackModel";
import { REGISTRY } from "../registry/queries";
import { validateRegistry } from "../registry/model";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function projectRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    try {
      readFileSync(resolve(dir, "index.html"));
      return dir;
    } catch {
      dir = resolve(dir, "..");
    }
  }
  return process.cwd();
}

afterEach(cleanup);
beforeEach(() => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    /* sem storage */
  }
});

/* ---------------- lineage: tipos distintos, aresta ≠ cânone ---------------- */

describe("Lineage Graph — modelo", () => {
  it("os 6 tipos requeridos existem e permanecem distintos (traço próprio por tipo)", () => {
    const required = ["SOURCE_LINEAGE", "HUMAN_CO_CREATION_LINEAGE", "IMPLEMENTATION_LINEAGE", "ASSURANCE_LINEAGE", "DEPLOYMENT_LINEAGE", "READBACK_LINEAGE"];
    for (const k of required) {
      expect(LINEAGE_KINDS).toContain(k);
      expect(LINEAGE_DASH[k as keyof typeof LINEAGE_DASH], `tipo ${k} sem traço distinto`).toBeDefined();
    }
    const dashes = required.map((k) => LINEAGE_DASH[k as keyof typeof LINEAGE_DASH]);
    expect(new Set(dashes).size, "traços não distinguíveis sem cor").toBe(dashes.length);
  });

  it("aresta ≠ cânone: RELATED não implica dependência e CONTRADICTION não vira dependência", () => {
    const { edges } = buildLineage();
    const related = edges.filter((e) => e.kind === "RELATED");
    expect(related.length).toBeGreaterThan(0);
    for (const e of related) expect(e.label).toMatch(/não implica/i);
    const contra = edges.filter((e) => e.kind === "CONTRADICTION");
    expect(contra.length).toBeGreaterThan(0);
    for (const e of contra) expect(e.kind).toBe("CONTRADICTION"); /* nunca reclassificado como dependência */
    /* toda aresta usa somente o vocabulário controlado */
    for (const e of edges) expect(LINEAGE_KINDS).toContain(e.kind);
  });

  it("lifecycle e evidência permanecem separados nos nós", () => {
    const { nodes } = buildLineage();
    const registryNodes = nodes.filter((n) => n.kind === "registry");
    expect(registryNodes.length).toBe(REGISTRY.length);
    for (const n of registryNodes.slice(0, 20)) {
      expect(typeof n.lifecycle).toBe("string");
      expect(typeof n.rung).toBe("number");
    }
  });

  it("readbacks injetam arestas READBACK_LINEAGE sem duplicar", () => {
    const { edges } = buildLineage([{ id: "rb-suite79", targetId: "tool-treasure-drop", state: "OBSERVED" }]);
    const rbEdges = edges.filter((e) => e.kind === "READBACK_LINEAGE");
    expect(rbEdges.length).toBe(1);
    expect(rbEdges[0].to).toBe("tool-treasure-drop");
  });

  it("realce de caminhos alcança ancestrais e descendentes", () => {
    const { edges } = buildLineage();
    const path = lineagePaths("tool-triage-workbench", edges);
    expect(path.has("tool-treasure-drop")).toBe(true); /* predecessor */
    expect(path.has("tool-triage-workbench")).toBe(true);
  });
});

describe("Lineage Graph — UI", () => {
  it("renderiza o grafo E o fallback acessível em lista com navegação por teclado", async () => {
    render(
      <RegistryProvider>
        <LineageGraph />
      </RegistryProvider>,
    );
    expect(screen.getByRole("heading", { level: 1, name: /Lineage Graph/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Grafo de linhagem/i })).toBeInTheDocument();

    /* fallback acessível */
    const list = screen.getByRole("listbox", { name: /Arestas de linhagem/i });
    expect(list).toBeInTheDocument();
    const options = list.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThan(10);

    /* teclado: ↓ ↓ ↵ seleciona a aresta e realça nós */
    fireEvent.keyDown(list, { key: "ArrowDown" });
    fireEvent.keyDown(list, { key: "ArrowDown" });
    fireEvent.keyDown(list, { key: "Enter" });
    await waitFor(() => expect(screen.getByText(/nó selecionado/i)).toBeInTheDocument());
    expect(screen.getByText(/linhagens incidentes/i)).toBeInTheDocument();
  });

  it("reduced motion: renderiza sem animações e permanece funcional", () => {
    const original = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (q: string) => ({ matches: true, media: q, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false }),
    });
    render(
      <RegistryProvider>
        <LineageGraph />
      </RegistryProvider>,
    );
    expect(screen.getByRole("listbox", { name: /Arestas de linhagem/i })).toBeInTheDocument();
    Object.defineProperty(window, "matchMedia", { writable: true, value: original });
  });
});

/* ---------------- work ledger: papéis, SHAs, sem ranking ---------------- */

describe("Work Ledger", () => {
  it("SOURCE_SHARED_BY != AUTHOR nos registros Sérgio — e o papel jamais é autoria confirmada", () => {
    const sergio = WORK_ENTRIES.filter((w) => w.workType === "CO_CREATION_PATTERN");
    expect(sergio.length).toBeGreaterThan(0);
    for (const w of sergio) {
      expect(w.representative, `${w.workId} sem rótulo representativo`).toBe(true);
      for (const c of w.humanContributors) {
        expect(c.role).toBe("SOURCE_SHARED_BY");
        expect(c.attribution).not.toBe("AUTHOR_CONFIRMED");
        expect(c.attribution).not.toBe("COAUTHOR_CONFIRMED");
      }
      expect(w.authorshipState).not.toBe("AUTHOR_CONFIRMED");
    }
  });

  it("nenhum ranking/score/métrica reputacional em qualquer registro", () => {
    expect(assertNoRankings(WORK_ENTRIES)).toBe(true);
    const roles = CONTRIBUTOR_ROLES.join(" ");
    expect(roles).not.toMatch(/score|rank|karma/i);
  });

  it("SHAs: somente reais — onde não cunhado, o campo está ausente (não inventado)", () => {
    const withSha = WORK_ENTRIES.filter((w) => w.gitSha);
    expect(withSha.some((w) => w.gitSha === "9e6a2e10235787314aac162480e051f41d38b41c")).toBe(true);
    for (const w of WORK_ENTRIES) {
      if (w.gitSha) expect(w.gitSha).toMatch(/^[0-9a-f]{40}$/);
    }
  });

  it("UI: chip SOURCE_SHARED_BY ≠ AUTHOR visível, filtro funciona, conexões do ciclo presentes", () => {
    render(
      <RegistryProvider>
        <WorkLedger />
      </RegistryProvider>,
    );
    expect(screen.getByRole("heading", { level: 1, name: /Work Ledger/i })).toBeInTheDocument();
    /* seleciona registro Sérgio */
    fireEvent.click(screen.getByRole("button", { name: /Leiteria Vegetal/i }));
    expect(screen.getAllByText(/SOURCE_SHARED_BY ≠ AUTHOR/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Leiteria é produto, território ou ambos\?/i)).toBeInTheDocument();
    /* filtro por tipo */
    const typeSelect = screen.getByLabelText(/Filtrar por tipo de trabalho/i);
    fireEvent.change(typeSelect, { target: { value: "TOOL_BUILD" } });
    expect(screen.queryByRole("button", { name: /Leiteria Vegetal/i })).toBeNull();
  });
});

/* ---------------- readback: máquina ramificada, guardas, export ---------------- */

describe("Readback Console — modelo", () => {
  const base = (): ReadbackRecord => ({ ...SEED_READBACKS[0], id: "rb-x", evidencePointers: [], interpretation: "" });

  it("a máquina é ramificada: CONTRADICTED/UNRESOLVED são estados de primeira classe, não falhas", () => {
    expect(READBACK_STATES).toContain("CONTRADICTED");
    expect(READBACK_STATES).toContain("UNRESOLVED");
    expect(TRANSITIONS.OBSERVED).toContain("CONTRADICTED");
    expect(TRANSITIONS.OBSERVED).toContain("UNRESOLVED");
    expect(TRANSITIONS.VERIFIED).toContain("CONTRADICTED"); /* contradição posterior é legítima */
    expect(TRANSITIONS.CONTRADICTED).toContain("REPORTED"); /* reexame */
    expect(TRANSITIONS.UNRESOLVED).toContain("REPORTED");
  });

  it("OBSERVED nunca promove silenciosamente a VERIFIED", () => {
    const r = base();
    expect(canTransition(r, "VERIFIED").ok).toBe(false); /* fora da máquina */
    const corroborated = { ...r, state: "CORROBORATED" as const };
    const blocked = canTransition(corroborated, "VERIFIED");
    expect(blocked.ok).toBe(false); /* sem ponteiro de evidência */
    expect(blocked.reason).toMatch(/evidência/i);
    const withEvidence = { ...corroborated, evidencePointers: ["log"], interpretation: "interpretação registrada aqui" };
    expect(canTransition(withEvidence, "VERIFIED").ok).toBe(true);
  });

  it("export retorna SOMENTE EVIDENCE_CANDIDATE — nunca aceite; registry permanece imutável", () => {
    const before = REGISTRY.length;
    const frag = exportEvidenceCandidate(SEED_READBACKS[0]);
    expect(frag.schema).toBe("hui.constellation.snapshot/v1");
    const rec = frag.records[0];
    expect(rec.description).toMatch(/EVIDENCE_CANDIDATE/);
    expect(rec.description).toMatch(/READBACK ≠ ACCEPTANCE/);
    expect(rec.lifecycle).toBe("DRAFT_PROPOSAL");
    expect(rec.evidence.rung).toBe(0);
    expect(rec.unknowns).toContain("AIPFIT: REGISTRATION_NOT_REQUESTED");
    expect(validateRegistry(frag.records)).toEqual([]);
    expect(REGISTRY.length).toBe(before); /* nenhuma mutação do registry vivo */
  });
});

describe("Readback Console — UI", () => {
  it("registrar observação cria readback OBSERVED; transição guardada bloqueia VERIFIED com razão visível", async () => {
    render(
      <RegistryProvider>
        <ReadbackConsole />
      </RegistryProvider>,
    );
    expect(screen.getByRole("heading", { level: 1, name: /Readback Console/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/alvo \(registry ou livre\)/i), { target: { value: "hui-meta" } });
    fireEvent.change(screen.getByLabelText(/observador/i), { target: { value: "teste de ronda" } });
    fireEvent.change(screen.getByLabelText(/observação bruta/i), { target: { value: "observação registrada pelo teste" } });
    fireEvent.click(screen.getByRole("button", { name: /registrar como OBSERVED/i }));

    await screen.findByText(/Readback registrado como OBSERVED/i);
    fireEvent.click(screen.getByRole("button", { name: /alvo: HUI — Humanity United International/i }));

    /* VERIFIED a partir de OBSERVED: bloqueado com razão acessível */
    const verifiedBtn = screen.getByRole("button", { name: /mover para verificado — bloqueado/i });
    expect(verifiedBtn).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /mover para reportado/i }));
    await screen.findByText(/Estado movido para reportado/i);
  });

  it("submissão vazia é bloqueada com alerta (role=alert)", () => {
    render(
      <RegistryProvider>
        <ReadbackConsole />
      </RegistryProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /registrar como OBSERVED/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

/* ---------------- rotas + publicação ---------------- */

describe("rotas do Ciclo Vivo", () => {
  it("#/linhagem renderiza o Lineage Graph", async () => {
    window.location.hash = "#/linhagem";
    render(<App />);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: /Lineage Graph/i })).toBeInTheDocument(), { timeout: 6000 });
  });

  it("#/ledger renderiza o Work Ledger", async () => {
    window.location.hash = "#/ledger";
    render(<App />);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: /Work Ledger/i })).toBeInTheDocument(), { timeout: 6000 });
  });

  it("#/readback renderiza o Readback Console", async () => {
    window.location.hash = "#/readback";
    render(<App />);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: /Readback Console/i })).toBeInTheDocument(), { timeout: 6000 });
  });

  it("os 3 tools entram no registry e ficam buscáveis", () => {
    for (const id of ["tool-lineage-graph", "tool-work-ledger", "tool-readback-console"]) {
      const rec = REGISTRY.find((r) => r.id === id);
      expect(rec, `${id} ausente do registry`).toBeDefined();
      expect(rec!.route).toBeTruthy();
      expect(rec!.positiveNote.trim().length).toBeGreaterThan(0);
    }
    expect(validateRegistry(REGISTRY)).toEqual([]);
  });
});

describe("publicação & segurança", () => {
  it("noindex,nofollow permanece no index.html", () => {
    const html = readFileSync(resolve(projectRoot(), "index.html"), "utf-8");
    expect(html).toContain('name="robots"');
    expect(html).toContain("noindex, nofollow");
  });

  it("robots.txt mantém o hold de indexação", () => {
    const robots = readFileSync(resolve(projectRoot(), "public/robots.txt"), "utf-8");
    expect(robots).toContain("Disallow: /");
  });

  it("referência não público-segura não vira âncora no detalhe do readback", () => {
    render(
      <RegistryProvider>
        <ReadbackConsole />
      </RegistryProvider>,
    );
    /* semente com sourceIsPublic=false e sourceRef interno */
    fireEvent.click(screen.getByRole("button", { name: /Captura Rápida \/ Treasure Drop/i }));
    expect(screen.getByText(/referência não público-segura — não exibida como âncora/i)).toBeInTheDocument();
    const detalhe = screen.getByRole("article");
    for (const a of Array.from(detalhe.querySelectorAll("a[href]"))) {
      expect(a.getAttribute("href")).not.toContain("vitest-run.log");
    }
  });
});
