import { useEffect, useState, type ReactNode } from "react";
import { Monogram } from "./visuals";
import { Lines, Scramble, useAnchorNav } from "./motion";
import { EPISTEMIC_CHAIN, href, type EpistemicStatus } from "./data";

/* ================= status chip ================= */
const TONE: Record<EpistemicStatus, string> = {
  "ACCEPTED CODE": "border-gild-400/60 text-gild-300 bg-gild-400/10",
  CANDIDATE: "border-lumen-500/45 text-lumen-400 bg-lumen-500/5",
  "binding-candidate": "border-lumen-500/45 text-lumen-400 bg-lumen-500/5",
  "future-runtime": "border-mist-600/60 text-mist-400 bg-mist-600/10",
  "reserved-until-hardened": "border-ember-400/50 text-ember-300 bg-ember-400/10",
};

export function StatusChip({ status, className = "" }: { status: EpistemicStatus; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono text-[9px] uppercase tracking-[0.16em] whitespace-nowrap ${TONE[status]} ${className}`}>
      <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}

/* ================= section head ================= */
export function SectionHead({
  kicker,
  title,
  lead,
  id,
}: {
  kicker: string;
  title: ReactNode[];
  lead?: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="scroll-mt-28 max-w-3xl">
      <p className="font-mono text-[11px] tracking-[0.32em] uppercase text-lumen-400 flex items-center gap-3">
        <span className="inline-block w-8 h-px bg-lumen-500/60" aria-hidden="true" />
        <Scramble text={kicker} />
      </p>
      <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.9rem] leading-[1.06] font-medium text-mist-50 mt-4">
        <Lines lines={title} />
      </h2>
      {lead && <p className="text-mist-400 text-[15px] leading-relaxed mt-5 max-w-2xl">{lead}</p>}
    </div>
  );
}

/* ================= header ================= */
const NAV = [
  { id: "portas", label: "Portas" },
  { id: "tecido", label: "Tecido" },
  { id: "beholder", label: "BeHolder" },
  { id: "mapa", label: "Mapa" },
  { id: "topologia", label: "Topologia" },
  { id: "constelacao", label: "Constelação" },
];

export function Header({ onLaunch }: { onLaunch: () => void }) {
  const nav = useAnchorNav();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b ${
        scrolled ? "bg-ink-950/85 backdrop-blur-md border-seam py-2.5" : "bg-transparent border-transparent py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 flex items-center gap-5">
        <a href="https://huihho.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group" aria-label="huihho.com — referência da rota canônica (externa)">
          <Monogram className="w-9 h-9 transition-transform duration-500 group-hover:rotate-90" />
          <span className="leading-none">
            <span className="block font-display font-semibold text-xl tracking-tight text-mist-50">HUI</span>
            <span className="block font-mono text-[9px] tracking-[0.28em] uppercase text-mist-600 mt-1">huihho.com</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-6 ml-8" aria-label="Seções do portal">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={(e) => nav(e, n.id)}
              className="relative font-mono text-[11px] tracking-[0.18em] uppercase text-mist-500 hover:text-lumen-300 transition-colors duration-200 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-lumen-400 after:transition-all after:duration-300 hover:after:w-full"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <a
            href="#/captura"
            className="group/cap flex items-center gap-2 px-3 py-2 rounded-lg border border-gild-400/50 text-gild-300 font-mono text-[10px] tracking-[0.14em] uppercase transition-all duration-200 hover:bg-gild-400/10 hover:shadow-[0_0_22px_rgba(217,166,63,0.18)] focus-ring"
            aria-label="Captura Rápida — Treasure Drop"
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 transition-transform duration-300 group-hover/cap:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M10 3v10M5.5 9 10 13.5 14.5 9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.5 16.5h13" strokeLinecap="round" />
            </svg>
            <span className="hidden md:inline">capturar</span>
          </a>
          <span className="hidden sm:flex items-center gap-2 font-mono text-[9px] tracking-[0.22em] uppercase text-mist-500">
            <span className="w-1.5 h-1.5 rounded-full bg-lumen-400 anim-led" aria-hidden="true" />
            public prototype · building
          </span>
          <button
            onClick={onLaunch}
            className="flex items-center gap-2.5 pl-3.5 pr-2.5 py-2 rounded-lg border border-seam-strong bg-ink-900/70 hover:bg-ink-800 hover:border-lumen-500/50 transition-all duration-200 cursor-pointer group"
            aria-label="Buscar capacidades (Ctrl/Cmd K)"
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-lumen-400" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="9" cy="9" r="6" />
              <path d="M13.5 13.5 L18 18" strokeLinecap="round" />
            </svg>
            <span className="text-xs text-mist-400 group-hover:text-mist-200 transition-colors hidden md:inline">Buscar</span>
            <span className="kbd">⌘K</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ================= epistemic ticker ================= */
export function Ticker() {
  const chain = [...EPISTEMIC_CHAIN, ...EPISTEMIC_CHAIN];
  return (
    <div className="relative border-y border-seam bg-ink-900/60 overflow-hidden py-3" aria-label="Cadeia epistêmica: visão, desenho, representação, corroboração, verificação, aprovação, vigência">
      <div className="flex w-max anim-ticker" aria-hidden="true">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center shrink-0">
            {chain.map((c, i) => (
              <span key={`${half}-${i}`} className="flex items-center">
                <span className={`font-mono text-[11px] tracking-[0.3em] uppercase px-5 ${i % EPISTEMIC_CHAIN.length === EPISTEMIC_CHAIN.length - 1 ? "text-gild-400" : "text-mist-500"}`}>
                  {c}
                </span>
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-lumen-500/70" fill="currentColor" aria-hidden="true">
                  <path d="M6 0 L7.4 4.6 L12 6 L7.4 7.4 L6 12 L4.6 7.4 L0 6 L4.6 4.6 Z" />
                </svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= footer ================= */
export function Footer({ onLaunch }: { onLaunch: () => void }) {
  return (
    <footer className="relative border-t border-seam bg-ink-900/80 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{ background: "radial-gradient(60% 90% at 50% 110%, rgba(18,48,64,0.9), transparent 70%)" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 pt-16 pb-8">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <Monogram className="w-10 h-10" />
              <p className="font-display text-2xl font-medium text-mist-50">Humanity United International</p>
            </div>
            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-mist-500 mt-5 leading-loose">
              HUI <span className="text-ember-400">≠</span> ICEBERG <span className="text-ember-400">≠</span> ARTE{" "}
              <span className="text-ember-400">≠</span> PRA AMAR <span className="text-ember-400">≠</span> RIR
            </p>
            <p className="text-sm text-mist-400 mt-3 leading-relaxed max-w-sm">
              Estado de source não é runtime ao vivo. Presença na constelação é evidência de manifestação pública —
              não aprovação, currentness ou incorporação institucional.
            </p>
            <button
              onClick={onLaunch}
              className="mt-6 inline-flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-lg border border-seam-strong hover:border-lumen-500/60 hover:bg-ink-800 transition-all duration-200 cursor-pointer text-sm text-mist-200"
            >
              Buscar no tecido
              <span className="kbd">Ctrl</span>
              <span className="kbd">K</span>
            </button>
          </div>

          <div className="md:col-span-3">
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-mist-600">Rotas canônicas</p>
            <ul className="mt-4 space-y-2.5">
              {["/iceberg", "/holomniverse", "/holo-logoi", "/architecture", "/evidence", "/eceaqui"].map((p) => (
                <li key={p}>
                  <a href={href(p)} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-mist-400 hover:text-lumen-300 transition-colors duration-200">
                    huihho.com{p}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-mist-600">Princípios</p>
            <ul className="mt-4 space-y-2.5 text-sm text-mist-400">
              <li>BeHolder-centered</li>
              <li>Sem hierarquia visual</li>
              <li>Proveniência preservada</li>
              <li>Não-colapso institucional</li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-mist-600">Leitura</p>
            <ul className="mt-4 space-y-2.5 text-sm text-mist-400">
              <li>ROOT → DOMAIN</li>
              <li>TOPIC → PROVENANCE</li>
              <li className="font-mono text-[11px] text-lumen-400/80">reciprocal ∞-heart field</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-seam flex flex-col sm:flex-row items-center gap-3 justify-between">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-mist-600">
            © {new Date().getFullYear()} HUI · provenance of intent · public work constellation
          </p>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-mist-600">
            protótipo interim · readback externo pendente
          </p>
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-mist-600/80 mt-2">
            noindex ativo · PROTOTYPE ≠ PRODUCTION
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-lumen-400 anim-led ml-2 align-middle" aria-hidden="true" />
          </p>
        </div>
      </div>
    </footer>
  );
}
