/* ------------------------------------------------------------------ */
/*  RegistryAdapter — o frontend consome um snapshot público-seguro,   */
/*  nunca credenciais ou repositórios privados diretamente.            */
/* ------------------------------------------------------------------ */

import { sanitizeRecord, validateRegistry, type BuildingBlockRecord } from "./model";
import { SEED_RECORDS } from "./registry";

export interface SnapshotMeta {
  source: string;
  generatedAt: string;
  sha?: string;
  note: string;
}

export interface RegistryAdapter {
  meta: SnapshotMeta;
  list(): BuildingBlockRecord[];
}

/** Snapshot estático gerado em build/tempo de desenvolvimento — seguro por construção. */
export class StaticSnapshotAdapter implements RegistryAdapter {
  meta: SnapshotMeta;
  private records: BuildingBlockRecord[];

  constructor(raw: Parameters<typeof sanitizeRecord>[0][], meta: SnapshotMeta) {
    /* fail-safe: sanitiza + valida; nunca fabrica estado. */
    this.records = raw.map((r) => sanitizeRecord(r));
    const problems = validateRegistry(this.records);
    if (problems.length > 0) {
      /* fail-safe: registra, nunca quebra a experiência */
      console.info("[hui-registry] avisos do snapshot:", problems);
    }
    this.meta = meta;
  }

  list(): BuildingBlockRecord[] {
    return this.records;
  }
}

/**
 * Futuro: SnapshotSnapshotAdapter consumindo o JSON gerado e governado do
 * HUI-Mater-Core (PR #111 / First Cycle) em /constellation-snapshot.json.
 * A UI não muda — apenas o adaptador. Nenhuma credencial chega ao browser.
 */
export async function loadConstellationSnapshot(url: string): Promise<RegistryAdapter> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`snapshot indisponível: ${res.status}`);
  const data = (await res.json()) as { meta: SnapshotMeta; records: Parameters<typeof sanitizeRecord>[0][] };
  return new StaticSnapshotAdapter(data.records, data.meta);
}

/** Adaptador ativo deste protótipo: seed local, público-seguro. */
export const activeAdapter: RegistryAdapter = new StaticSnapshotAdapter(
  SEED_RECORDS as unknown as Parameters<typeof sanitizeRecord>[0][],
  {
    source: "local-source · PR #1 seed",
    generatedAt: "2026-08-30",
    sha: "9e6a2e10235787314aac162480e051f41d38b41c",
    note: "Snapshot público-seguro. Material privado/restrito entra apenas como metadado seguro.",
  },
);
