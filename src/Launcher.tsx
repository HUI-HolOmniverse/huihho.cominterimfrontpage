import { useEffect, useMemo, useRef, useState } from "react";
import { LAUNCHER_CATS, LAUNCHER_ITEMS, type LauncherCategory, type LauncherItem } from "./data";

function CatChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full border font-mono text-[10px] tracking-[0.14em] uppercase transition-all duration-200 cursor-pointer ${
        active
          ? "bg-lumen-500/15 border-lumen-500/60 text-lumen-300 shadow-[0_0_18px_rgba(62,207,178,0.25)]"
          : "border-seam text-mist-500 hover:text-mist-200 hover:border-seam-strong"
      }`}
    >
      {label}
      <span className={active ? "text-gild-400 ml-1.5" : "text-mist-600 ml-1.5"}>{count}</span>
    </button>
  );
}

export function Launcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<LauncherCategory | "Todas">("Todas");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LAUNCHER_ITEMS.filter((it) => {
      if (cat !== "Todas" && it.category !== cat) return false;
      if (!q) return true;
      return (
        it.label.toLowerCase().includes(q) ||
        it.hint.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q)
      );
    });
  }, [query, cat]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCat("Todas");
      setActive(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 30);
      document.body.style.overflow = "hidden";
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => setActive(0), [query, cat]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of LAUNCHER_ITEMS) map.set(it.category, (map.get(it.category) ?? 0) + 1);
    return map;
  }, []);

  if (!open) return null;

  const go = (it: LauncherItem) => {
    if (it.route) {
      window.location.hash = it.route;
    } else {
      window.open(it.url, "_blank", "noopener,noreferrer");
    }
    onClose();
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
      aria-label="Lançador de capacidades"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-[6px]" onMouseDown={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl rounded-xl border border-seam-strong bg-ink-900/95 shadow-[0_30px_90px_rgba(0,0,0,0.65),0_0_60px_rgba(62,207,178,0.08)] overflow-hidden">
        {/* header */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-seam">
          <svg viewBox="0 0 20 20" className="w-4 h-4 text-lumen-400" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="M13.5 13.5 L18 18" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Buscar capacidades, rotas, manifestações…"
            className="flex-1 bg-transparent outline-none text-mist-50 placeholder:text-mist-600 font-body text-sm tracking-wide"
            aria-label="Buscar capacidades"
          />
          <span className="kbd">ESC</span>
        </div>

        {/* categories */}
        <div className="flex gap-2 px-5 py-3 overflow-x-auto border-b border-seam [scrollbar-width:none]">
          <CatChip active={cat === "Todas"} label="Todas" count={LAUNCHER_ITEMS.length} onClick={() => setCat("Todas")} />
          {LAUNCHER_CATS.map((c) => (
            <CatChip key={c} active={cat === c} label={c} count={counts.get(c) ?? 0} onClick={() => setCat(c)} />
          ))}
        </div>

        {/* results */}
        <ul ref={listRef} className="max-h-[46vh] overflow-y-auto py-2" role="listbox" aria-label="Resultados">
          {items.length === 0 && (
            <li className="px-6 py-10 text-center">
              <p className="font-mono text-xs tracking-[0.2em] text-mist-600 uppercase">nenhuma capacidade encontrada</p>
              <p className="text-sm text-mist-500 mt-2">O tecido cresce por manifesto — nada aqui é beco sem saída.</p>
            </li>
          )}
          {items.map((it, i) => (
            <li key={it.id} data-idx={i} role="option" aria-selected={i === active}>
              <button
                onClick={() => go(it)}
                onMouseEnter={() => setActive(i)}
                className={`w-full flex items-center gap-4 px-5 py-2.5 text-left transition-colors duration-150 cursor-pointer ${
                  i === active ? "bg-lumen-500/10" : ""
                }`}
              >
                <span
                  className={`shrink-0 font-mono text-[9px] tracking-[0.18em] uppercase px-2 py-1 rounded border ${
                    it.kind === "manifestação"
                      ? "border-gild-400/40 text-gild-400 bg-gild-400/5"
                      : it.kind === "capacidade"
                        ? "border-lumen-500/40 text-lumen-400 bg-lumen-500/5"
                        : "border-seam-strong text-mist-400"
                  }`}
                >
                  {it.kind}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm truncate ${i === active ? "text-mist-50" : "text-mist-200"}`}>{it.label}</span>
                  <span className="block font-mono text-[10px] text-mist-600 truncate mt-0.5">{it.hint}</span>
                </span>
                <span className="shrink-0 flex items-center gap-2">
                  {it.route && (
                    <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-ink-950 bg-lumen-400 rounded px-1.5 py-0.5">
                      local
                    </span>
                  )}
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-600 hidden sm:block">{it.category}</span>
                </span>
                <svg viewBox="0 0 16 16" className={`w-3.5 h-3.5 shrink-0 transition-all duration-200 ${i === active ? "text-lumen-400 translate-x-0.5" : "text-mist-600"}`} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M3 8h9M9 4.5 12.5 8 9 11.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        {/* footer */}
        <div className="px-5 py-3 border-t border-seam flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-ink-950/60">
          <span className="font-mono text-[10px] text-mist-600 flex items-center gap-2">
            <span className="kbd">↑</span>
            <span className="kbd">↓</span> navegar
          </span>
          <span className="font-mono text-[10px] text-mist-600 flex items-center gap-2">
            <span className="kbd">↵</span> abrir
          </span>
          <span className="ml-auto font-mono text-[10px] tracking-wide text-mist-600">
            HUI ≠ ICEBERG ≠ ARTE ≠ PRA AMAR ≠ RIR · estado de source não é runtime ao vivo
          </span>
        </div>
      </div>
    </div>
  );
}
