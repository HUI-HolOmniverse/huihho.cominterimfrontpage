import { useMemo, useState } from "react";
import { MANIFESTATIONS, type Manifestation } from "./data";
import { Reveal } from "./motion";
import { SectionHead } from "./chrome";

type Filter = "Todas" | "Lovable" | "Gamma";

function ManifestationCard({ m, i }: { m: Manifestation; i: number }) {
  return (
    <Reveal delay={(i % 3) * 100} className="h-full">
      <a
        href={m.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col h-full rounded-lg border border-seam bg-gradient-to-b from-ink-850 to-ink-900 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-gild-400/50 hover:shadow-[0_20px_55px_rgba(5,14,19,0.7),0_0_30px_rgba(233,188,98,0.07)]"
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className={`px-2.5 py-1 rounded-full border font-mono text-[9px] uppercase tracking-[0.16em] ${
              m.source === "Lovable"
                ? "border-lumen-500/45 text-lumen-400 bg-lumen-500/5"
                : "border-gild-400/45 text-gild-400 bg-gild-400/5"
            }`}
          >
            {m.source}
          </span>
          <svg
            viewBox="0 0 16 16"
            className="w-3.5 h-3.5 text-mist-600 transition-all duration-300 group-hover:text-gild-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M4 12 12 4M6 4h6v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mt-5">{m.area}</p>
        <h3 className="font-display text-xl sm:text-[1.35rem] font-medium text-mist-50 leading-snug mt-2 group-hover:text-gild-300 transition-colors duration-300">
          {m.name}
        </h3>
        <p className="text-[13px] text-mist-400 leading-relaxed mt-3 flex-1">{m.desc}</p>
        <span className="mt-5 pt-4 border-t border-seam font-mono text-[10px] tracking-[0.18em] uppercase text-mist-500 group-hover:text-lumen-300 transition-colors duration-300 flex items-center justify-between">
          abrir manifestação pública
          <span className="text-lumen-400">↗</span>
        </span>
      </a>
    </Reveal>
  );
}

export function Constellation() {
  const [filter, setFilter] = useState<Filter>("Todas");

  const shown = useMemo(
    () => MANIFESTATIONS.filter((m) => filter === "Todas" || m.source === filter),
    [filter],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { Todas: MANIFESTATIONS.length, Lovable: 0, Gamma: 0 };
    for (const m of MANIFESTATIONS) c[m.source] += 1;
    return c;
  }, []);

  return (
    <section id="constelacao" className="relative scroll-mt-24 border-t border-seam bg-ink-900/50 overflow-hidden">
      <div className="absolute inset-0 atlas-grid opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 py-24 lg:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            kicker="HUI · provenance of intent · public work constellation"
            title={[<span key="1">A arquitetura já tem</span>, <span key="2" className="italic font-light text-lumen-300">muitas manifestações.</span>]}
            lead="Esta constelação conecta o portal canônico a protótipos, predecessores, experimentos e superfícies públicas produzidas ao longo do caminho — tornando visível a amplitude do trabalho sem declarar que cada manifestação é corrente, canônica, verificada ou institucionalmente incorporada à HUI."
          />
        </div>

        {/* regra de leitura */}
        <Reveal delay={150} className="mt-10">
          <div className="flex items-start gap-4 rounded-lg border border-gild-400/35 bg-gild-400/5 px-6 py-5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 mt-0.5 text-gild-400" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M3 5.5C6 4 9 4 11.5 5.5v13C9 17 6 17 3 18.5ZM21 5.5C18 4 15 4 12.5 5.5v13C15 17 18 17 21 18.5Z" strokeLinejoin="round" />
              <path d="M12 5.5v13" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-mist-300 leading-relaxed">
              <span className="font-medium text-gild-300">Regra de leitura:</span> presença nesta constelação = evidência
              de manifestação/intenção pública. Não equivale a aprovação, currentness, propriedade institucional,
              integração operacional ou verificação factual.
            </p>
          </div>
        </Reveal>

        {/* filtros */}
        <Reveal delay={220} className="mt-10 flex flex-wrap items-center gap-2.5">
          {(["Todas", "Lovable", "Gamma"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full border font-mono text-[10px] tracking-[0.18em] uppercase transition-all duration-200 cursor-pointer ${
                filter === f
                  ? "bg-gild-400/15 border-gild-400/60 text-gild-300 shadow-[0_0_20px_rgba(233,188,98,0.18)]"
                  : "border-seam text-mist-500 hover:text-mist-200 hover:border-seam-strong"
              }`}
              aria-pressed={filter === f}
            >
              {f}
              <span className={`ml-2 ${filter === f ? "text-lumen-300" : "text-mist-600"}`}>{counts[f]}</span>
            </button>
          ))}
          <span className="ml-auto font-mono text-[10px] tracking-[0.2em] uppercase text-mist-600">
            exibindo {shown.length} de {MANIFESTATIONS.length}
          </span>
        </Reveal>

        {/* grade */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-10">
          {shown.map((m, i) => (
            <ManifestationCard key={m.url} m={m} i={i} />
          ))}
        </div>

        <p className="mt-10 text-center font-mono text-[10px] tracking-[0.22em] uppercase text-mist-600">
          <span className="text-lumen-400">∞</span> novas manifestações podem orbitar sem deslocar o centro —{" "}
          <span className="text-mist-400">o centro não é trono</span>
        </p>
      </div>
    </section>
  );
}
