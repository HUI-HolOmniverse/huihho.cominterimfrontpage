/* ------------------------------------------------------------------ */
/*  Snapshot Diff · intake público-seguro de constelação (P0)          */
/*  Sem credenciais no browser: consome snapshot estático/gerado.      */
/* ------------------------------------------------------------------ */

import { useMemo, useRef, useState } from "react";
import { REGISTRY, REGISTRY_META } from "../registry/queries";
import { diffSnapshots, makeSyntheticVariant, publicSafeSnapshot, type DiffKind, type DiffResult } from "../registry/diff";
import type { BuildingBlockRecord } from "../registry/model";

const KIND_META: Record<DiffKind, { label: string; tone: string }> = {
  reclassified: { label: "reclassificado", tone: "border-ember-400/50 text-ember-300 bg-ember-400/8" },
  added: { label: "adicionado", tone: "border-lumen-500/50 text-lumen-300 bg-lumen-500/8" },
  changed: { label: "texto alterado", tone: "border-mist-500/40 text-mist-300 bg-mist-500/8" },
  "absent-retained": { label: "ausente · retido", tone: "border-gild-400/40 text-gild-300 bg-gild-400/8" },
  unchanged: { label: "inalterado", tone: "border-seam text-mist-500 bg-ink-950/40" },
};

export default function SnapshotTool() {
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<DiffResult | null>(null);
  const [error, setError] = useState("");
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [sourceLabel, setSourceLabel] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const runDiff = (incoming: unknown[], label: string) => {
    try {
      setResult(diffSnapshots(REGISTRY, incoming));
      setSourceLabel(label);
      setError("");
    } catch {
      setError("Entrada inválida — o diff falhou com segurança, nada foi alterado.");
      setResult(null);
    }
  };

  const onPaste = (text: string) => {
    setRaw(text);
    if (!text.trim()) {
      setResult(null);
      setError("");
      return;
    }
    try {
      const parsed = JSON.parse(text) as unknown;
      const arr = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && Array.isArray((parsed as { records?: unknown[] }).records)
          ? (parsed as { records: unknown[] }).records
          : null;
      if (!arr) throw new Error("formato");
      runDiff(arr, "JSON colado");
    } catch {
      setError("JSON inválido ou fora do formato hui.constellation.snapshot — nenhuma alteração aplicada.");
      setResult(null);
    }
  };

  const visible = useMemo(() => {
    if (!result) return [];
    return showUnchanged ? result.entries : result.entries.filter((e) => e.kind !== "unchanged");
  }, [result, showUnchanged]);

  const exportSnapshot = () => {
    const snap = publicSafeSnapshot(REGISTRY, { source: REGISTRY_META.source, generatedAt: new Date().toISOString().slice(0, 10) });
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
    if (typeof URL !== "undefined" && URL.createObjectURL) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hui-constellation-snapshot.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => onPaste(String(reader.result ?? ""));
    reader.readAsText(f);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      {/* entrada */}
      <div className="lg:col-span-5 space-y-5">
        <div className="rounded-lg border border-seam bg-ink-900/60 p-6">
          <h3 className="font-display text-xl font-medium text-mist-50">Receber snapshot</h3>
          <p className="text-[13px] text-mist-400 leading-relaxed mt-2.5">
            Cole um array de registros ou um objeto <span className="font-mono text-[11px] text-lumen-300">hui.constellation.snapshot/v1</span>.
            Toda entrada é <span className="text-gild-300">sanitizada antes do diff</span> — URLs de material protegido nunca atravessam.
          </p>

          <div className="flex flex-wrap gap-2.5 mt-5">
            <button
              onClick={() => { setRaw(""); runDiff(REGISTRY.map((r) => ({ ...r })), "snapshot de exemplo · base local"); }}
              className="px-4 py-2.5 rounded-md border border-lumen-500/50 bg-lumen-500/10 text-lumen-300 font-mono text-[10px] tracking-[0.14em] uppercase hover:bg-lumen-500/20 transition-all duration-200 cursor-pointer focus-ring"
            >
              carregar exemplo (base)
            </button>
            <button
              onClick={() => { setRaw(""); runDiff(makeSyntheticVariant(REGISTRY), "variante sintética rotulada · demonstração"); }}
              className="px-4 py-2.5 rounded-md border border-ember-400/50 bg-ember-400/10 text-ember-300 font-mono text-[10px] tracking-[0.14em] uppercase hover:bg-ember-400/20 transition-all duration-200 cursor-pointer focus-ring"
            >
              simular variação (sintético)
            </button>
            <button
              onClick={exportSnapshot}
              className="px-4 py-2.5 rounded-md border border-gild-400/50 bg-gild-400/10 text-gild-300 font-mono text-[10px] tracking-[0.14em] uppercase hover:bg-gild-400/20 transition-all duration-200 cursor-pointer focus-ring"
            >
              exportar público-seguro ↓
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2.5 rounded-md border border-seam text-mist-400 font-mono text-[10px] tracking-[0.14em] uppercase hover:text-mist-100 hover:border-seam-strong transition-all duration-200 cursor-pointer focus-ring"
            >
              abrir arquivo .json
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Arquivo de snapshot" />
          </div>

          <label className="block mt-5">
            <span className="font-mono text-[9px] tracking-[0.24em] uppercase text-mist-600">colar JSON</span>
            <textarea
              value={raw}
              onChange={(e) => onPaste(e.target.value)}
              rows={8}
              spellCheck={false}
              placeholder='{ "schema": "hui.constellation.snapshot/v1", "records": [ … ] }'
              className="mt-2 w-full rounded-md border border-seam bg-ink-950/80 px-4 py-3 font-mono text-[11px] text-mist-200 placeholder:text-mist-700 outline-none focus:border-lumen-500/50 transition-colors resize-y"
            />
          </label>

          {error && (
            <p role="alert" className="mt-3 rounded-md border border-ember-400/40 bg-ember-400/8 px-4 py-3 text-[13px] text-ember-300 leading-relaxed">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-seam bg-ink-950/60 px-6 py-5">
          <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-mist-600">contrato de intake</p>
          <ul className="mt-3 space-y-2 text-[13px] text-mist-400 leading-relaxed">
            <li className="flex gap-2.5"><span className="text-lumen-400 shrink-0">→</span> ausente ≠ apagado: itens fora do snapshot são <span className="text-gild-300">retidos</span></li>
            <li className="flex gap-2.5"><span className="text-lumen-400 shrink-0">→</span> adição ≠ adoção: itens novos exigem <span className="text-mist-200">triagem e rotulagem</span></li>
            <li className="flex gap-2.5"><span className="text-lumen-400 shrink-0">→</span> reclassificação exige evidência no próprio registro</li>
            <li className="flex gap-2.5"><span className="text-lumen-400 shrink-0">→</span> material protegido expõe presença + metadado seguro, nunca corpo</li>
          </ul>
        </div>
      </div>

      {/* resultado */}
      <div className="lg:col-span-7">
        {!result && (
          <div className="h-full min-h-[320px] grid place-items-center rounded-lg border border-dashed border-seam-strong bg-ink-900/30 p-10 text-center">
            <div>
              <svg viewBox="0 0 64 64" className="w-14 h-14 mx-auto text-mist-600" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <rect x="8" y="10" width="20" height="44" rx="3" />
                <rect x="36" y="10" width="20" height="44" rx="3" strokeDasharray="4 5" />
                <path d="M28 26h8M28 38h8" strokeLinecap="round" />
                <path d="M32 22.5 36 26l-4 3.5M32 34.5 36 38l-4 3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="font-display text-xl text-mist-400 mt-5">Nenhum diff em curso.</p>
              <p className="text-sm text-mist-500 mt-2 max-w-sm mx-auto leading-relaxed">
                Carregue o exemplo para ver a base contra si mesma, ou a variante sintética para ver reclassificações rotuladas.
              </p>
            </div>
          </div>
        )}

        {result && (
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              {(Object.keys(KIND_META) as DiffKind[]).filter((k) => k !== "unchanged").map((k) => (
                <span key={k} className={`px-3 py-1.5 rounded-full border font-mono text-[10px] tracking-[0.12em] uppercase ${KIND_META[k].tone}`}>
                  {KIND_META[k].label} · {result.counts[k]}
                </span>
              ))}
              <span className={`px-3 py-1.5 rounded-full border font-mono text-[10px] tracking-[0.12em] uppercase ${KIND_META.unchanged.tone}`}>
                inalterados · {result.counts.unchanged}
              </span>
            </div>
            <p className="font-mono text-[10px] text-mist-600 mt-3">
              {sourceLabel} · base {result.baseCount} · recebido {result.incomingCount}
            </p>

            <label className="flex items-center gap-2.5 mt-4 cursor-pointer w-max focus-ring rounded">
              <input
                type="checkbox"
                checked={showUnchanged}
                onChange={(e) => setShowUnchanged(e.target.checked)}
                className="accent-[#5fe3c8] w-4 h-4"
              />
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-mist-500">mostrar inalterados</span>
            </label>

            <ul className="mt-4 space-y-2" aria-label="Resultado do diff">
              {visible.map((e) => (
                <li key={`${e.id}-${e.kind}`} className="rounded-md border border-seam bg-ink-900/50 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <span className={`px-2.5 py-1 rounded-full border font-mono text-[9px] tracking-[0.12em] uppercase shrink-0 ${KIND_META[e.kind].tone}`}>
                    {KIND_META[e.kind].label}
                  </span>
                  <span className="text-sm text-mist-100 min-w-[160px]">{e.label}</span>
                  <span className="font-mono text-[10px] text-mist-600">{e.id}</span>
                  <span className="flex-1 basis-full sm:basis-auto text-[12px] text-mist-500">{e.note}</span>
                  {e.fields && e.fields.length > 0 && (
                    <span className="font-mono text-[9px] text-lumen-300/80">{e.fields.join(" · ")}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
