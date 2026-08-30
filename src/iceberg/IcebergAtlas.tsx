/* ------------------------------------------------------------------ */
/*  ICEBERG · atlas profundo — composição (P4)                         */
/* ------------------------------------------------------------------ */

import { useRef } from "react";
import { createDepthStore, useDepthScroll, useDepthZone, DepthField, DepthGauge, type DepthStore } from "./depth";
import { OpeningStratum, WaveDivider, ConvergenceStratum, CurrentnessStratum, EvidenceStratum, OntogenesisStratum, SeabedStratum } from "./Strata";

const ZONE_BG = [
  "bg-[#0a2531]", // ar — iluminado
  "bg-[#082028]", // água
  "bg-[#041016]", // abisso
];

export default function IcebergAtlas() {
  const storeRef = useRef<DepthStore | null>(null);
  if (!storeRef.current) storeRef.current = createDepthStore();
  const store = storeRef.current;

  useDepthScroll(store);
  const zone = useDepthZone(store, [6, 90]);

  return (
    <div className={`relative min-h-screen text-mist-200 font-body transition-colors duration-1000 ${ZONE_BG[zone]}`}>
      <div className="noise-overlay" aria-hidden="true" />
      <DepthField store={store} />
      <DepthGauge store={store} />

      <a
        href="#conteudo-atlas"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById("conteudo-atlas");
          el?.focus();
          el?.scrollIntoView?.();
        }}
        className="skip-link"
      >
        pular para o conteúdo do atlas
      </a>

      <div className="relative z-10" id="conteudo-atlas" tabIndex={-1}>
        <OpeningStratum />
        <WaveDivider />
        <ConvergenceStratum />
        <CurrentnessStratum />
        <EvidenceStratum />
        <OntogenesisStratum />
        <SeabedStratum />
      </div>
    </div>
  );
}
