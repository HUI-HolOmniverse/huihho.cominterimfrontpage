import { useState } from "react";
import { CANON, CROWD, LEGEND, PUBLISHING, SUBDOMAINS, href } from "./data";
import { Reveal } from "./motion";
import { SectionHead, StatusChip } from "./chrome";

/* ================= mapa canônico ================= */
export function CanonicalMap() {
  return (
    <section id="mapa" className="relative scroll-mt-24 border-y border-seam bg-ink-900/50">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-24 lg:py-32 grid lg:grid-cols-12 gap-14">
        {/* coluna fixa */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28 space-y-10">
            <SectionHead
              kicker="Mapa canônico"
              title={[<span key="1">Uma raiz clara;</span>, <span key="2" className="italic font-light text-lumen-300">profundidade fractal.</span>]}
              lead={
                <>
                  A experiência humana prefere rotas sob <span className="font-mono text-lumen-300 text-[13px]">huihho.com</span>.
                  Filhos e netos adicionam profundidade sem alterar identidade, proveniência ou autoridade.
                </>
              }
            />

            <Reveal delay={150}>
              <div className="rounded-lg border border-seam bg-ink-950/70 p-6">
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-mist-600 mb-5">legenda epistêmica</p>
                <ul className="space-y-4">
                  {LEGEND.map((l) => (
                    <li key={l.status} className="group cursor-default">
                      <StatusChip status={l.status} />
                      <p className="text-xs text-mist-500 leading-relaxed mt-2 group-hover:text-mist-300 transition-colors duration-300">
                        {l.meaning}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>

        {/* rotas */}
        <div className="lg:col-span-8">
          <Reveal className="font-mono text-[10px] tracking-[0.24em] uppercase text-mist-600 mb-4 flex items-center gap-3">
            <span className="text-gild-400">11</span> rotas públicas · estado epistêmico visível
          </Reveal>
          <ol className="border-t border-seam">
            {CANON.map((r, i) => (
              <Reveal key={r.path} as="li" delay={Math.min(i * 60, 300)}>
                <a
                  href={href(r.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid sm:grid-cols-12 gap-2 sm:gap-5 items-start py-6 border-b border-seam transition-all duration-300 hover:bg-ink-850/70 hover:pl-4"
                >
                  <div className="sm:col-span-1 font-mono text-[10px] text-mist-600 pt-1.5">{String(i + 1).padStart(2, "0")}</div>
                  <div className="sm:col-span-4">
                    <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-mist-600">{r.area}</p>
                    <h3 className="font-display text-xl sm:text-2xl font-medium text-mist-50 group-hover:text-lumen-300 transition-colors duration-300 leading-snug">
                      {r.name}
                    </h3>
                  </div>
                  <p className="sm:col-span-4 text-[13px] text-mist-400 leading-relaxed pt-1">{r.desc}</p>
                  <div className="sm:col-span-3 flex sm:flex-col items-start sm:items-end gap-2.5">
                    <StatusChip status={r.status} />
                    <span className="font-mono text-[11px] text-lumen-400/90 flex items-center gap-2">
                      {r.path}
                      <svg viewBox="0 0 20 12" className="w-4 h-2.5 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="M1 6h16M12 1.5 17 6l-5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </a>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ================= participação crowd ================= */
export function Crowd() {
  return (
    <section id="participar" className="relative scroll-mt-24 mx-auto max-w-7xl px-5 sm:px-8 py-24 lg:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead
          kicker="Participação emergente"
          title={[<span key="1">Crowd-Sourced · Crowd-Built ·</span>, <span key="2" className="italic font-light text-lumen-300">Crowd-Crowded.</span>]}
        />
      </div>

      <div className="relative mt-14">
        <span className="absolute left-[27px] sm:left-[39px] top-4 bottom-4 w-px bg-gradient-to-b from-lumen-500/50 via-seam-strong to-transparent hidden md:block" aria-hidden="true" />
        <div className="space-y-5">
          {CROWD.map((c, i) => (
            <Reveal key={c.name} delay={i * 120}>
              <a
                href={href(c.path)}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative grid md:grid-cols-12 gap-4 md:gap-8 items-center rounded-lg border border-seam bg-ink-900/60 p-6 sm:p-7 transition-all duration-300 hover:border-lumen-500/45 hover:bg-ink-850 hover:-translate-y-1"
              >
                <div className="md:col-span-1 flex md:block items-center gap-4">
                  <span className="relative z-10 grid place-items-center w-14 h-14 sm:w-20 sm:h-20 rounded-full border border-lumen-500/40 bg-ink-950 font-display text-2xl sm:text-3xl text-lumen-300 transition-all duration-500 group-hover:border-gild-400/70 group-hover:text-gild-300 group-hover:shadow-[0_0_28px_rgba(62,207,178,0.2)]">
                    {c.n}
                  </span>
                </div>
                <div className="md:col-span-4">
                  <h3 className="font-display text-2xl sm:text-3xl font-medium text-mist-50 group-hover:text-lumen-300 transition-colors duration-300">
                    {c.name}
                  </h3>
                  <p className="font-mono text-[10px] text-mist-600 mt-1.5">{c.path}</p>
                </div>
                <p className="md:col-span-4 text-sm text-mist-400 leading-relaxed">{c.desc}</p>
                <div className="md:col-span-3 flex flex-wrap gap-2">
                  {c.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full border border-seam font-mono text-[9px] uppercase tracking-[0.14em] text-mist-500 group-hover:border-seam-strong transition-colors duration-300">
                      {t}
                    </span>
                  ))}
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={220}>
          <a
            href="#/intake"
            className="group mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-lg border border-gild-400/35 bg-gradient-to-r from-gild-400/8 to-transparent px-7 py-6 transition-all duration-300 hover:border-gild-400/70 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(217,166,63,0.12)]"
          >
            <span className="grid place-items-center w-12 h-12 rounded-full border border-gild-400/50 text-gild-300 transition-transform duration-500 group-hover:rotate-90" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 4v12M7 11l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 19.5h16" strokeLinecap="round" />
              </svg>
            </span>
            <span className="flex-1 min-w-[240px]">
              <span className="block font-display text-xl sm:text-2xl font-medium text-mist-50 group-hover:text-gild-300 transition-colors duration-300">
                Intake Studio — registre um building block
              </span>
              <span className="block text-[13px] text-mist-400 leading-relaxed mt-1">
                Trabalho útil, predecessor ou experimento entra como rascunho governado: vocabulário controlado, linhagem,
                evidência e valor de continuidade. <span className="text-gild-300">Rascunho ≠ adoção.</span>
              </span>
            </span>
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-gild-300 flex items-center gap-2.5">
              abrir intake
              <svg viewBox="0 0 20 12" className="w-4 h-2.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M1 6h16M12 1.5 17 6l-5 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= topologia runtime ================= */
export function Topology() {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <section id="topologia" className="relative scroll-mt-24 border-y border-seam bg-ink-900/50">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-24 lg:py-28">
        <SectionHead
          kicker="Technical / runtime topology"
          title={[<span key="1">Subdomínios somente onde</span>, <span key="2" className="italic font-light text-lumen-300">o isolamento é real.</span>]}
        />

        <div className="grid md:grid-cols-2 gap-5 mt-14">
          {SUBDOMAINS.map((s, i) => {
            const tone =
              s.tone === "lumen"
                ? "text-lumen-400 border-lumen-500/40"
                : s.tone === "ember"
                  ? "text-ember-300 border-ember-400/40"
                  : "text-mist-400 border-mist-600/50";
            return (
              <Reveal key={s.host} delay={i * 100}>
                <article
                  onMouseEnter={() => setHovered(s.host)}
                  onMouseLeave={() => setHovered(null)}
                  className="group h-full rounded-lg border border-seam bg-gradient-to-b from-ink-850 to-ink-900 p-7 transition-all duration-300 hover:border-seam-strong hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="font-mono text-base sm:text-lg text-mist-50 flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          s.tone === "ember" ? "bg-ember-400" : s.tone === "lumen" ? "bg-lumen-400" : "bg-mist-500"
                        } ${hovered === s.host ? "anim-led" : ""}`}
                        aria-hidden="true"
                      />
                      {s.host}
                    </h3>
                    <span className={`px-2.5 py-1 rounded-full border font-mono text-[9px] uppercase tracking-[0.14em] ${tone}`}>
                      {s.badge}
                    </span>
                  </div>
                  <p className="text-sm text-mist-400 leading-relaxed mt-5">{s.desc}</p>
                  <blockquote className="mt-5 border-l-2 border-gild-400/60 pl-4">
                    <p className="text-[13px] text-mist-300 leading-relaxed italic font-display">{s.contract}</p>
                    <footer className="font-mono text-[9px] tracking-[0.2em] uppercase text-mist-600 mt-2.5">
                      contrato público · {s.contractTag}
                    </footer>
                  </blockquote>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={200} className="mt-8">
          <div className="flex items-start gap-4 rounded-lg border border-ember-400/35 bg-ember-400/5 px-6 py-5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 mt-0.5 text-ember-300" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M12 2.5 22.5 21h-21Z" strokeLinejoin="round" />
              <path d="M12 9.5v5" strokeLinecap="round" />
              <circle cx="12" cy="17.4" r="0.9" fill="currentColor" stroke="none" />
            </svg>
            <p className="text-sm text-mist-300 leading-relaxed">
              <span className="font-medium text-ember-300">Não-colapso:</span> compartilhar infraestrutura não implica
              governança, autoridade, ativos, responsabilidade ou identidade institucional compartilhadas.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= arquitetura de publicação (cartas empilhadas) ================= */
export function Publishing() {
  return (
    <section id="publicacao" className="relative scroll-mt-24 mx-auto max-w-7xl px-5 sm:px-8 py-24 lg:py-32">
      <SectionHead
        kicker="Arquitetura de publicação"
        title={[<span key="1">Source → derivação →</span>, <span key="2">runtime → <em className="italic font-light text-lumen-300">readback.</em></span>]}
        lead="Cada estágio permanece distinguível: custódia não é projeção, projeção não é vigência, e LIVE exige leitura externa do destino."
      />

      <div className="mt-16">
        {PUBLISHING.map((p, i) => (
          <div key={p.n} className="sticky mb-6 last:mb-0" style={{ top: `calc(104px + ${i * 54}px)` }}>
            <Reveal>
              <article
                className="relative overflow-hidden rounded-xl border border-seam-strong px-7 sm:px-10 py-9 sm:py-11 shadow-[0_-18px_50px_rgba(5,14,19,0.8)]"
                style={{
                  background: `linear-gradient(135deg, ${["#0d2531", "#0c222d", "#0b1f29", "#0a1c25"][i]} 0%, #071820 78%)`,
                }}
              >
                <span
                  className="absolute -right-4 -top-10 font-display font-light text-[9rem] leading-none select-none pointer-events-none"
                  style={{ color: "rgba(167,194,191,0.06)" }}
                  aria-hidden="true"
                >
                  {p.n}
                </span>
                <span
                  className="absolute top-0 left-0 h-full w-[3px]"
                  style={{ background: ["#5fe3c8", "#e9bc62", "#a7c2bf", "#8ff0dd"][i] }}
                  aria-hidden="true"
                />
                <div className="relative flex flex-wrap items-center gap-x-10 gap-y-4">
                  <div className="min-w-[220px]">
                    <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-mist-600">estágio {p.n}</p>
                    <h3 className="font-display text-3xl sm:text-4xl font-medium text-mist-50 mt-2">{p.name}</h3>
                  </div>
                  <p className="flex-1 min-w-[240px] text-[15px] text-mist-300 leading-relaxed max-w-xl">{p.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span key={t} className="px-3 py-1.5 rounded-full border border-seam bg-ink-950/60 font-mono text-[9px] uppercase tracking-[0.16em] text-lumen-300/90">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}
