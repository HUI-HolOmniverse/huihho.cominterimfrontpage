/* Ferramentas P0 — Explorer, Holo-Logoi, Snapshot Diff (jsdom) */
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import Explorer from "./apps/Explorer";
import Logoi from "./apps/Logoi";
import SnapshotTool from "./apps/SnapshotTool";
import { RegistryProvider } from "./registry/Inspector";
import { REGISTRY } from "./registry/queries";
import { LOGOI_TERMS } from "./apps/logoiTerms";

afterEach(cleanup);

describe("Beholder Explorer", () => {
  it("abre em ROOT com todas as famílias e navega por teclado (↓, ↵, esc)", async () => {
    render(
      <RegistryProvider>
        <Explorer />
      </RegistryProvider>,
    );
    const familyCount = new Set(REGISTRY.map((r) => r.family)).size;
    const rootList = screen.getByRole("list", { name: /Hólons de Constelação HUI/i });
    const rows = rootList.querySelectorAll("button[data-row]");
    expect(rows.length).toBe(familyCount);
    expect(rows[0].getAttribute("aria-pressed")).toBe("true");

    // ↓ move o ativo
    fireEvent.keyDown(rootList, { key: "ArrowDown" });
    expect(rows[1].getAttribute("aria-pressed")).toBe("true");

    // ↵ mergulha para DOMAIN
    fireEvent.keyDown(rootList, { key: "Enter" });
    const domainList = await screen.findByRole("list", { name: /Hólons de /i });
    expect(domainList).toBeInTheDocument();

    // esc emerge de volta a ROOT
    fireEvent.keyDown(domainList, { key: "Escape" });
    await screen.findByRole("list", { name: /Hólons de Constelação HUI/i });
  });

  it("chega a TOPIC, mostra o registro e abre o inspector", async () => {
    render(
      <RegistryProvider>
        <Explorer />
      </RegistryProvider>,
    );
    const rootList = screen.getByRole("list", { name: /Hólons de Constelação HUI/i });
    fireEvent.keyDown(rootList, { key: "Enter" }); // → DOMAIN
    const domainList = await screen.findByRole("list", { name: /Hólons de /i });
    fireEvent.keyDown(domainList, { key: "Enter" }); // → TOPIC

    const topicList = await screen.findByRole("list", { name: /Hólons de /i });
    expect(topicList).toBeInTheDocument();
    // painel do registro em foco
    expect(await screen.findByText(/registro em foco/i)).toBeInTheDocument();

    const inspect = screen.getByRole("button", { name: /inspecionar bloco/i });
    fireEvent.click(inspect);
    expect(await screen.findByRole("dialog", { name: /Inspector/i })).toBeInTheDocument();
  });

  it("anota a separação entre projeção visual e autoridade", () => {
    render(
      <RegistryProvider>
        <Explorer />
      </RegistryProvider>,
    );
    expect(screen.getByText(/projeção do observador/i)).toBeInTheDocument();
    expect(screen.getByText(/HOS_RESEARCH ≠ FIRST_CYCLE_CANON/i)).toBeInTheDocument();
  });

  it("reduced motion: projeção permanece estática e o teclado continua operante", () => {
    const original = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (q: string) => ({
        matches: true,
        media: q,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
    render(
      <RegistryProvider>
        <Explorer />
      </RegistryProvider>,
    );
    /* sem loop de animação, a leitura do observador nunca sai do zero */
    expect(screen.getByText(/x 0\.00 · y 0\.00/)).toBeInTheDocument();
    const rootList = screen.getByRole("list", { name: /Hólons de Constelação HUI/i });
    fireEvent.keyDown(rootList, { key: "ArrowDown" });
    fireEvent.keyDown(rootList, { key: "Enter" });
    expect(screen.getByText(/x 0\.00 · y 0\.00/)).toBeInTheDocument();
    Object.defineProperty(window, "matchMedia", { writable: true, value: original });
  });
});

describe("Holo-Logoi", () => {
  it("mostra o termo inicial com definição, base da crença e valor de continuidade", () => {
    render(
      <RegistryProvider>
        <Logoi />
      </RegistryProvider>,
    );
    const first = LOGOI_TERMS[0];
    expect(screen.getByRole("heading", { level: 2, name: first.term })).toBeInTheDocument();
    expect(screen.getByText(/base da crença/i)).toBeInTheDocument();
    expect(screen.getByText(/valor de continuidade/i)).toBeInTheDocument();
  });

  it("busca filtra termos e a seleção atualiza o detalhe", async () => {
    render(
      <RegistryProvider>
        <Logoi />
      </RegistryProvider>,
    );
    const input = screen.getByLabelText(/buscar termo/i);
    fireEvent.change(input, { target: { value: "iceberg" } });
    const btn = screen.getByRole("button", { name: /ICEBERG/i });
    fireEvent.click(btn);
    expect(screen.getByRole("heading", { level: 2, name: "ICEBERG" })).toBeInTheDocument();
    expect(screen.getByText(/primeiro evento ontogônico/i)).toBeInTheDocument();
  });

  it("todo termo carrega linhagem e estado controlado", () => {
    for (const t of LOGOI_TERMS) {
      expect(t.lineage.length, `${t.term} sem linhagem`).toBeGreaterThan(0);
      expect(t.positiveNote.trim().length, `${t.term} sem positiveNote`).toBeGreaterThan(0);
      expect(t.rung).toBeGreaterThanOrEqual(0);
      expect(t.rung).toBeLessThanOrEqual(6);
    }
  });
});

describe("Snapshot Diff", () => {
  it("exemplo contra a base: tudo inalterado, zero adições", async () => {
    render(<SnapshotTool />);
    fireEvent.click(screen.getByRole("button", { name: /carregar exemplo/i }));
    expect(await screen.findByText(new RegExp(`inalterados · ${REGISTRY.length}`))).toBeInTheDocument();
    expect(screen.getByText(/adicionado · 0/)).toBeInTheDocument();
  });

  it("variante sintética rotulada: adição + reclassificação visíveis", async () => {
    render(<SnapshotTool />);
    fireEvent.click(screen.getByRole("button", { name: /simular variação/i }));
    expect(await screen.findByText(/adicionado · 1/)).toBeInTheDocument();
    expect(screen.getByText(/reclassificado · \d+/)).toBeInTheDocument();
    expect(screen.getByText(/ausente · retido · 2/)).toBeInTheDocument();
  });

  it("JSON inválido falha com segurança, com aviso e sem diff", async () => {
    render(<SnapshotTool />);
    const ta = screen.getByPlaceholderText(/hui\.constellation\.snapshot/);
    fireEvent.change(ta, { target: { value: "isto não é json" } });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/adicionado ·/)).toBeNull();
  });

  it("entrada colada com registro restrito nunca expõe URL protegida", async () => {
    render(<SnapshotTool />);
    const payload = JSON.stringify([
      {
        id: "x-restrito",
        canonicalName: "Item restrito",
        kind: "experiment",
        family: "HUI",
        description: "d",
        lifecycle: "HELD",
        currentness: "held",
        evidence: { rung: 0, basis: "b" },
        positiveNote: "n",
        sourceRefs: [{ id: "s", sourceClass: "github-private", label: "privado", role: "primary", access: "restricted", safeUrl: "https://segredo.example", whyWeBelieveThis: "w" }],
      },
    ]);
    const ta = screen.getByPlaceholderText(/hui\.constellation\.snapshot/);
    fireEvent.change(ta, { target: { value: payload } });
    expect(await screen.findByText(/adicionado · 1/)).toBeInTheDocument();
    /* o JSON colado vive apenas no campo de entrada — nada atravessa para o resultado */
    const resultado = screen.getByLabelText("Resultado do diff");
    expect(resultado.textContent).not.toContain("segredo.example");
    /* e nenhuma âncora renderizada aponta para material protegido */
    expect(document.querySelector("a[href*='segredo']")).toBeNull();
  });
});
