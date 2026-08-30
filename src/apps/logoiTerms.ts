/* ------------------------------------------------------------------ */
/*  Holo-Logoi · ledger governado de termos (P0)                       */
/*  Cada termo: definição, linhagem, currentness, evidência, valor.    */
/* ------------------------------------------------------------------ */

import type { Currentness, SourceReference } from "../registry/model";

export type LogoiState = Currentness;

export interface LogoiTerm {
  id: string;
  term: string;
  aliases: string[];
  definition: string;
  state: LogoiState;
  rung: number;
  basis: string;
  lineage: SourceReference[];
  related: string[];
  registryIds: string[];
  positiveNote: string;
}

const O = "2026-08-30";
const portal = (label: string, path?: string, why?: string): SourceReference => ({
  id: `lg-src-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  sourceClass: "portal-html",
  label,
  role: "primary",
  access: "public",
  safeUrl: path ? `https://huihho.com${path}` : undefined,
  observedAt: O,
  whyWeBelieveThis: why ?? "Termo publicado no portal canônico (observação externa).",
});
const local = (label: string, why: string): SourceReference => ({
  id: `lg-local-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  sourceClass: "local-source",
  label,
  role: "derivative",
  access: "public",
  observedAt: O,
  whyWeBelieveThis: why,
});

export const LOGOI_TERMS: LogoiTerm[] = [
  {
    id: "lg-holomnisphere",
    term: "HolOmnisphere",
    aliases: ["HOS", "esfera holomni"],
    definition:
      "Campo infinitamente aninhável, omni-layerable e navegável por perspectivas holomni-kaleidoscópicas. Nesta instância, é representação visual e de pesquisa — VISUAL_PROJECTION ≠ ACCEPTED_ONTOMORPHIC_MODEL.",
    state: "research",
    rung: 2,
    basis: "Representada e descrita no portal; modelo ontomórfico aceito ainda não declarado.",
    lineage: [portal("HolOmnisphere — BeHolder perspective", "/holomniverse"), local("visuals.tsx — HolOmnisphere SVG", "Instrumento visual deste protótipo, rotulado como projeção.")],
    related: ["lg-beholder", "lg-qcore", "lg-holon"],
    registryIds: ["holomniverse-root", "tool-beholder-explorer"],
    positiveNote: "Uma intuição espacial poderosa para conhecimento aninhado — o explorer já a torna navegável.",
  },
  {
    id: "lg-beholder",
    term: "BeHolder",
    aliases: ["perspectiva do observador"],
    definition:
      "Perspectiva de navegação. Centro visual não implica autoridade: cada ponto pode abrir novas camadas sem perder identidade ou proveniência. Posição muda a projeção, nunca a hierarquia.",
    state: "current",
    rung: 4,
    basis: "Princípio publicado no portal e praticado no explorer: o deslocamento do observador é exibido como projeção, com anotação explícita.",
    lineage: [portal("BeHolder perspective", "/holomniverse/beholder"), local("Explorer — parallax do observador", "Implementado como deslocamento de anéis com leitura de coordenadas.")],
    related: ["lg-holomnisphere", "lg-nao-colapso"],
    registryIds: ["cap-beholder", "tool-beholder-explorer"],
    positiveNote: "Princípio ético disfarçado de princípio de design — exportável para qualquer interface de poder distribuído.",
  },
  {
    id: "lg-qcore",
    term: "QCORE",
    aliases: ["núcleo de coerência"],
    definition:
      "Função de coerência no centro da esfera — não trono de autoridade. Mantém identidade e proveniência enquanto camadas se multiplicam.",
    state: "research",
    rung: 2,
    basis: "Descrito no portal como função de coerência; instrumentação em aberto.",
    lineage: [portal("HolOmnisphere — núcleo geométrico", "/holomniverse")],
    related: ["lg-holomnisphere", "lg-holon"],
    registryIds: ["holomniverse-root"],
    positiveNote: "Nomeia a diferença entre consistência e comando — útil em qualquer arquitetura federada.",
  },
  {
    id: "lg-holon",
    term: "Holon",
    aliases: ["holons"],
    definition:
      "Entidade que é simultaneamente todo e parte. Na constelação, cada building block é um holon: raiz de si, parte da arquitetura.",
    state: "current",
    rung: 3,
    basis: "Operacionalizado no registry: todo registro é inspecionável isoladamente e navegável como parte da árvore fractal.",
    lineage: [portal("Holons — pontos da esfera", "/holomniverse"), local("registry/fractal.ts", "Cada registro é nó navegável em ROOT/DOMAIN/TOPIC/PROVENANCE.")],
    related: ["lg-holomnisphere", "lg-qcore"],
    registryIds: ["hui-meta"],
    positiveNote: "O vocabulário que impede a arquitetura de escolher entre unidade e pluralidade.",
  },
  {
    id: "lg-iceberg",
    term: "ICEBERG",
    aliases: ["International Convergence of Ecosystems Giving Birth to an Era of Regenerative Growth"],
    definition:
      "Primeiro evento ontogônico da constelação e seu atlas profundo: convergência, currentness, evidência e camadas progressivas. HUI ≠ ICEBERG: presença relacional, não identidade.",
    state: "candidate",
    rung: 3,
    basis: "Rota /iceberg publicada com ACCEPTED CODE; o atlas local é protótipo registry-driven; vigência externa não verificada.",
    lineage: [portal("ICEBERG — mapa canônico", "/iceberg"), local("src/iceberg/*", "Atlas profundo local, derivado e rotulado.")],
    related: ["lg-currentness", "lg-proveniencia"],
    registryIds: ["iceberg-root", "iceberg-deep-atlas"],
    positiveNote: "A metáfora que ensina a arquitetura a mostrar a linha d'água do próprio conhecimento.",
  },
  {
    id: "lg-currentness",
    term: "Currentness",
    aliases: ["correnteza", "freshness"],
    definition:
      "Estado temporal epistêmico de um bloco: current, candidate, binding-candidate, prototype, predecessor, research, held, historical, unknown. É sobre o tempo da afirmação, não sobre valor.",
    state: "current",
    rung: 4,
    basis: "Vocabulário controlado implementado no registry e praticado nas lentes e no atlas.",
    lineage: [portal("ICEBERG — currentness", "/iceberg"), local("registry/model.ts — CURRENTNESS", "Nove valores controlados com rótulos.")],
    related: ["lg-iceberg", "lg-evidencia", "lg-accepted-code"],
    registryIds: ["hui-meta"],
    positiveNote: "Separar tempo de valor é o que permite reter predecessores com dignidade.",
  },
  {
    id: "lg-evidencia",
    term: "Escada de evidência",
    aliases: ["evidence ladder", "evidência & proveniência"],
    definition:
      "Sete degraus governantes: visão → desenho → representação → corroboração → verificação → aprovação → vigência. A escada não é redefinida silenciosamente por ferramenta alguma.",
    state: "current",
    rung: 4,
    basis: "Publicada no portal e implementada sem alteração no registry, no atlas e no ledger.",
    lineage: [portal("Evidência & Proveniência", "/evidence"), local("registry/model.ts — EVIDENCE_RUNGS", "Sete degraus, ordem idêntica à publicada.")],
    related: ["lg-currentness", "lg-vigencia", "lg-readback"],
    registryIds: ["route-evidence"],
    positiveNote: "A régua comum que deixa qualquer discordância discutível em público.",
  },
  {
    id: "lg-proveniencia",
    term: "Proveniência",
    aliases: ["provenance", "linhagem"],
    definition:
      "De onde vem cada afirmação: classe de fonte, papel (primária/derivada/síntese), acesso (público/protegido), data de observação, SHA quando conhecida, e WHY_DO_WE_BELIEVE_THIS.",
    state: "current",
    rung: 4,
    basis: "Implementada em toda SourceReference do registry; material protegido expõe apenas metadado seguro.",
    lineage: [portal("Evidência & Proveniência", "/evidence"), local("registry/model.ts — SourceReference", "Campos mínimos de proveniência aplicados a todos os blocos.")],
    related: ["lg-evidencia", "lg-readback"],
    registryIds: ["hui-meta"],
    positiveNote: "Proveniência é memória institucional: sem ela, toda afirmação é órfã.",
  },
  {
    id: "lg-readback",
    term: "Readback",
    aliases: ["leitura externa"],
    definition:
      "Confirmação externa de que um destino deployado responde como esperado. LIVE só após deployment autenticado E leitura externa do destino. ACCEPTED ≠ DEPLOYED ≠ READBACK ≠ INDEXED.",
    state: "current",
    rung: 4,
    basis: "Regra publicada no portal (arquitetura de publicação) e aplicada neste protótipo, que declara readback externo pendente.",
    lineage: [portal("Arquitetura de publicação — Readback", "/architecture"), local("rodapé do portal", "protótipo interim · readback externo pendente")],
    related: ["lg-evidencia", "lg-accepted-code", "lg-vigencia"],
    registryIds: ["hui-meta"],
    positiveNote: "O hábito que impede a arquitetura de acreditar nos próprios rascunhos.",
  },
  {
    id: "lg-accepted-code",
    term: "ACCEPTED CODE",
    aliases: ["código aceito"],
    definition:
      "Marco de aceitação em source. Não implica publicação, deployment, readback, indexação ou vigência — cada estágio tem seu próprio estado e sua própria evidência.",
    state: "candidate",
    rung: 3,
    basis: "Rótulo observado no mapa publicado; sua semântica foi explicitamente separada de LIVE neste protótipo.",
    lineage: [portal("Mapa canônico — ACEITO", "/"), local("LEGEND corrigida em data.ts", "Aceito ≠ publicado ≠ deployado ≠ live.")],
    related: ["lg-readback", "lg-vigencia", "lg-evidencia"],
    registryIds: ["route-iceberg"],
    positiveNote: "Um rótulo que, bem definido, vale por um processo de release inteiro.",
  },
  {
    id: "lg-vigencia",
    term: "Vigência",
    aliases: ["vigência institucional"],
    definition:
      "Estágio final da escada: o que está valendo institucionalmente, com aprovação e readback. Nada neste protótipo declara vigência que não possa sustentar.",
    state: "held",
    rung: 2,
    basis: "Conceito publicado; nenhum bloco local atinge o degrau sem evidência de aprovação + leitura externa.",
    lineage: [portal("Cadeia epistêmica — vigência", "/evidence")],
    related: ["lg-evidencia", "lg-readback"],
    registryIds: ["route-evidence"],
    positiveNote: "Reservar o degrau mais alto é o que o mantém alto.",
  },
  {
    id: "lg-nao-colapso",
    term: "Não-colapso",
    aliases: ["non-collapse"],
    definition:
      "Compartilhar infraestrutura não implica governança, autoridade, ativos, responsabilidade ou identidade institucional compartilhadas. HUI ≠ ICEBERG ≠ ARTE ≠ PRA AMAR ≠ RIR.",
    state: "current",
    rung: 4,
    basis: "Regra publicada no portal e testada no registry: identidades distintas permanecem distintas em dados e em UI.",
    lineage: [portal("Topologia — Não-colapso", "/architecture"), local("registry.test.ts", "Teste explícito de não-colapso HUI/ICEBERG.")],
    related: ["lg-beholder", "lg-holon"],
    registryIds: ["hui-meta", "iceberg-root"],
    positiveNote: "A cláusula que deixa ecossistemas cooperarem sem desaparecerem um no outro.",
  },
  {
    id: "lg-abundancia",
    term: "Programa Abundância",
    aliases: ["Abundance Program"],
    definition:
      "Frente de bem-estar regenerativo e acesso: produtos, serviços, prosumo e apoio comunitário. Manifestações públicas existem; vigência institucional segue seu próprio processo.",
    state: "predecessor",
    rung: 2,
    basis: "Apresentações públicas retidas (Gamma) e manifestação de ecossistema (Lovable); estados são de linhagem, não de vigência.",
    lineage: [portal("The Abundance Program", "/architecture"), local("constelação — manifestações", "Duas manifestações públicas retidas com rótulo.")],
    related: ["lg-h2o", "lg-nao-colapso"],
    registryIds: ["mani-abundance-gamma", "mani-abundance-eco"],
    positiveNote: "A frente que mantém a arquitetura apontada para a vida material das pessoas.",
  },
  {
    id: "lg-h2o",
    term: "H2O · World Trade Village",
    aliases: ["WTV", "H2O WTV"],
    definition:
      "Vila de comércio mundial como artefato preparatório de design e comunicação. Retido como linhagem; não declarado operacional.",
    state: "historical",
    rung: 1,
    basis: "Manifestação Gamma retida como artefato preparatório; sem evidência de operação.",
    lineage: [portal("World Trade Village", "/ecosystems"), local("constelação — manifestação Gamma", "Artefato preparatório retido.")],
    related: ["lg-abundancia"],
    registryIds: ["mani-wtv"],
    positiveNote: "Mesmo preparatório, treinou a arquitetura a pensar em troca como infraestrutura de confiança.",
  },
];

export const LOGOI_STATES: { id: LogoiState; label: string }[] = [
  { id: "current", label: "corrente" },
  { id: "candidate", label: "candidato" },
  { id: "research", label: "pesquisa" },
  { id: "predecessor", label: "predecessor" },
  { id: "historical", label: "histórico" },
  { id: "held", label: "retido" },
];
