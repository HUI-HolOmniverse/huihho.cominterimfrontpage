/* ------------------------------------------------------------------ */
/*  Lente de Co-Criação — caminho transversal do padrão humano (Sérgio  */
/*  “Da Floresta” como primeiro padrão representativo). Sem perfil,     */
/*  sem score, sem fala inventada. AIPFIT: REGISTRATION_NOT_REQUESTED.  */
/* ------------------------------------------------------------------ */

import { CO_CREATION_CHAIN } from "./workLedgerModel";

const CHAIN_LABEL: Record<string, string> = {
  PRIMARY_HUMAN_INPUT: "input humano primário",
  FONTE_ATRIBUÍDA: "fonte atribuída",
  PESQUISA_RELACIONADA: "pesquisa relacionada",
  "DESENVOLVIMENTOS_MUSA2.X": "desenvolvimentos MUSA2.x",
  EXPERIMENTOS_PROTÓTIPOS: "experimentos / protótipos",
  CHECAGENS_DE_EVIDÊNCIA: "checagens de evidência",
  PERGUNTAS_DEVOLVIDAS: "perguntas devolvidas ao humano",
  CORREÇÃO_REFINAMENTO: "correção / refinamento",
  SUCESSOR_GOVERNADO: "sucessor governado",
};

export default function CoCreationLens({
  marks = [],
  questions = [],
  representative = true,
  compact = false,
}: {
  marks?: number[];
  questions?: string[];
  representative?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-seam bg-ink-950/70 ${compact ? "p-4" : "p-6"}`}>
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <h3 className="font-mono text-[10px] tracking-[0.26em] uppercase text-mist-500">Lente de co-criação</h3>
        {representative && (
          <span className="px-2 py-0.5 rounded-full border border-ember-400/50 text-ember-300 font-mono text-[8px] uppercase tracking-[0.16em]">
            representativo · demo
          </span>
        )}
        <span className="px-2 py-0.5 rounded-full border border-seam text-mist-500 font-mono text-[8px] uppercase tracking-[0.16em]">
          AIPFIT: REGISTRATION_NOT_REQUESTED
        </span>
      </div>

      <ol className="relative space-y-0" aria-label="Caminho de co-criação humana">
        <span className="absolute left-[7px] top-2 bottom-2 w-px bg-seam-strong" aria-hidden="true" />
        {CO_CREATION_CHAIN.map((stage, i) => {
          const reached = marks.includes(i);
          return (
            <li key={stage} className="relative flex items-start gap-3.5 py-1.5">
              <span
                className={`relative z-10 mt-0.5 grid place-items-center w-[15px] h-[15px] rounded-full border transition-colors duration-300 ${
                  reached ? "border-lumen-400 bg-lumen-500/25" : "border-mist-600/60 bg-ink-950"
                }`}
                aria-hidden="true"
              >
                {reached && <span className="w-[5px] h-[5px] rounded-full bg-lumen-300" />}
              </span>
              <span className={`text-[12px] leading-snug ${reached ? "text-mist-100" : "text-mist-600"}`}>
                <span className="font-mono text-[9px] tracking-[0.14em] uppercase mr-2">{String(i + 1).padStart(2, "0")}</span>
                {CHAIN_LABEL[stage] ?? stage}
                {reached && <span className="sr-only"> — alcançado</span>}
              </span>
            </li>
          );
        })}
      </ol>

      {questions.length > 0 && (
        <div className="mt-4 border-t border-seam pt-3.5">
          <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-gild-300/90 mb-2">perguntas devolvidas ao humano</p>
          <ul className="space-y-1.5">
            {questions.map((q) => (
              <li key={q} className="text-[12px] text-mist-300 leading-relaxed flex gap-2">
                <span className="text-gild-300 shrink-0" aria-hidden="true">→</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-[10px] text-mist-600 leading-relaxed font-mono">
        SOURCE_SHARED_BY ≠ AUTHOR · sem perfil, sem score, sem fala inventada
      </p>
    </div>
  );
}
