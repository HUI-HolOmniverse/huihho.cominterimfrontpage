/* ------------------------------------------------------------------ */
/*  Ciclo Vivo · Work Ledger — histórico real de trabalho/co-criação   */
/*  SHAs reais quando conhecidos; NUNCA inventados. Sem rankings,      */
/*  scores ou métricas reputacionais. SOURCE_SHARED_BY != AUTHOR.      */
/* ------------------------------------------------------------------ */

export const CONTRIBUTOR_ROLES = [
  "SOURCE_AUTHOR",
  "COAUTHOR",
  "CONTRIBUTOR",
  "RESEARCHER",
  "IMPLEMENTER",
  "REVIEWER",
  "AI_ASSISTED",
  "SOURCE_SHARED_BY",
  "UNRESOLVED_ATTRIBUTION",
] as const;
export type ContributorRole = (typeof CONTRIBUTOR_ROLES)[number];

export const AUTHORSHIP_STATES = [
  "AUTHOR_CONFIRMED",
  "COAUTHOR_CONFIRMED",
  "ATTRIBUTION_PROBABLE",
  "ATTRIBUTION_UNRESOLVED",
  "SOURCE_SHARED_BY_SERGIO",
  "SERGIO_DIALOGUE_CONTRIBUTION",
  "SERGIO_TRIGGERED_DERIVATIVE_WORK",
  "THIRD_PARTY_SOURCE",
  "AI_DERIVED",
] as const;
export type AuthorshipState = (typeof AUTHORSHIP_STATES)[number];

export const WORK_TYPES = [
  "PORTAL_BUILD",
  "TOOL_BUILD",
  "RESEARCH",
  "CO_CREATION_PATTERN",
  "TEST_SUITE",
  "BACKEND_CONTRACT",
  "GOVERNANCE",
] as const;
export type WorkType = (typeof WORK_TYPES)[number];

/** A cadeia de desigualdades — cada estágio NÃO implica o seguinte. */
export const IMPLEMENTATION_STATES = [
  "PROPOSED",
  "IMPLEMENTED",
  "TESTED",
  "ASSURED",
  "ACCEPTED",
  "MERGED",
  "DEPLOYED",
  "EXTERNALLY_READ_BACK",
] as const;
export type ImplementationState = (typeof IMPLEMENTATION_STATES)[number];

export interface Contributor {
  name: string;
  role: ContributorRole;
  attribution: AuthorshipState;
  representative?: boolean;
}

/** Cadeia transversal da Lente de Co-Criação (padrão Sérgio). */
export const CO_CREATION_CHAIN = [
  "PRIMARY_HUMAN_INPUT",
  "FONTE_ATRIBUÍDA",
  "PESQUISA_RELACIONADA",
  "DESENVOLVIMENTOS_MUSA2.X",
  "EXPERIMENTOS_PROTÓTIPOS",
  "CHECAGENS_DE_EVIDÊNCIA",
  "PERGUNTAS_DEVOLVIDAS",
  "CORREÇÃO_REFINAMENTO",
  "SUCESSOR_GOVERNADO",
] as const;

export interface WorkEntry {
  workId: string;
  timestamp: string;
  title: string;
  workType: WorkType;
  sourceRefs: string[];
  parentRefs: string[];
  gitSha?: string; /* somente quando realmente conhecido */
  branch?: string;
  testCount?: number;
  testState: "NOT_RUN" | "PASSED_IN_SANDBOX" | "PASSED_IN_CI" | "FAILED" | "NOT_APPLICABLE";
  implementationState: ImplementationState;
  humanContributors: Contributor[];
  aiContributors: Contributor[];
  authorshipState: AuthorshipState;
  evidenceState: string;
  successorRefs: string[];
  notes: string;
  representative?: boolean; /* DEMO / REPRESENTATIVE — sempre visível */
  registryRefs?: string[]; /* ids de blocos relacionados (handoff) */
  chainMarks?: number[]; /* estágios alcançados na CO_CREATION_CHAIN */
  questionsReturned?: string[];
}

/* ------------------------------------------------------------------ */
/*  Registros reais — SHAs observados neste ambiente de trabalho.      */
/*  Nada aqui é inventado: onde o SHA não foi cunhado, o campo falta.  */
/* ------------------------------------------------------------------ */

export const WORK_ENTRIES: WorkEntry[] = [
  {
    workId: "w-portal-pr1",
    timestamp: "2026-08-30",
    title: "Portal interim huihho — referência de rota canônica (PR #1)",
    workType: "PORTAL_BUILD",
    sourceRefs: ["huihho.cominterimfrontpage · PR #1", "huihho.com (observação pública)"],
    parentRefs: [],
    gitSha: "9e6a2e10235787314aac162480e051f41d38b41c",
    branch: "huihho.cominterimfrontpage",
    testState: "NOT_RUN",
    implementationState: "IMPLEMENTED",
    humanContributors: [{ name: "Fundador HUI", role: "CONTRIBUTOR", attribution: "ATTRIBUTION_UNRESOLVED" }],
    aiContributors: [{ name: "Qwen", role: "IMPLEMENTER", attribution: "AI_DERIVED" }],
    authorshipState: "ATTRIBUTION_UNRESOLVED",
    evidenceState: "REPORTED — commit observado remotamente em 2026-08-30",
    successorRefs: ["w-ciclo-ferramentas"],
    notes: "Head do PR #1 re-lido antes da escrita; head não havia se movido. PROTOTYPE ≠ PRODUCTION mantido. Autoria não confirmada por fonte primária estável — atribuição mantida não resolvida.",
    registryRefs: ["prototype-interim-frontpage", "hui-meta"],
  },
  {
    workId: "w-ciclo-ferramentas",
    timestamp: "2026-08-31",
    title: "Tranche de ferramentas: Explorer · Logoi · Snapshot · Intake · Treasure Drop · Triage",
    workType: "TOOL_BUILD",
    sourceRefs: ["árvore de trabalho do sandbox", "HUI-Mater-Core · PR #115 (0ead934b3f032cb265afa2770437ac3befd95838)"],
    parentRefs: ["w-portal-pr1"],
    gitSha: "0ead934b3f032cb265afa2770437ac3befd95838", /* PR #115 — First Cycle tools */
    branch: "qwen/hui-hho-first-cycle-web-v0-1",
    testCount: 79,
    testState: "PASSED_IN_SANDBOX",
    implementationState: "TESTED",
    humanContributors: [{ name: "Fundador HUI", role: "CONTRIBUTOR", attribution: "ATTRIBUTION_UNRESOLVED" }],
    aiContributors: [
      { name: "Qwen", role: "IMPLEMENTER", attribution: "AI_DERIVED" },
      { name: "Qwen", role: "AI_ASSISTED", attribution: "AI_DERIVED" },
    ],
    authorshipState: "ATTRIBUTION_UNRESOLVED",
    evidenceState: "Suite Vitest executada em sandbox (79/79) — assurance independente pendente",
    successorRefs: ["w-ciclo-vivo"],
    notes:
      "First Cycle tools colhidos em PR #115 (head 0ead934b…). Parent canônico pretendido: bca6afd52e04d99fe15413508a8738e02c9c24c9. TESTED ≠ ASSURED. Autoria humana não confirmada por fonte primária estável.",
    registryRefs: ["tool-intake-studio", "tool-snapshot-diff", "tool-treasure-drop", "tool-triage-workbench", "tool-beholder-explorer", "tool-holo-logoi"],
  },
  {
    workId: "w-ciclo-vivo",
    timestamp: "2026-08-31",
    title: "Ciclo Vivo: Lineage Graph · Work Ledger · Readback Console · Lente de Co-Criação",
    workType: "TOOL_BUILD",
    sourceRefs: ["árvore de trabalho do sandbox", "HUI-Mater-Core · PR #116 (a05fca1610af08170f52803b5fb55c5b01e38125)"],
    parentRefs: ["w-ciclo-ferramentas"],
    gitSha: "a05fca1610af08170f52803b5fb55c5b01e38125", /* PR #116 — Ciclo Vivo */
    branch: "qwen/ciclo-vivo-first-cycle-v0-1",
    testCount: 87,
    testState: "PASSED_IN_SANDBOX",
    implementationState: "TESTED",
    humanContributors: [{ name: "Fundador HUI", role: "CONTRIBUTOR", attribution: "ATTRIBUTION_UNRESOLVED" }],
    aiContributors: [{ name: "Qwen", role: "IMPLEMENTER", attribution: "AI_DERIVED" }],
    authorshipState: "ATTRIBUTION_UNRESOLVED",
    evidenceState: "PR #116: 87 testes passaram · 0 falhas · typecheck PASS · build PASS (execução observada no destino)",
    successorRefs: ["w-assurance-blockers"],
    notes: "Ciclo Vivo colhido em PR #116 (head a05fca16…). Interconexão explícita entre linhagem, trabalho, readback e co-criação; sem mutação do Registry vivo. Autoria humana não confirmada por fonte primária estável.",
    registryRefs: ["tool-lineage-graph", "tool-work-ledger", "tool-readback-console"],
  },
  {
    workId: "w-assurance-blockers",
    timestamp: "2026-08-31",
    title: "Correções de assurance: corroboração de readback · fail-closed localStorage · demo sintético anônimo · receipt de gateway",
    workType: "GOVERNANCE",
    sourceRefs: ["árvore de trabalho do sandbox", "HUI-Mater-Core · parent revisado a05fca1610af08170f52803b5fb55c5b01e38125 (PR #116)"],
    parentRefs: ["w-ciclo-vivo"],
    gitSha: undefined, /* RESULTING_SHA não cunhável no sandbox — jamais inventado */
    branch: "fix/ciclo-vivo-assurance-blockers-v0-1",
    testState: "PASSED_IN_SANDBOX",
    implementationState: "TESTED",
    humanContributors: [{ name: "Fundador HUI", role: "CONTRIBUTOR", attribution: "ATTRIBUTION_UNRESOLVED" }],
    aiContributors: [{ name: "Qwen", role: "IMPLEMENTER", attribution: "AI_DERIVED" }],
    authorshipState: "ATTRIBUTION_UNRESOLVED",
    evidenceState: "REPORTED — correções implementadas e suíte executada no sandbox; execução de destino a confirmar",
    successorRefs: [],
    notes:
      "Tranche de correção sobre fix/ciclo-vivo-assurance-blockers-v0-1 (parent a05fca16…). Endurece: corroboração estruturada p/ CORROBORATED/VERIFIED, revalidação fail-closed de readbacks persistidos, demo sintético anônimo sem export de evidência, receipt de gateway fail-closed (INVALID_GATEWAY_RECEIPT). Sem publicação, sem remoção de noindex/robots.",
    registryRefs: ["tool-readback-console", "tool-triage-workbench", "tool-treasure-drop"],
  },

  /* ---------------- padrão representativo de co-criação humana (DEMO rotulado) ---------------- */

  {
    workId: "w-sergio-leiteria",
    timestamp: "2026-08-31",
    title: "Leiteria Vegetal — padrão representativo de co-criação (DEMO)",
    workType: "CO_CREATION_PATTERN",
    sourceRefs: ["padrão de diálogo documentado — não é fonte governada real"],
    parentRefs: [],
    testState: "NOT_APPLICABLE",
    implementationState: "PROPOSED",
    humanContributors: [{ name: "Sérgio “Da Floresta”", role: "SOURCE_SHARED_BY", attribution: "SOURCE_SHARED_BY_SERGIO", representative: true }],
    aiContributors: [],
    authorshipState: "SOURCE_SHARED_BY_SERGIO",
    evidenceState: "REPRESENTATIVE — sem fonte governada; nenhuma fala atribuída",
    successorRefs: [],
    notes:
      "Exemplo do ciclo: descoberta humana → preservação → estrutura posterior. SOURCE_SHARED_BY != AUTHOR. AIPFIT: REGISTRATION_NOT_REQUESTED.",
    representative: true,
    chainMarks: [0, 1, 6],
    questionsReturned: ["Leiteria é produto, território ou ambos?", "Quem mais participou da origem desta ideia?"],
  },
  {
    workId: "w-sergio-castanhas",
    timestamp: "2026-08-31",
    title: "Castanhas & agro-bio Poconé/Niquelândia — padrão representativo (DEMO)",
    workType: "CO_CREATION_PATTERN",
    sourceRefs: ["tema citado como exemplo na direção fundadora — sem material real anexado"],
    parentRefs: [],
    testState: "NOT_APPLICABLE",
    implementationState: "PROPOSED",
    humanContributors: [{ name: "Sérgio “Da Floresta”", role: "SOURCE_SHARED_BY", attribution: "SERGIO_TRIGGERED_DERIVATIVE_WORK", representative: true }],
    aiContributors: [],
    authorshipState: "ATTRIBUTION_UNRESOLVED",
    evidenceState: "REPRESENTATIVE — atribuição não resolvida por desenho",
    successorRefs: [],
    notes: "Atribuição mantida como não resolvida até confirmação humana. Nunca inventar fala ou autoria.",
    representative: true,
    chainMarks: [0, 5, 6],
    questionsReturned: ["A observação de mercado é pessoal ou claim externo?", "Existe contribuição criativa atribuível?"],
  },
];

/* ---------------- guardas semânticas ---------------- */

/** Não há campo numérico de score/ranking em nenhum registro. */
export function assertNoRankings(entries: WorkEntry[]): boolean {
  const forbidden = ["score", "rank", "rating", "reputation", "points", "karma"];
  return entries.every((e) => Object.keys(e).every((k) => !forbidden.some((f) => k.toLowerCase().includes(f))));
}

export function entryById(id: string): WorkEntry | undefined {
  return WORK_ENTRIES.find((e) => e.workId === id);
}
