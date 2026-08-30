/* Deterministic registry invariants — P5 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Raiz do projeto — robusta a partir de qualquer cwd (incl. verifier/). */
function projectRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(dir, "index.html")) && existsSync(resolve(dir, "package.json"))) return dir;
    dir = resolve(dir, "..");
  }
  return process.cwd();
}
import { describe, expect, it } from "vitest";
import {
  LIFECYCLE,
  EVIDENCE_RUNGS,
  canBeCurrent,
  sanitizeRecord,
  validateRegistry,
  MIN_RUNG_FOR_CURRENT,
} from "./model";
import { SEED_RECORDS } from "./registry";
import { REGISTRY, REGISTRY_META, parseQuery, applyFilters, searchRecords } from "./queries";
import { publicSafeSnapshot } from "./diff";

describe("invariantes do registry", () => {
  it("ids únicos + positiveNote em todo bloco + vocabulário controlado", () => {
    const ids = SEED_RECORDS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of SEED_RECORDS) {
      expect(r.positiveNote.trim().length, `${r.id} sem positiveNote`).toBeGreaterThan(0);
      expect(LIFECYCLE, `${r.id} com lifecycle fora do vocabulário`).toContain(r.lifecycle);
      expect(r.evidence.rung).toBeGreaterThanOrEqual(0);
      expect(r.evidence.rung).toBeLessThan(EVIDENCE_RUNGS.length);
    }
    expect(validateRegistry(SEED_RECORDS)).toEqual([]);
  });

  it("nenhum bloco é CURRENT sem a evidência exigida pelo modelo", () => {
    const currents = SEED_RECORDS.filter((r) => r.lifecycle === "CURRENT");
    expect(currents.length).toBeGreaterThan(0);
    for (const r of currents) {
      expect(r.evidence.rung, `${r.id} CURRENT com rung baixo`).toBeGreaterThanOrEqual(MIN_RUNG_FOR_CURRENT);
      expect(canBeCurrent(r), `${r.id} CURRENT sem base observável`).toBe(true);
    }
  });

  it("material privado/restrito nunca expõe URL protegida", () => {
    for (const r of SEED_RECORDS) {
      for (const s of r.sourceRefs) {
        if (s.access !== "public") expect(s.safeUrl, `${r.id}/${s.id} vaza URL`).toBeUndefined();
      }
      if (r.externalUrl) {
        expect(["public-safe", "live-public"], `${r.id} externalUrl sem publicabilidade`).toContain(r.publicability);
        expect(r.externalUrl.startsWith("https://")).toBe(true);
      }
    }
  });

  it("HUI e HUI ICEBERG permanecem distintos (não-colapso)", () => {
    const hui = SEED_RECORDS.find((r) => r.id === "hui-meta")!;
    const ice = SEED_RECORDS.find((r) => r.id === "iceberg-root")!;
    expect(hui.id).not.toBe(ice.id);
    expect(hui.family).not.toBe(ice.family);
    expect(hui.aliases ?? []).not.toContain("ICEBERG");
    expect(ice.aliases ?? []).not.toContain("HUI");
  });

  it("estado malformado falha com segurança, nunca fabrica estado", () => {
    const weird = sanitizeRecord({
      id: "x-bogus",
      lifecycle: "SUPER_MEGA_LIVE" as never,
      currentness: "eterno" as never,
      evidence: { rung: NaN, basis: "" },
      positiveNote: "",
    });
    expect(weird.lifecycle).toBe("RESEARCH");
    expect(weird.currentness).toBe("unknown");
    expect(weird.evidence.rung).toBe(0);
    expect(weird.positiveNote.trim().length).toBeGreaterThan(0);
    /* CURRENT inventado sem lastro é rebaixado */
    const fake = sanitizeRecord({ id: "x-fake", lifecycle: "CURRENT", evidence: { rung: 1, basis: "achismo" } });
    expect(fake.lifecycle).not.toBe("CURRENT");
  });

  it("sanitize remove URL de fonte não pública", () => {
    const r = sanitizeRecord({
      id: "x-leak",
      sourceRefs: [{ id: "s1", sourceClass: "github-private", label: "privado", role: "primary", access: "restricted", safeUrl: "https://segredo.example", whyWeBelieveThis: "—" }],
    });
    expect(r.sourceRefs[0].safeUrl).toBeUndefined();
  });
});

describe("consultas", () => {
  it("parseQuery aceita comandos e texto livre, sem quebrar em malformados", () => {
    const p = parseQuery("state:predecessor family:iceberg convergência");
    expect(p.state).toBe("predecessor");
    expect(p.family).toBe("iceberg");
    expect(p.text).toBe("convergência");
    expect(() => parseQuery(":::: :::")).not.toThrow();
  });

  it("lançador encontra registros correntes E predecessores", () => {
    const pred = searchRecords("state:predecessor").map((r) => r.id);
    expect(pred).toContain("mani-hui-hho-portal");
    expect(pred).toContain("mani-agoras");
    const current = searchRecords("state:current").map((r) => r.id);
    expect(current).toContain("hui-meta");
  });

  it("filtros de estado/tipo/disponibilidade funcionam", () => {
    const tools = applyFilters(REGISTRY, parseQuery("type:tool")).map((r) => r.kind);
    expect(tools.length).toBeGreaterThan(0);
    expect(tools.every((k) => k === "tool")).toBe(true);
    const now = applyFilters(REGISTRY, parseQuery("available:now"));
    expect(now.length).toBeGreaterThan(0);
    for (const r of now) expect((r.capabilities ?? []).some((c) => c.availability === "now")).toBe(true);
    const gh = applyFilters(REGISTRY, parseQuery("source:github"));
    expect(gh.some((r) => r.id === "prototype-interim-frontpage")).toBe(true);
  });

  it("estado desconhecido não fabrica resultados — retorna vazio com segurança", () => {
    expect(() => searchRecords("state:zzz_eterno")).not.toThrow();
    expect(searchRecords("state:zzz_eterno").length).toBe(0);
  });

  it("adapter expõe metadado do snapshot público-seguro", () => {
    expect(REGISTRY_META.source.trim().length).toBeGreaterThan(0);
    expect(REGISTRY.length).toBeGreaterThanOrEqual(45);
  });
});

describe("proteção de publicação", () => {
  it("index.html mantém noindex,nofollow", () => {
    const html = readFileSync(resolve(projectRoot(), "index.html"), "utf-8");
    expect(html).toContain('name="robots"');
    expect(html).toContain("noindex, nofollow");
  });

  it("robots.txt mantém hold de indexação", () => {
    const robots = readFileSync(resolve(projectRoot(), "public/robots.txt"), "utf-8");
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Disallow: /");
  });

  it("export público-seguro valida limpo e nunca vaza URL restrita", () => {
    const snap = publicSafeSnapshot(REGISTRY, { source: "teste-determinístico", generatedAt: "2026-08-30" });
    expect(snap.schema).toBe("hui.constellation.snapshot/v1");
    expect(validateRegistry(snap.records)).toEqual([]);
    for (const r of snap.records) {
      for (const s of r.sourceRefs) {
        if (s.access !== "public") expect(s.safeUrl, `${r.id}/${s.id} vaza URL no export`).toBeUndefined();
      }
    }
  });
});
