/* ------------------------------------------------------------------ */
/*  huihho.com · portal canônico — camada de conteúdo                  */
/* ------------------------------------------------------------------ */

export type EpistemicStatus =
  | "ACCEPTED CODE"
  | "CANDIDATE"
  | "binding-candidate"
  | "future-runtime"
  | "reserved-until-hardened";

export interface CanonicalRoute {
  area: string;
  name: string;
  path: string;
  desc: string;
  status: EpistemicStatus;
}

export const CANON: CanonicalRoute[] = [
  {
    area: "Ontogênese",
    name: "ICEBERG",
    path: "/iceberg",
    desc: "Atlas do primeiro evento ontogônico: International Convergence of Ecosystems Giving Birth to an Era of Regenerative Growth.",
    status: "ACCEPTED CODE",
  },
  {
    area: "Experiência",
    name: "HolOmniverse",
    path: "/holomniverse",
    desc: "Entrada conceitual para a esfera navegacional Beholder-centered e suas camadas progressivas.",
    status: "CANDIDATE",
  },
  {
    area: "Conhecimento",
    name: "Holo-Logoi",
    path: "/holo-logoi",
    desc: "Conhecimento, significado, proveniência, linguagem e memória viva governada.",
    status: "CANDIDATE",
  },
  {
    area: "Meta-arquitetura",
    name: "Arquitetura",
    path: "/architecture",
    desc: "HUI, H2O, Programa Abundância, ICEBERG e as distinções entre meta, meso, runtime e interfaces.",
    status: "CANDIDATE",
  },
  {
    area: "Interoperabilidade",
    name: "Ecossistemas",
    path: "/ecosystems",
    desc: "Ecossistemas paralelos e autônomos conectados por interfaces explícitas, sem fusão institucional.",
    status: "CANDIDATE",
  },
  {
    area: "Ação",
    name: "Iniciativas",
    path: "/initiatives",
    desc: "Registro público de iniciativas e frentes representáveis, com currentness e limites explícitos.",
    status: "CANDIDATE",
  },
  {
    area: "Pessoas",
    name: "Participar",
    path: "/participate",
    desc: "Formas progressivas de conhecer, contribuir, deliberar, cultivar conhecimento e construir capacidades.",
    status: "CANDIDATE",
  },
  {
    area: "Integridade",
    name: "Evidência & Proveniência",
    path: "/evidence",
    desc: "Como a HUI distingue visão, desenho, representação, corroboração, verificação, aprovação e vigência.",
    status: "CANDIDATE",
  },
  {
    area: "Identidade",
    name: "Sobre",
    path: "/about",
    desc: "Uma introdução pública à HUI como meta-arquitetura imaterial, processo e campo-movimento.",
    status: "CANDIDATE",
  },
  {
    area: "Entrada",
    name: "Entrada em português",
    path: "/eceaqui",
    desc: "Entrada pública em português para a HUI e suas experiências autorizadas.",
    status: "ACCEPTED CODE",
  },
  {
    area: "Interface federada",
    name: "ARTE · PRA AMAR & RIR",
    path: "/artepraamarerir",
    desc: "Navegação federada entre frentes distintas, preservando identidade, autoridade e responsabilidade próprias.",
    status: "ACCEPTED CODE",
  },
];

export const href = (path: string) => `https://huihho.com${path}`;

/* ---------- portas ---------- */
export interface Door {
  n: string;
  tag: string;
  name: string;
  desc: string;
  path: string;
  cta: string;
  status: EpistemicStatus;
  accent: "gild" | "lumen" | "ember";
  local?: { label: string; cta: string; hash: string };
}

export const DOORS: Door[] = [
  {
    n: "01",
    tag: "Ontogênese",
    name: "ICEBERG",
    desc: "Atlas profundo da convergência, currentness, evidência e camadas progressivas.",
    path: "/iceberg",
    cta: "Explorar",
    status: "ACCEPTED CODE",
    accent: "gild",
    local: { label: "experiência local · building block", cta: "iniciar descida", hash: "#/iceberg" },
  },
  {
    n: "02",
    tag: "Experiência",
    name: "HolOmniverse",
    desc: "Navegação Beholder-centered sem confundir projeção visual com autoridade.",
    path: "/holomniverse",
    cta: "Entrar",
    status: "CANDIDATE",
    accent: "lumen",
  },
  {
    n: "03",
    tag: "Conhecimento",
    name: "Holo-Logoi",
    desc: "Significado, proveniência, memória, currentness e evolução semântica.",
    path: "/holo-logoi",
    cta: "Cultivar",
    status: "CANDIDATE",
    accent: "ember",
  },
];

/* ---------- tecido de capacidades ---------- */
export interface Capability {
  tag: string;
  name: string;
  desc: string;
  cta: string;
  path: string;
  external?: boolean;
  launcher?: boolean;
}

export const CAPABILITIES: Capability[] = [
  {
    tag: "EXPLORER",
    name: "Explorador de capacidades",
    desc: "Índice visual da constelação pública: HUI, ICEBERG, Holo-Logoi, iniciativas, participação, interfaces federadas e manifestações predecessoras.",
    cta: "Abrir o explorador",
    path: "/capabilities",
  },
  {
    tag: "LAUNCHER",
    name: "Buscar · Ctrl/Cmd K",
    desc: "Lançador acessível por teclado e por botão. Também funciona em ecrãs estreitos, sem depender de hover.",
    cta: "Buscar capacidades",
    path: "#",
    launcher: true,
  },
  {
    tag: "SOURCE-INTEGRATED",
    name: "HolOmniverse Explorer",
    desc: "Experiência canônica do aplicativo já presente em source. Runtime standalone continua explicitamente separado.",
    cta: "Entrar na experiência",
    path: "/holomniverse/explorer",
  },
];

export const EXTRA_LINKS = [
  { name: "BeHolder", path: "/holomniverse/beholder", desc: "O observador participa da navegação sem transformar posição visual em hierarquia." },
  { name: "Navegação fractal", path: "/holomniverse/navigation", desc: "Aprofunde ROOT → DOMAIN → TOPIC → PROVENANCE preservando identidade e contexto." },
  { name: "Mother Kernel", path: "/architecture/application-fabric", desc: "Lógica, dados, conhecimento, inteligência e funções compartilhadas podem manifestar-se em múltiplas aplicações sem monolitismo." },
];

/* ---------- legenda epistêmica ---------- */
export const LEGEND: { status: EpistemicStatus; meaning: string; tone: "gild" | "lumen" | "mist" | "ember" }[] = [
  { status: "ACCEPTED CODE", meaning: "Aceitação publicada em source. Não declara deploy, readback externo ou vigência — ACCEPTED ≠ DEPLOYED ≠ LIVE.", tone: "gild" },
  { status: "CANDIDATE", meaning: "Candidata: desenho público em amadurecimento, sem vigência declarada.", tone: "lumen" },
  { status: "binding-candidate", meaning: "Vínculo em candidatura: contrato público proposto, aguardando enduro.", tone: "lumen" },
  { status: "future-runtime", meaning: "Runtime futuro: isolamento técnico justificado, ainda não instanciado.", tone: "mist" },
  { status: "reserved-until-hardened", meaning: "Reservado até endurecimento público: nada aponta para wnętrgios privilegiados.", tone: "ember" },
];

/* ---------- topologia runtime ---------- */
export interface Subdomain {
  host: string;
  badge: string;
  tone: "lumen" | "mist" | "ember";
  desc: string;
  contract: string;
  contractTag: string;
}

export const SUBDOMAINS: Subdomain[] = [
  {
    host: "holo.huihho.com",
    badge: "binding-candidate",
    tone: "lumen",
    desc: "Experiência interativa própria, ciclo de release e carga de renderização separáveis do portal canônico.",
    contract: "Experiência pública do HolOmniverse; sem estado privilegiado ou controle interno.",
    contractTag: "hui-holomniverse-explorer",
  },
  {
    host: "knowledge.huihho.com",
    badge: "future-runtime",
    tone: "mist",
    desc: "Busca, indexação e consulta de conhecimento beneficiam-se de escala, cache e observabilidade independentes.",
    contract: "Somente conhecimento liberado para publicação, com proveniência e estado epistêmico.",
    contractTag: "public-knowledge-observatory",
  },
  {
    host: "status.huihho.com",
    badge: "future-runtime",
    tone: "mist",
    desc: "Status público deve continuar legível mesmo quando outros runtimes falham; isolamento melhora contenção de falhas.",
    contract: "Saúde e disponibilidade públicas; nunca sala de controle, incidentes sensíveis ou segredos.",
    contractTag: "public-status-edge",
  },
  {
    host: "api.huihho.com",
    badge: "reserved-until-hardened",
    tone: "ember",
    desc: "Uma API pública merece rate limiting, CORS, autenticação opcional, observabilidade e versionamento próprios.",
    contract: "Reservado até existir edge público hardened; não apontar para CIP interno ou Supabase privilegiado.",
    contractTag: "public-api-edge",
  },
];

/* ---------- participação ---------- */
export const CROWD = [
  {
    n: "I",
    name: "Crowd-Sourced",
    path: "/participate/crowd-sourced",
    desc: "Intakes progressivos com consentimento, autoria, provenance e triage.",
    tags: ["consentimento", "autoria", "provenance", "triage"],
  },
  {
    n: "II",
    name: "Crowd-Built",
    path: "/participate/crowd-built",
    desc: "Módulos e tranches com ownership explícito e revisão independente.",
    tags: ["ownership", "tranches", "revisão independente"],
  },
  {
    n: "III",
    name: "Crowd-Crowded",
    path: "/participate/crowd-crowded",
    desc: "Presença plural e comunidades com boundaries claros.",
    tags: ["presença plural", "boundaries", "comunidades"],
  },
];

/* ---------- publicação ---------- */
export const PUBLISHING = [
  {
    n: "01",
    name: "Fonte",
    desc: "Custódia e lineage permanecem distinguíveis da projeção.",
    tags: ["custódia", "lineage"],
  },
  {
    n: "02",
    name: "Derivação",
    desc: "Conteúdo público respeita evidence state, currentness e autorização.",
    tags: ["evidence state", "currentness", "autorização"],
  },
  {
    n: "03",
    name: "Runtime",
    desc: "Topologia técnica não redefine ontologia institucional.",
    tags: ["topologia", "separação"],
  },
  {
    n: "04",
    name: "Readback",
    desc: "LIVE só após deployment autenticado e leitura externa do destino.",
    tags: ["deploy autenticado", "leitura externa", "LIVE"],
  },
];

/* ---------- constelação de manifestações ---------- */
export interface Manifestation {
  source: "Lovable" | "Gamma";
  area: string;
  name: string;
  desc: string;
  url: string;
}

export const MANIFESTATIONS: Manifestation[] = [
  { source: "Lovable", area: "HUI / HolOmniverse", name: "HUI HHO Portal", desc: "Predecessor/parity portal exploring HUI, HolOmniverse, public navigation and progressive disclosure.", url: "https://hui-hho.lovable.app/" },
  { source: "Lovable", area: "Knowledge / Holo-Citizen", name: "Holo Nexus Archive", desc: "Archive-oriented manifestation combining chapters, participation, profiles and knowledge navigation.", url: "https://holo-nexus-archive.lovable.app/" },
  { source: "Lovable", area: "Q-Force / Deal OS", name: "Q-Force App", desc: "Deal-OS manifestation exploring network, deals, market, portfolio, governance, impact and risk workspaces.", url: "https://qforce-buddy-app.lovable.app/" },
  { source: "Lovable", area: "Regenerative wellbeing", name: "Abundant Life Network", desc: "Wellbeing and access-network prototype spanning products, services, prosumption and community support.", url: "https://summumbonum.lovable.app/" },
  { source: "Gamma", area: "CIESSM", name: "CIESSM Framework", desc: "Public framework presentation retained as an architectural and communication manifestation.", url: "https://ciessm-framework-xwpqixj.gamma.site/" },
  { source: "Gamma", area: "Abundance Program", name: "The Abundance Program", desc: "Public presentation of the Abundance Program retained for lineage, intent and communication archaeology.", url: "https://the-abundance-program-ro-00t8hnk.gamma.site/" },
  { source: "Gamma", area: "H2O WTV", name: "World Trade Village", desc: "World Trade Village manifestation retained as a preparatory design and communication artifact.", url: "https://world-trade-village-k3y7ual.gamma.site/" },
  { source: "Lovable", area: "Participation", name: "Ágoras", desc: "Participation and deliberation manifestation retained as a public experiential prototype.", url: "https://agoras.lovable.app/" },
  { source: "Lovable", area: "Holopolis", name: "Holopolis Collaboration Hub", desc: "Collaboration-hub manifestation for Holopolis retained as an interaction and coordination prototype.", url: "https://holopolis-collaboration-hub.lovable.app/" },
  { source: "Lovable", area: "Holopoly", name: "Holopoly", desc: "Ludic/systemic interaction manifestation retained as a public experiential building block.", url: "https://holopoly.lovable.app/" },
  { source: "Gamma", area: "Regenerative community architecture", name: "Smart Chaupal", desc: "Public whitepaper manifestation retained as a source and design-architecture reference.", url: "https://gamma.app/docs/Smart-Chaupal-Comprehensive-Whitepaper-lhcjcpzxivi7c9h?mode=doc" },
  { source: "Gamma", area: "Regenerative production", name: "Não Compre, Co-Plante", desc: "Co-planting and prosumption manifestation retained as a preparatory regenerative-production building block.", url: "https://nao-compre-co-plante-4imikjt.gamma.site/" },
  { source: "Lovable", area: "Abundance Program", name: "Ecossistema do Programa de Abundância", desc: "Public ecosystem manifestation of the Abundance Program retained for architecture and experience lineage.", url: "https://ecossistemadoprogramadeabundancia.lovable.app/" },
  { source: "Lovable", area: "Convergence", name: "Metaecossistema de Convergência", desc: "Meta-ecosystem convergence manifestation retained for ontology, architecture and interaction comparison.", url: "https://metaecossistemadeconvergencia.lovable.app/" },
  { source: "Lovable", area: "Experiential learning", name: "Maha Lila Awakening Game", desc: "Game-oriented manifestation retained as an experiential-navigation and learning building block.", url: "https://maha-lila-awakening-game.lovable.app/" },
];

/* ---------- lançador ---------- */
export type LauncherCategory =
  | "HUI"
  | "ICEBERG"
  | "Holo-Logoi"
  | "Iniciativas"
  | "Participação"
  | "Federadas"
  | "Manifestações";

export const LAUNCHER_CATS: LauncherCategory[] = [
  "HUI",
  "ICEBERG",
  "Holo-Logoi",
  "Iniciativas",
  "Participação",
  "Federadas",
  "Manifestações",
];

export interface LauncherItem {
  id: string;
  label: string;
  hint: string;
  url: string;
  category: LauncherCategory;
  kind: "rota" | "capacidade" | "manifestação";
  status?: string;
  external?: boolean;
  route?: string;
}

export const LAUNCHER_ITEMS: LauncherItem[] = [
  { id: "x-iceberg-local", label: "ICEBERG — Atlas profundo", hint: "experiência local · descida guiada por camadas, evidência e currentness", url: "", route: "/iceberg", category: "ICEBERG", kind: "capacidade", status: "ACCEPTED CODE" },
  { id: "r-iceberg", label: "ICEBERG · rota canônica", hint: "huihho.com/iceberg · atlas ontogônico da convergência", url: href("/iceberg"), category: "ICEBERG", kind: "rota", status: "ACCEPTED CODE", external: true },
  { id: "r-holomniverse", label: "HolOmniverse", hint: "/holomniverse · esfera navegacional Beholder-centered", url: href("/holomniverse"), category: "HUI", kind: "rota", status: "CANDIDATE", external: true },
  { id: "r-logoi", label: "Holo-Logoi", hint: "/holo-logoi · significado, proveniência e memória viva", url: href("/holo-logoi"), category: "Holo-Logoi", kind: "rota", status: "CANDIDATE", external: true },
  { id: "r-arch", label: "Arquitetura", hint: "/architecture · meta, meso, runtime e interfaces", url: href("/architecture"), category: "HUI", kind: "rota", status: "CANDIDATE", external: true },
  { id: "r-eco", label: "Ecossistemas", hint: "/ecosystems · paralelos e autônomos, interfaces explícitas", url: href("/ecosystems"), category: "Federadas", kind: "rota", status: "CANDIDATE", external: true },
  { id: "r-init", label: "Iniciativas", hint: "/initiatives · registro público com currentness", url: href("/initiatives"), category: "Iniciativas", kind: "rota", status: "CANDIDATE", external: true },
  { id: "r-part", label: "Participar", hint: "/participate · formas progressivas de contribuir", url: href("/participate"), category: "Participação", kind: "rota", status: "CANDIDATE", external: true },
  { id: "r-evidence", label: "Evidência & Proveniência", hint: "/evidence · visão, desenho, corroboração, vigência", url: href("/evidence"), category: "HUI", kind: "rota", status: "CANDIDATE", external: true },
  { id: "r-about", label: "Sobre a HUI", hint: "/about · meta-arquitetura imaterial e campo-movimento", url: href("/about"), category: "HUI", kind: "rota", status: "CANDIDATE", external: true },
  { id: "r-eceaqui", label: "Entrada em português", hint: "/eceaqui · entrada pública autorizada", url: href("/eceaqui"), category: "HUI", kind: "rota", status: "ACCEPTED CODE", external: true },
  { id: "r-arte", label: "ARTE · PRA AMAR & RIR", hint: "/artepraamarerir · interface federada", url: href("/artepraamarerir"), category: "Federadas", kind: "rota", status: "ACCEPTED CODE", external: true },
  { id: "c-exp", label: "Explorador de capacidades", hint: "/capabilities · índice visual da constelação", url: href("/capabilities"), category: "HUI", kind: "capacidade", external: true },
  { id: "c-explorer", label: "HolOmniverse Explorer", hint: "/holomniverse/explorer · source-integrated", url: href("/holomniverse/explorer"), category: "HUI", kind: "capacidade", external: true },
  { id: "c-beholder", label: "BeHolder", hint: "/holomniverse/beholder · perspectiva sem hierarquia", url: href("/holomniverse/beholder"), category: "HUI", kind: "capacidade", external: true },
  { id: "c-nav", label: "Navegação fractal", hint: "/holomniverse/navigation · ROOT → DOMAIN → TOPIC → PROVENANCE", url: href("/holomniverse/navigation"), category: "HUI", kind: "capacidade", external: true },
  { id: "c-kernel", label: "Mother Kernel", hint: "/architecture/application-fabric · tecido compartilhado", url: href("/architecture/application-fabric"), category: "HUI", kind: "capacidade", external: true },
  { id: "c-cs", label: "Crowd-Sourced", hint: "/participate/crowd-sourced · intakes com consentimento", url: href("/participate/crowd-sourced"), category: "Participação", kind: "capacidade", external: true },
  { id: "c-cb", label: "Crowd-Built", hint: "/participate/crowd-built · módulos com ownership", url: href("/participate/crowd-built"), category: "Participação", kind: "capacidade", external: true },
  { id: "c-cc", label: "Crowd-Crowded", hint: "/participate/crowd-crowded · presença plural", url: href("/participate/crowd-crowded"), category: "Participação", kind: "capacidade", external: true },
  ...MANIFESTATIONS.map((m, i) => ({
    id: `m-${i}`,
    label: m.name,
    hint: `${m.source} · ${m.area}`,
    url: m.url,
    category: "Manifestações" as LauncherCategory,
    kind: "manifestação" as const,
    external: true,
  })),
];

/* ---------- cadeia epistêmica (ticker) ---------- */
export const EPISTEMIC_CHAIN = [
  "visão",
  "desenho",
  "representação",
  "corroboração",
  "verificação",
  "aprovação",
  "vigência",
];
