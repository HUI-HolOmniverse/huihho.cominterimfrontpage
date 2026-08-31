import { CAPABILITIES, DOORS, EXTRA_LINKS, href } from "./data";
import { HolOmnisphere, HolonField } from "./visuals";
import { Reveal, Scramble, Lines } from "./motion";
import { SectionHead, StatusChip } from "./chrome";

const TRAIL = ["ROOT", "DOMAIN", "TOPIC", "PROVENANCE"];

/* ================= abertura ================= */
export function Opening() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-28 pb-16" id="topo">
      <div className="absolute inset-0 atlas-grid" aria-hidden="true" />
      <HolonField className="absolute inset-0 w-full h-full" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(52% 44% at 74% 42%, rgba(62,207,178,0.07), transparent 70%), radial-gradient(40% 40% at 12% 88%, rgba(18,48,64,0.55), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 w-full grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* coluna textual */}
        <div className="lg:col-span-7">
          <Reveal>
            <p className="font-mono text-[11px] sm:text-xs tracking-[0.3em] uppercase text-lumen-400 flex items-center gap-3">
              <svg viewBox="0 0 24 12" className="w-6 h-3 text-gild-400" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                <path d="M1 6 C 1 1, 11 1, 12 6 C 13 11, 23 11, 23 6 C 23 1, 13 1, 12 6 C 11 11, 1 11, 1 6 Z" />
              </svg>
              <Scramble text="HolOmnisphere · reciprocal infinity-heart field" />
            </p>
          </Reveal>

          <h1 className="font-display font-medium text-mist-50 mt-7 text-[clamp(2.9rem,7.2vw,5.6rem)] leading-[0.98] tracking-[-0.01em]">
            <Lines
              lines={[
                <span key="a">Humanity</span>,
                <span key="b">
                  <em className="italic font-light text-lumen-300">United</em>
                </span>,
                <span key="c">International</span>,
              ]}
            />
          </h1>

          <Reveal delay={260} className="mt-8 max-w-xl">
            <div className="border-l-2 border-gild-400/70 pl-5 py-1">
              <p className="text-mist-400 text-[15px] leading-relaxed">
                <span className="text-mist-200 font-medium">BeHolder = perspectiva de navegação.</span> Centro visual
                não implica autoridade. Cada ponto pode abrir novas camadas sem perder identidade ou proveniência.
              </p>
            </div>
          </Reveal>

          {/* trilha de profundidade */}
          <Reveal delay={380} className="mt-9">
            <p className="font-mono text-[10px] tracking-[0.26em] uppercase text-mist-600 mb-3">trilha de profundidade</p>
            <div className="flex flex-wrap items-center gap-y-3">
              {TRAIL.map((t, i) => (
                <span key={t} className="flex items-center">
                  <span className="group px-3.5 py-2 rounded-md border border-seam bg-ink-900/70 font-mono text-[11px] tracking-[0.22em] text-mist-400 transition-all duration-300 hover:border-lumen-500/60 hover:text-lumen-300 hover:shadow-[0_0_22px_rgba(62,207,178,0.18)] cursor-default">
                    {t}
                  </span>
                  {i < TRAIL.length - 1 && (
                    <svg viewBox="0 0 24 12" className="w-6 h-3 mx-1.5 text-lumen-500/60" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                      <path d="M2 6h17M15 2l5 4-5 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              ))}
            </div>
          </Reveal>

          {/* contagens vivas */}
          <Reveal delay={500} className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {[
              { v: "11", l: "rotas canônicas" },
              { v: "15", l: "manifestações públicas" },
              { v: "04", l: "runtimes desenhados" },
              { v: "∞", l: "lentes Beholder" },
            ].map((s) => (
              <div key={s.l} className="group cursor-default">
                <p className="font-display text-3xl text-mist-200 group-hover:text-lumen-300 transition-colors duration-300">{s.v}</p>
                <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-mist-600 mt-1">{s.l}</p>
              </div>
            ))}
          </Reveal>
        </div>

        {/* esfera */}
        <div className="lg:col-span-5 relative">
          <Reveal delay={200} className="relative anim-float">
            <HolOmnisphere className="max-w-[520px] mx-auto drop-shadow-[0_0_50px_rgba(62,207,178,0.12)]" />
          </Reveal>
          <p className="text-center font-mono text-[10px] tracking-[0.24em] uppercase text-mist-600 mt-2">
            holons · lentes · núcleo de coerência
          </p>
        </div>
      </div>

      {/* indicador de descida */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" aria-hidden="true">
        <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-mist-600">aprofundar</span>
        <span className="w-px h-8 bg-gradient-to-b from-lumen-400/70 to-transparent anim-led" />
      </div>
    </section>
  );
}

/* ================= três portas ================= */
const DOOR_ART: Record<string, React.ReactNode> = {
  gild: (
    <svg viewBox="0 0 120 90" className="absolute -bottom-1 -right-1 w-32 h-24 text-gild-400/25 group-hover:text-gild-400/50 transition-colors duration-500" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M60 6 L104 84 H16 Z" />
      <path d="M60 34 L82 84 H38 Z" opacity="0.7" />
      <path d="M16 62 H104" strokeDasharray="3 5" opacity="0.8" />
      <path d="M38 84 L60 60 L82 84" opacity="0.5" />
    </svg>
  ),
  lumen: (
    <svg viewBox="0 0 120 90" className="absolute -bottom-2 -right-2 w-32 h-24 text-lumen-400/25 group-hover:text-lumen-400/50 transition-colors duration-500" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <circle cx="78" cy="52" r="34" />
      <circle cx="78" cy="52" r="22" strokeDasharray="4 6" />
      <circle cx="78" cy="52" r="10" opacity="0.7" />
      <circle cx="100" cy="30" r="3" fill="currentColor" stroke="none" />
    </svg>
  ),
  ember: (
    <svg viewBox="0 0 120 90" className="absolute -bottom-1 -right-1 w-32 h-24 text-ember-400/25 group-hover:text-ember-400/50 transition-colors duration-500" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M20 74 C 40 74, 40 20, 60 20 C 80 20, 80 74, 100 74" />
      <path d="M20 58 C 40 58, 40 36, 60 36 C 80 36, 80 58, 100 58" opacity="0.6" />
      <circle cx="60" cy="20" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="20" cy="74" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="100" cy="74" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  ),
};

const DOOR_ACCENT: Record<string, { bar: string; text: string; glow: string }> = {
  gild: { bar: "bg-gild-400", text: "text-gild-300", glow: "group-hover:shadow-[0_18px_50px_rgba(217,166,63,0.14)]" },
  lumen: { bar: "bg-lumen-400", text: "text-lumen-300", glow: "group-hover:shadow-[0_18px_50px_rgba(62,207,178,0.16)]" },
  ember: { bar: "bg-ember-400", text: "text-ember-300", glow: "group-hover:shadow-[0_18px_50px_rgba(224,138,99,0.14)]" },
};

export function Doors() {
  return (
    <section id="portas" className="relative scroll-mt-24 mx-auto max-w-7xl px-5 sm:px-8 py-24 lg:py-32">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead
          kicker="Comece por aqui"
          title={[<span key="1">Três portas para</span>, <span key="2" className="italic font-light text-lumen-300">a arquitetura viva.</span>]}
        />
        <Reveal delay={200} className="font-mono text-[10px] tracking-[0.24em] uppercase text-mist-600 pb-2">
          portas 01 — 03 · profundidade progressiva
        </Reveal>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-5 mt-14">
        {DOORS.map((d, i) => {
          const a = DOOR_ACCENT[d.accent];
          return (
            <Reveal
              key={d.name}
              delay={i * 130}
              className={i === 0 ? "lg:col-span-5 md:col-span-2" : i === 1 ? "lg:col-span-4" : "lg:col-span-3"}
            >
              <div
                className={`group relative h-full overflow-hidden rounded-lg border border-seam bg-gradient-to-b from-ink-850 to-ink-900 p-7 sm:p-8 transition-all duration-400 hover:-translate-y-1.5 hover:border-seam-strong ${a.glow}`}
              >
                <a
                  href={href(d.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${d.name} — abrir em huihho.com`}
                  className="absolute inset-0 z-[1] rounded-lg"
                />
                <span className={`absolute top-0 left-0 h-[3px] w-10 ${a.bar} transition-all duration-500 group-hover:w-full`} aria-hidden="true" />
                <span className="absolute top-5 right-6 font-display text-6xl font-light text-mist-200/8 select-none" aria-hidden="true">
                  {d.n}
                </span>
                {DOOR_ART[d.accent]}

                <p className={`font-mono text-[10px] tracking-[0.28em] uppercase ${a.text}`}>{d.tag}</p>
                <h3 className="font-display text-3xl sm:text-4xl font-medium text-mist-50 mt-4 leading-tight">{d.name}</h3>
                <p className="text-sm text-mist-400 leading-relaxed mt-4 max-w-xs">{d.desc}</p>

                <div className="flex items-center justify-between mt-8">
                  <StatusChip status={d.status} />
                  <span className={`flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase ${a.text}`}>
                    {d.cta}
                    <svg viewBox="0 0 20 12" className="w-5 h-3 transition-transform duration-300 group-hover:translate-x-1.5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                      <path d="M1 6h16M12 1.5 17 6l-5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>

                {d.local && (
                  <div className="relative z-[2] mt-6 pt-4 border-t border-seam flex items-center justify-between gap-3">
                    <span className="font-mono text-[8px] tracking-[0.18em] uppercase text-mist-600">{d.local.label}</span>
                    <a
                      href={d.local.hash}
                      className="group/local flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] uppercase text-lumen-300 border border-lumen-500/45 rounded-full px-3.5 py-1.5 transition-all duration-300 hover:bg-lumen-500/10 hover:border-lumen-300 hover:shadow-[0_0_20px_rgba(62,207,178,0.25)]"
                    >
                      {d.local.cta}
                      <svg viewBox="0 0 12 20" className="w-2 h-3.5 transition-transform duration-300 group-hover/local:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="M6 1v16M1.5 12.5 6 17l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ================= tecido de capacidades ================= */
export function Fabric({ onLaunch }: { onLaunch: () => void }) {
  return (
    <section id="tecido" className="relative scroll-mt-24 border-y border-seam bg-ink-900/50">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-24 lg:py-28">
        <SectionHead
          kicker="HUIHHO Capability Fabric"
          title={[<span key="1">Um tecido extensível</span>, <span key="2">de capacidades.</span>]}
          lead={
            <>
              O portal deixa de ser um mapa estático. Capacidades já implementadas tornam-se descobráveis, filtráveis e
              lançáveis; capacidades futuras entram por <span className="text-mist-200">manifesto</span>, sem redesenhar a navegação.
            </>
          }
        />

        <div className="mt-14 border-t border-seam">
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c.name} delay={i * 100}>
              <div className="group grid md:grid-cols-12 gap-4 md:gap-8 items-center py-7 border-b border-seam transition-all duration-300 hover:bg-ink-850/70 hover:pl-4">
                <span className="md:col-span-1 font-display text-2xl text-mist-600 group-hover:text-lumen-400 transition-colors duration-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="md:col-span-4">
                  <p className="font-mono text-[9px] tracking-[0.26em] uppercase text-gild-400">{c.tag}</p>
                  <h3 className="font-display text-2xl font-medium text-mist-50 mt-1.5">{c.name}</h3>
                </div>
                <p className="md:col-span-5 text-sm text-mist-400 leading-relaxed">{c.desc}</p>
                <div className="md:col-span-2 md:text-right">
                  {c.launcher ? (
                    <button
                      onClick={onLaunch}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-lumen-500/50 bg-lumen-500/10 text-lumen-300 font-mono text-[10px] tracking-[0.18em] uppercase hover:bg-lumen-500/20 hover:shadow-[0_0_26px_rgba(62,207,178,0.25)] transition-all duration-300 cursor-pointer"
                    >
                      {c.cta}
                      <span className="kbd">⌘K</span>
                    </button>
                  ) : (
                    <a
                      href={href(c.path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-lumen-400 hover:text-lumen-300 transition-colors duration-200"
                    >
                      {c.cta}
                      <svg viewBox="0 0 20 12" className="w-5 h-3 transition-transform duration-300 group-hover:translate-x-1.5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                        <path d="M1 6h16M12 1.5 17 6l-5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 font-mono text-[10px] tracking-[0.2em] uppercase text-mist-600">
          <span className="text-gild-400">◇</span> capacidades futuras entram por manifesto — o tecido absorve sem redesenhar
        </p>
      </div>
    </section>
  );
}

/* ================= perspectiva BeHolder ================= */
const GLYPHS: Record<string, React.ReactNode> = {
  eye: (
    <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M2 16 C 8 7, 24 7, 30 16 C 24 25, 8 25, 2 16 Z" />
      <circle cx="16" cy="16" r="6" />
      <circle cx="16" cy="16" r="2.4" fill="currentColor" stroke="none" />
      <path d="M16 3v4M16 25v4" strokeLinecap="round" opacity="0.6" />
    </svg>
  ),
  fractal: (
    <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <circle cx="16" cy="5" r="2.6" />
      <circle cx="7" cy="17" r="2.6" />
      <circle cx="25" cy="17" r="2.6" />
      <circle cx="4" cy="28" r="2" />
      <circle cx="12" cy="28" r="2" />
      <circle cx="21" cy="28" r="2" />
      <circle cx="28" cy="28" r="2" />
      <path d="M14.6 7.2 8.4 14.8M17.4 7.2 23.6 14.8M6.2 19.4 4.5 26M8 19.5 11.4 26M24 19.4 21.6 26M26 19.4 27.5 26" strokeLinecap="round" />
    </svg>
  ),
  kernel: (
    <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M16 2.5 27.5 9v14L16 29.5 4.5 23V9Z" />
      <path d="M16 2.5V16m0 0 11.5-7M16 16 4.5 9m11.5 7v13.5" opacity="0.7" />
      <circle cx="16" cy="16" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export function Beholder() {
  return (
    <section id="beholder" className="relative scroll-mt-24 mx-auto max-w-7xl px-5 sm:px-8 py-24 lg:py-32">
      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Reveal className="relative">
              <div
                className="absolute inset-0 -z-10 blur-2xl opacity-50"
                style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(62,207,178,0.12), transparent 70%)" }}
                aria-hidden="true"
              />
              <HolOmnisphere className="max-w-[420px] mx-auto" />
            </Reveal>
            <p className="text-center font-mono text-[10px] tracking-[0.24em] uppercase text-mist-600 mt-3">
              campo infinitamente aninhável · omni-layerable
            </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <SectionHead
            kicker="BeHolder perspective"
            title={[<span key="1">Uma esfera; incontáveis lentes;</span>, <span key="2" className="italic font-light text-lumen-300">identidade preservada.</span>]}
            lead="A HolOmnisphere é representada aqui como um campo infinitamente aninhável, omni-layerable e navegável por perspectivas holomni-kaleidoscópicas. Os loops recíprocos de infinito-coração expressam conexão e mutualidade; os pontos sugerem Holons; o núcleo geométrico representa QCORE como função de coerência — não como trono de autoridade."
          />

          <div className="mt-12 space-y-4">
            {EXTRA_LINKS.map((l, i) => (
              <Reveal key={l.name} delay={i * 110}>
                <a
                  href={href(l.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-5 rounded-lg border border-seam bg-ink-900/60 p-6 transition-all duration-300 hover:border-lumen-500/45 hover:bg-ink-850 hover:translate-x-1.5"
                >
                  <span className="text-lumen-400 shrink-0 mt-0.5 transition-transform duration-500 group-hover:rotate-[18deg] group-hover:scale-110">
                    {GLYPHS[i === 0 ? "eye" : i === 1 ? "fractal" : "kernel"]}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-4">
                      <h3 className="font-display text-xl sm:text-2xl font-medium text-mist-50 group-hover:text-lumen-300 transition-colors duration-300">
                        {l.name}
                      </h3>
                      <span className="font-mono text-[10px] text-mist-600 truncate hidden sm:block">{l.path}</span>
                    </span>
                    <p className="text-sm text-mist-400 leading-relaxed mt-2">{l.desc}</p>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
