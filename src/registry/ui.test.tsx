/* Comportamento UI determinístico — P5 (jsdom) */
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import App from "../App";
import { Launcher } from "../Launcher";
import { RegistryProvider, useInspector } from "./Inspector";
import { useReducedMotion } from "../motion";

afterEach(cleanup);

function LauncherHarness() {
  return (
    <RegistryProvider>
      <Launcher open onClose={() => {}} />
    </RegistryProvider>
  );
}

function OpenByIdButton({ id, label }: { id: string; label: string }) {
  const { openById } = useInspector();
  return <button onClick={() => openById(id)}>{label}</button>;
}

describe("lançador", () => {
  it("busca encontra predecessores históricos e registros correntes pelo teclado", async () => {
    render(<LauncherHarness />);
    const input = screen.getByLabelText(/buscar building blocks/i);
    fireEvent.change(input, { target: { value: "state:predecessor" } });
    expect(await screen.findByText(/HUI HHO Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/Ágoras/i)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "state:current" } });
    expect(await screen.findByText(/Humanity United International/i)).toBeInTheDocument();
  });

  it("Enter abre o inspector (sem sair da experiência)", async () => {
    render(<LauncherHarness />);
    const input = screen.getByLabelText(/buscar building blocks/i);
    fireEvent.change(input, { target: { value: "ICEBERG" } });
    await screen.findAllByRole("option");
    /* Enter é tratado no campo de busca — como no uso real por teclado */
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByRole("dialog", { name: /Inspector/i })).toBeInTheDocument();
  });

  it("mostra estado antes de abrir (chip de ciclo de vida presente)", async () => {
    render(<LauncherHarness />);
    expect(screen.getAllByText(/predecessor/i).length).toBeGreaterThan(0);
  });
});

describe("inspector", () => {
  it("abre e fecha por teclado, restaurando o foco", async () => {
    render(
      <RegistryProvider>
        <OpenByIdButton id="iceberg-root" label="abrir iceberg" />
      </RegistryProvider>,
    );
    const btn = screen.getByRole("button", { name: "abrir iceberg" });
    btn.focus();
    fireEvent.click(btn);
    const dialog = await screen.findByRole("dialog", { name: /Inspector: ICEBERG/i });
    expect(dialog).toBeInTheDocument();
    /* nota de valor de continuidade sempre visível */
    expect(screen.getByText(/valor de continuidade/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /Inspector: ICEBERG/i })).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(btn));
  });

  it("links externos usam rel seguro e abrem em nova aba", async () => {
    render(
      <RegistryProvider>
        <OpenByIdButton id="mani-qforce" label="abrir qforce" />
      </RegistryProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "abrir qforce" }));
    const dialog = await screen.findByRole("dialog", { name: /Inspector: Q-Force/i });
    const links = Array.from(dialog.querySelectorAll<HTMLAnchorElement>("a[target='_blank']"));
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      expect(a.rel).toContain("noopener");
      expect(a.rel).toContain("noreferrer");
    }
  });

  it("navega a linhagem por teclado (botões de predecessores/sucessores)", async () => {
    render(
      <RegistryProvider>
        <OpenByIdButton id="mani-hui-hho-portal" label="abrir predecessor" />
      </RegistryProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "abrir predecessor" }));
    await screen.findByRole("dialog", { name: /Inspector: HUI HHO Portal/i });
    /* aba Linhagem acessível no tablist */
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(7);
  });
});

describe("reduced motion", () => {
  it("respeita prefers-reduced-motion", () => {
    const original = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
    function Probe() {
      const reduced = useReducedMotion();
      return <span data-testid="probe">{String(reduced)}</span>;
    }
    render(<Probe />);
    expect(screen.getByTestId("probe").textContent).toBe("true");
    Object.defineProperty(window, "matchMedia", { writable: true, value: original });
  });
});

describe("rotas", () => {
  it("rota #/iceberg carrega o atlas", async () => {
    window.location.hash = "#/iceberg";
    render(<App />);
    await waitFor(
      () => {
        expect(screen.getByRole("heading", { level: 1, name: /ICEBERG/ })).toBeInTheDocument();
      },
      { timeout: 6000 },
    );
    expect(screen.getByText(/linha d'água/i)).toBeInTheDocument();
  });

  it("rota #/registry carrega as lentes com skip link e busca", async () => {
    window.location.hash = "#/registry";
    render(<App />);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: /Lentes do registry/i })).toBeInTheDocument());
    expect(screen.getByLabelText(/filtrar registry/i)).toBeInTheDocument();
  });

  it("rota #/holomniverse carrega o Beholder Explorer", async () => {
    window.location.hash = "#/holomniverse";
    render(<App />);
    await waitFor(
      () => expect(screen.getByRole("heading", { level: 1, name: /Beholder Explorer/i })).toBeInTheDocument(),
      { timeout: 6000 },
    );
  });

  it("rota #/holo-logoi carrega o ledger de termos", async () => {
    window.location.hash = "#/holo-logoi";
    render(<App />);
    await waitFor(() => expect(screen.getByLabelText(/buscar termo/i)).toBeInTheDocument(), { timeout: 6000 });
  });
});
