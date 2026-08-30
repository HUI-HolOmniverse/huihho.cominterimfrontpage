/* ------------------------------------------------------------------ */
/*  Lançador HUI · Ctrl/Cmd K — busca + comando sobre o registry (P2)  */
/*  Estado visível antes de abrir · nada histórico fica invisível.     */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useRef, useState } from "react";
import { LIFECYCLE_LABEL, type BuildingBlockRecord } from "./registry/model";
import { searchRecords, REGISTRY } from "./registry/queries";
import { useInspector, LifecycleChip } from "./registry/Inspector";

const QUICK = [
  { label: "Todas", q: "" },
  { label: "type:tool", q: "type:tool" },
  { label: "type:route", q: "type:route" },
  { label: "type:manifestation", q: "type:manifestation" },
  { label: "state:current", q: "state:current" },
  { label: "state:predecessor", q: "state:predecessor" },
  { label: "state:prototype", q: "state:prototype" },
  { label: "evidence:verified", q: "evidence:verified" },
  { label: "source:github", q: "source:github" },
  { label: "available:now", q: "available:now" },
];

export function Launcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const { open: inspect } = useInspector();

  const items = useMemo(() => {
    const q = query.trim();
    return q ? searchRecords(q) : REGISTRY;
  }, [query]);

  useEffect(() => {
    if (open) {
      restoreRef.current = (document.activeElement as HTMLElement) ?? null;
      setQuery("");
      setActive(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 30);
      document.body.style.overflow = "hidden";
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
    restoreRef.current?.focus?.();
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const go = (it: BuildingBlockRecord) => {
    onClose();
    /* pequeno atraso para o foco voltar antes de abrir o inspector */
    window.setTimeout(() => inspect(it), 30);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (items.length ? (a + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (items.length ? (a - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      go(items[active]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[9vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Lançador de capacidades HUI"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-[6px]" onMouseDown={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl rounded-xl border border-seam-strong bg-ink-900/95 shadow-[0_30px_90px_rgba(0,0,0,0.65),0_0_60px_rgba(62,207,178,0.08)] overflow-hidden">
        {/* header */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-seam">
          <svg viewBox="0 0 20 20" className="w-4 h-4 text-lumen-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="M13.5 13.5 18 18" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Buscar blocos ou comandos — ex.: state:predecessor family:iceberg"
            className="flex-1 bg-transparent outline-none text-mist-50 placeholder:text-mist-600 font-body text-sm tracking-wide"
            aria-label="Buscar building blocks e comandos"
          />
          <span className="kbd">ESC</span>
        </div>

        {/* comandos rápidos */}
        <div className="flex gap-2 px-5 py-3 overflow-x-auto border-b border-seam [scrollbar-width:none]" role="group" aria-label="Filtros rápidos">
          {QUICK.map((c) => {
            const isActive = query.trim() === c.q;
            return (
              <button
                key={c.label}
                onClick={() => {
                  setQuery(c.q);
                  inputRef.current?.focus();
                }}
                className={`shrink-0 px-3 py-1.5 rounded-full border font-mono text-[10px] tracking-[0.1em] transition-all duration-200 cursor-pointer focus-ring ${
                  isActive
                    ? "bg-lumen-500/15 border-lumen-500/60 text-lumen-300 shadow-[0_0_18px_rgba(62,207,178,0.25)]"
                    : "border-seam text-mist-500 hover:text-mist-200 hover:border-seam-strong"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* resultados */}
        <div aria-live="polite" className="sr-only">
          {items.length} resultados
        </div>
        <ul ref={listRef} className="max-h-[42vh] overflow-y-auto py-2" role="listbox" aria-label="Resultados">
          {items.length === 0 && (
            <li className="px-6 py-10 text-center">
              <p className="font-mono text-xs tracking-[0.2em] text-mist-600 uppercase">nenhum bloco encontrado</p>
              <p className="text-sm text-mist-500 mt-2">Nenhum artefato histórico é ocultado — ajuste o comando e tente de novo.</p>
            </li>
          )}
          {items.map((it, i) => (
            <li key={it.id} data-idx={i} role="option" aria-selected={i === active}>
              <button
                onClick={() => go(it)}
                onMouseEnter={() => setActive(i)}
                className={`w-full flex items-center gap-3.5 px-5 py-2.5 text-left transition-colors duration-150 cursor-pointer ${i === active ? "bg-lumen-500/10" : ""}`}
              >
                <span
                  className={`shrink-0 font-mono text-[9px] tracking-[0.16em] uppercase px-2 py-1 rounded border w-[92px] text-center ${
                    it.kind === "manifestation"
                      ? "border-gild-400/40 text-gild-400 bg-gild-400/5"
                      : it.kind === "tool"
                        ? "border-lumen-500/40 text-lumen-400 bg-lumen-500/5"
                        : "border-seam-strong text-mist-400"
                  }`}
                >
                  {it.kind}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm truncate ${i === active ? "text-mist-50" : "text-mist-200"}`}>{it.canonicalName}</span>
                  <span className="block font-mono text-[10px] text-mist-600 truncate mt-0.5">
                    {it.family} · {it.description}
                  </span>
                </span>
                <span className="shrink-0 hidden sm:flex flex-col items-end gap-1">
                  <LifecycleChip lifecycle={it.lifecycle} />
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-ember-300/80">
                    evid · {it.evidence.rung}
                  </span>
                </span>
                <svg viewBox="0 0 16 16" className={`w-3.5 h-3.5 shrink-0 transition-all duration-200 ${i === active ? "text-lumen-400 translate-x-0.5" : "text-mist-600"}`} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M3 8h9M9 4.5 12.5 8 9 11.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        {/* footer */}
        <div className="px-5 py-3 border-t border-seam bg-ink-950/60 space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="font-mono text-[10px] text-mist-600 flex items-center gap-2">
              <span className="kbd">↑</span>
              <span className="kbd">↓</span> navegar
            </span>
            <span className="font-mono text-[10px] text-mist-600 flex items-center gap-2">
              <span className="kbd">↵</span> inspecionar
            </span>
            <span className="ml-auto font-mono text-[10px] tracking-wide text-mist-600">
              {LIFECYCLE_LABEL.CURRENT} ≠ live · presença ≠ endosso
            </span>
          </div>
          <p className="font-mono text-[9px] text-mist-600/80 tracking-wide">
            comandos: <span className="text-mist-500">type:tool/route/manifestation</span> · <span className="text-mist-500">state:current/prototype/predecessor/held/research</span> ·{" "}
            <span className="text-mist-500">family:iceberg</span> · <span className="text-mist-500">evidence:verified</span> · <span className="text-mist-500">source:github/lovable/gamma</span> ·{" "}
            <span className="text-mist-500">available:now</span>
          </p>
        </div>
      </div>
    </div>
  );
}
