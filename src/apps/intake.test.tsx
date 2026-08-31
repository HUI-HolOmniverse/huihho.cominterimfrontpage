/* Intake Studio — modelo, validação, persistência e handoff (jsdom) */
import { describe, expect, it, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import IntakeStudio from "./IntakeStudio";
import SnapshotTool from "./SnapshotTool";
import LensPage from "../LensPage";
import { RegistryProvider } from "../registry/Inspector";
import { validateRegistry } from "../registry/model";
import { REGISTRY } from "../registry/queries";
import { diffSnapshots } from "../registry/diff";
import {
  emptyDraft,
  draftToRecord,
  validateDraft,
  blockFails,
  exportFragment,
  loadDrafts,
  saveDrafts,
  upsertDraft,
  handoffToDiff,
  FRAGMENT_KEY,
  LENS_FOCUS_KEY,
  type IntakeDraft,
} from "./intakeModel";

afterEach(cleanup);
beforeEach(() => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    /* sem storage — testes de persistência pulam */
  }
});

function validDraft(): IntakeDraft {
  const d = emptyDraft();
  return {
    ...d,
    canonicalName: "Arquivo de Sementes Comunitárias",
    description: "Repositório predecessor com acervo de sementes crioulas e registros de troca comunitária.",
    sourceRefs: [
      {
        ...d.sourceRefs[0],
        label: "HUI-Mater-Core · Issue #97",
        sourceClass: "github-private",
        access: "restricted",
        safeUrl: "",
        observedAt: "2026-08-30",
        whyWeBelieveThis: "Referenciado em issue pública do repositório-mãe; corpo privado não exposto.",
      },
    ],
    lifecycle: "PREDECESSOR",
    currentness: "predecessor",
    rung: 2,
    basis: "Registro histórico com observação datada; sem deploy próprio.",
    positiveNote: "Preserva o padrão de provenance comunitária que a arquitetura de participação pretende escalar.",
  };
}

describe("intakeModel", () => {
  it("rascunho vazio é bloqueado com clareza — nada passa silencioso", () => {
    const fails = blockFails(validateDraft(emptyDraft()));
    expect(fails.length).toBeGreaterThanOrEqual(3);
    expect(fails.some((f) => f.id === "name")).toBe(true);
    expect(fails.some((f) => f.id === "note")).toBe(true);
  });

  it("rascunho válido gera registro sanitizado que valida limpo", () => {
    const rec = draftToRecord(validDraft());
    expect(validateRegistry([rec])).toEqual([]);
    expect(rec.id.startsWith("intake-")).toBe(true);
    expect(rec.positiveNote.trim().length).toBeGreaterThan(0);
  });

  it("CURRENT sem evidência suficiente é bloqueado com sugestão de rebaixamento", () => {
    const d = { ...validDraft(), lifecycle: "CURRENT", rung: 2 };
    const cur = validateDraft(d).find((c) => c.id === "current")!;
    expect(cur.ok).toBe(false);
    expect(cur.detail).toMatch(/DEPLOYED_READBACK_PENDING/);
  });

  it("URL nunca acompanha material protegido — na validação e na conversão", () => {
    const d = validDraft();
    d.sourceRefs[0].safeUrl = "https://segredo-interno.example/repo";
    const urlCheck = validateDraft(d).find((c) => c.id === "src-0-url")!;
    expect(urlCheck.ok).toBe(false);
    const rec = draftToRecord(d);
    expect(rec.sourceRefs[0].safeUrl).toBeUndefined();
  });

  it("fragmento exportado é snapshot/v1 consumível pelo Snapshot Diff", () => {
    const frag = exportFragment(validDraft());
    expect(frag.schema).toBe("hui.constellation.snapshot/v1");
    expect(validateRegistry(frag.records)).toEqual([]);
    const diff = diffSnapshots(REGISTRY, frag.records);
    expect(diff.counts.added).toBe(1);
    expect(diff.entries.find((e) => e.kind === "added")?.id).toBe(frag.records[0].id);
  });

  it("persistência local faz round-trip de rascunhos", () => {
    const d = validDraft();
    upsertDraft(d);
    const list = loadDrafts();
    expect(list.some((x) => x.id === d.id)).toBe(true);
    saveDrafts([]);
    expect(loadDrafts()).toEqual([]);
  });
});

describe("Intake Studio (UI)", () => {
  it("renderiza trilho, validação viva e pré-visualização com id em formação", () => {
    render(
      <RegistryProvider>
        <IntakeStudio />
      </RegistryProvider>,
    );
    expect(screen.getByRole("heading", { level: 1, name: /Intake Studio/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Etapas do intake/i })).toBeInTheDocument();
    expect(screen.getByText(/validação viva/i)).toBeInTheDocument();
    expect(screen.getByText(/registro em formação/i)).toBeInTheDocument();
    expect(screen.getByText(/intake-/)).toBeInTheDocument();
  });

  it("nomear o rascunho derruba bloqueios e autosave registra o rascunho", async () => {
    render(
      <RegistryProvider>
        <IntakeStudio />
      </RegistryProvider>,
    );
    const name = screen.getByPlaceholderText(/ex.: Arquivo de Sementes/i);
    fireEvent.change(name, { target: { value: "Arquivo de Sementes Comunitárias" } });
    await waitFor(() => expect(loadDrafts().length).toBe(1), { timeout: 2000 });
    expect(loadDrafts()[0].canonicalName).toBe("Arquivo de Sementes Comunitárias");
  });

  it("rascunho válido carregado habilita gerar fragmento e o handoff escreve as chaves de sessão", () => {
    upsertDraft(validDraft());
    render(
      <RegistryProvider>
        <IntakeStudio />
      </RegistryProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Arquivo de Sementes Comunitárias/ }));
    /* ir direto à revisão */
    fireEvent.click(screen.getByRole("button", { name: /^Revisão$/ }));
    const generate = screen.getByRole("button", { name: /gerar fragmento público-seguro/i });
    expect(generate).not.toBeDisabled();
    fireEvent.click(generate);
    /* o JSON gerado traz o id sanitizado do rascunho — só existe no resultado */
    expect(screen.getByText(/"id": "intake-arquivo-de-sementes/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /abrir no Snapshot Diff/i }));
    expect(sessionStorage.getItem(FRAGMENT_KEY)).toContain("hui.constellation.snapshot/v1");
    expect(sessionStorage.getItem(LENS_FOCUS_KEY)).toBe("snapshot");
  });

  it("rascunho bloqueado mantém o botão de geração desabilitado", () => {
    render(
      <RegistryProvider>
        <IntakeStudio />
      </RegistryProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Revisão$/ }));
    expect(screen.getByRole("button", { name: /resolver \d+ bloqueio/ })).toBeDisabled();
  });
});

describe("handoff recebido", () => {
  it("Snapshot Diff pré-carrega o fragmento do Intake Studio e diffa automaticamente", async () => {
    handoffToDiff(exportFragment(validDraft()));
    render(<SnapshotTool />);
    expect(await screen.findByText(/adicionado · 1/)).toBeInTheDocument();
    expect(screen.getByText(/fragmento do Intake Studio/)).toBeInTheDocument();
    /* a chave é consumida uma única vez */
    expect(sessionStorage.getItem(FRAGMENT_KEY)).toBeNull();
  });

  it("Lentes abrem na aba Snapshot quando há foco de handoff", () => {
    sessionStorage.setItem(LENS_FOCUS_KEY, "snapshot");
    render(
      <RegistryProvider>
        <LensPage />
      </RegistryProvider>,
    );
    expect(screen.getByRole("button", { name: "Snapshot" })).toHaveAttribute("aria-pressed", "true");
  });
});
