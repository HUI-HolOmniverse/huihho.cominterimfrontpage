/* Fractal tree + snapshot diff — invariantes determinísticos (P0) */
import { describe, expect, it } from "vitest";
import { SEED_RECORDS } from "./registry";
import { buildFractalTree, nodeAtPath, pathLabels, fractalInvariants } from "./fractal";
import { diffSnapshots, makeSyntheticVariant, publicSafeSnapshot } from "./diff";
import { sanitizeRecord } from "./model";

const tree = buildFractalTree(SEED_RECORDS);

describe("árvore fractal", () => {
  it("ROOT cobre todas as famílias e todo registro é alcançável como TOPIC", () => {
    const families = new Set(SEED_RECORDS.map((r) => r.family));
    expect(tree.level).toBe("ROOT");
    expect(tree.children.length).toBe(families.size);
    expect(fractalInvariants(tree, SEED_RECORDS)).toEqual([]);
  });

  it("PROVENANCE espelha as sourceRefs de cada registro", () => {
    for (const domain of tree.children) {
      for (const topic of domain.children) {
        const rec = SEED_RECORDS.find((r) => r.id === topic.recordId)!;
        expect(topic.children.length).toBe(rec.sourceRefs.length);
        for (const prov of topic.children) {
          expect(prov.level).toBe("PROVENANCE");
          expect(prov.sourceRef).toBeDefined();
        }
      }
    }
  });

  it("caminho desconhecido falha com segurança (null), nunca fabrica nó", () => {
    expect(nodeAtPath(tree, ["root", "nao-existe"])).toBeNull();
    expect(nodeAtPath(tree, ["root"])).toBe(tree);
    expect(pathLabels(tree, ["root", "zzz"]).length).toBe(1);
  });
});

describe("snapshot diff", () => {
  it("base contra si mesma: zero adições, tudo inalterado", () => {
    const d = diffSnapshots(SEED_RECORDS, SEED_RECORDS.map((r) => ({ ...r })));
    expect(d.counts.added).toBe(0);
    expect(d.counts.reclassified).toBe(0);
    expect(d.counts["absent-retained"]).toBe(0);
    expect(d.counts.unchanged).toBe(SEED_RECORDS.length);
  });

  it("variante sintética: adição rotulada + reclassificação + ausências retidas", () => {
    const d = diffSnapshots(SEED_RECORDS, makeSyntheticVariant(SEED_RECORDS));
    expect(d.counts.added).toBe(1);
    expect(d.counts.reclassified).toBeGreaterThanOrEqual(1);
    expect(d.counts["absent-retained"]).toBe(2); // dois últimos retirados da variante
    const added = d.entries.find((e) => e.kind === "added")!;
    expect(added.id).toBe("syn-incoming-demo");
    // ausência nunca vira apagamento
    for (const e of d.entries.filter((x) => x.kind === "absent-retained")) {
      expect(e.note).toMatch(/retido/i);
    }
  });

  it("entrada hostil/malformada falha com segurança, sem fabricar estado", () => {
    const hostile = [
      null,
      42,
      "texto",
      { id: "x-bad", lifecycle: "SUPER_LIVE", currentness: "eterno", evidence: { rung: NaN } },
      { id: "x-leak", sourceRefs: [{ id: "s", sourceClass: "github-private", label: "p", role: "primary", access: "restricted", safeUrl: "https://segredo.example/x" }] },
    ];
    const d = diffSnapshots(SEED_RECORDS, hostile as unknown[]);
    expect(d.counts.added).toBe(2);
    const leakEntry = d.entries.find((e) => e.id === "x-leak")!;
    expect(JSON.stringify(leakEntry)).not.toContain("segredo.example");
    const bad = d.entries.find((e) => e.id === "x-bad")!;
    expect(bad.kind).toBe("added");
    expect(bad.note).toMatch(/triagem/i);
  });

  it("export público-seguro nunca expõe URL de material protegido", () => {
    const seeded = sanitizeRecord({
      id: "x-mix",
      sourceRefs: [
        { id: "a", sourceClass: "github-private", label: "privado", role: "primary", access: "restricted", safeUrl: "https://interno.example", whyWeBelieveThis: "—" },
        { id: "b", sourceClass: "portal-html", label: "público", role: "primary", access: "public", safeUrl: "https://huihho.com", whyWeBelieveThis: "—" },
      ],
    });
    const snap = publicSafeSnapshot([seeded, ...SEED_RECORDS.slice(0, 2)], { source: "teste", generatedAt: "2026-08-30" });
    const json = JSON.stringify(snap);
    expect(json).not.toContain("interno.example");
    expect(json).toContain("huihho.com");
    expect(snap.schema).toBe("hui.constellation.snapshot/v1");
  });
});
