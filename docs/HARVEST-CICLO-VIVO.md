# HARVEST · CICLO VIVO — controlled cross-repository working-tree harvest

> Executado pelo runner com capacidade git. Este documento é o roteiro mecânico.
> Nenhum passo de execução remota (push, PR, mint de SHA) é possível no sandbox de origem.

## Estado do portão (verificado)

| campo | valor |
| --- | --- |
| PR #115 (verificação externa via conector GitHub) | OPEN · DRAFT · MERGEABLE · NOT MERGED |
| PR #115 LIVE HEAD / `DESTINATION_BASE_SHA` | `0ead934b3f032cb265afa2770437ac3befd95838` |
| PR #115 BASE | `bca6afd52e04d99fe15413508a8738e02c9c24c9` |
| HEAD_DRIFT | NO |
| Transporte de patch externo | CANCELADO por instrução — não localizar, não recriar |
| SOURCE ARTIFACT | working tree do protótipo (este repositório) |
| SOURCE_WORKING_TREE_BASE | `fffcb0cd0f4c1a4d498ffd7436f9522ad573f7d5` (commit local do workspace; parent `d9287a832b4f6ec1ce9b46379463b04f323597b3`) + 2 linhas de marcadores de colheita em `src/registry/registry.ts` |
| Branch de destino (nova) | `qwen/ciclo-vivo-first-cycle-v0-1` |
| PR de destino (base do draft) | `qwen/hui-hho-first-cycle-web-v0-1` |
| Caminho de destino | `apps/hui-hho-first-cycle-web/` em `HUI-HolOmniverse/HUI-Mater-Core` |

**PR #115 NÃO é modificado em nenhuma etapa.**

## NÃO colher

`package.json` · `package-lock.json` · `verifier*/` · metadados `.git`.
O `package.json` do destino já é normalizado e provê `npm test`, `npm run typecheck`, `npm run build`.

## Passo 0 — ramo de destino a partir do head exato do PR #115

```bash
cd <checkout-de-HUI-Mater-Core>
git fetch origin pull/115/head:refs/remotes/origin/pr-115-head
git checkout -b qwen/ciclo-vivo-first-cycle-v0-1 0ead934b3f032cb265afa2770437ac3befd95838
```

## Passo 1 — arquivos NOVOS: cópia exata da working tree de origem

```bash
SRC=<raiz-do-prototipo>
DST=apps/hui-hho-first-cycle-web
mkdir -p "$DST/src/cycle"
for f in lineageModel.ts workLedgerModel.ts readbackModel.ts CoCreationLens.tsx \
         LineageGraph.tsx WorkLedger.tsx ReadbackConsole.tsx cycle.test.tsx; do
  cp "$SRC/src/cycle/$f" "$DST/src/cycle/$f"
done
```

## Passo 2 — arquivos EXISTENTES no destino: merge semântico limitado

Regra geral: **nunca sobrescrever**; inserir apenas; verificar idempotência antes de inserir.

### 2.1 `src/registry/model.ts`

- **Idempotência:** `grep '"Building"' src/registry/model.ts` — se já existir, pular.
- **Âncora:** no array `FAMILIES`, após a linha `  "Registry",`.
- **Inserção (1 linha):**
  ```ts
    "Building",
  ```

### 2.2 `src/App.tsx`

- **Idempotência:** `grep 'cycle/LineageGraph' src/App.tsx` — se já existir, pular.
- **Inserção A (imports)** — após `import TriageWorkbench from "./apps/TriageWorkbench";` (ou após o último import de app, se a tranche anterior não existir no destino):
  ```ts
  import LineageGraph from "./cycle/LineageGraph";
  import WorkLedger from "./cycle/WorkLedger";
  import ReadbackConsole from "./cycle/ReadbackConsole";
  ```
- **Inserção B (rotas)** — dentro de `<Routes>`, imediatamente antes de `<Route path="*" element={<Portal />} />`:
  ```tsx
  <Route path="/linhagem" element={<LineageGraph />} />
  <Route path="/ledger" element={<WorkLedger />} />
  <Route path="/readback" element={<ReadbackConsole />} />
  ```

### 2.3 `src/chrome.tsx`

- **Idempotência:** `grep 'aria-label="Ciclo Vivo"' src/chrome.ts` — se já existir, pular.
- **Âncora:** imediatamente após `<div className="ml-auto flex items-center gap-3 sm:gap-4">`, antes do `<a href="#/captura"`.
- **Inserção:** bloco `<nav aria-label="Ciclo Vivo">` com os 3 links (`#/linhagem`, `#/ledger`, `#/readback`) — conteúdo exato nas linhas 100–114 de `src/chrome.tsx` da origem.

### 2.4 `src/registry/registry.ts`

- **Idempotência:** `grep 'tool-lineage-graph' src/registry/registry.ts` — se já existir, pular.
- **Extração:** na origem, copiar o bloco delimitado pelos marcadores
  `/* CICLO-VIVO-HARVEST-BEGIN …` até `… CICLO-VIVO-HARVEST-END */`
  (3 registros: `tool-lineage-graph`, `tool-work-ledger`, `tool-readback-console`, incluindo os marcadores).
- **Inserção:** imediatamente antes do comentário `/* ---------------- participação ---------------- */`.

## Passo 3 — verificação de escopo ANTES de testar

```bash
git status --porcelain
# TODAS as linhas devem começar com paths em apps/hui-hho-first-cycle-web/
git diff --stat
# somente os 4 arquivos de merge + 8 novos em src/cycle/
```

Se qualquer arquivo fora de `apps/hui-hho-first-cycle-web/` aparecer → **PARAR** e reconciliar manualmente.

## Passo 4 — execução literal (evidência nova do destino; NÃO herdar 101/102)

```bash
cd apps/hui-hho-first-cycle-web
npm ci
npm test            # vitest run — todos os arquivos devem executar
npm run typecheck   # tsc --noEmit
npm run build       # vite build
```

Persistir os logs (`npm test 2>&1 | tee ../../docs/ciclo-vivo-dest-test.log`, etc.).

**Expectativa de referência** (árvore de origem pós-fix; o destino estabelece a própria evidência):
7 arquivos de teste · 102 testes · typecheck limpo · build verde.

## Passo 5 — commit único, push, draft PR

```bash
git add apps/hui-hho-first-cycle-web
git commit -m "feat(ciclo-vivo): Lineage Graph · Work Ledger · Readback Console · Co-Creation Lens

- src/cycle/: 8 arquivos novos (modelos determinísticos + UIs + suíte)
- rotas #/linhagem, #/ledger, #/readback; nav 'Ciclo Vivo' no header
- registry: família Building + 3 registros de tool (IMPLEMENTED_CANDIDATE)
- readback: máquina ramificada (CONTRADICTED/UNRESOLVED de 1ª classe),
  VERIFIED guardado por evidência, export somente EVIDENCE_CANDIDATE
- Sérgio: REPRESENTATIVE/DEMO; SOURCE_SHARED_BY != AUTHOR; sem fala inventada
- colheita de working tree sobre 0ead934b; PR #115 não modificado"

git rev-parse HEAD            # → RESULTING_SHA do recibo
git push -u origin qwen/ciclo-vivo-first-cycle-v0-1
gh pr create --draft \
  --repo HUI-HolOmniverse/HUI-Mater-Core \
  --base qwen/hui-hho-first-cycle-web-v0-1 \
  --head qwen/ciclo-vivo-first-cycle-v0-1 \
  --title "Ciclo Vivo v0.1 — Lineage Graph · Work Ledger · Readback Console" \
  --body-file docs/HARVEST-CICLO-VIVO.md
```

## Regressões nomeadas (para o recibo)

- **SECURITY_REGRESSION:** `proteção de publicação > index.html mantém noindex,nofollow` ·
  `proteção de publicação > robots.txt mantém hold de indexação` ·
  `publicação & segurança > noindex,nofollow permanece no index.html` ·
  `publicação & segurança > robots.txt mantém o hold de indexação` ·
  `publicação & segurança > referência não público-segura não vira âncora no detalhe do readback`
- **SERGIO_ATTRIBUTION_REGRESSION:** `Work Ledger > SOURCE_SHARED_BY != AUTHOR nos registros Sérgio — e o papel jamais é autoria confirmada` ·
  `Work Ledger > nenhum ranking/score/métrica reputacional em qualquer registro` ·
  `Work Ledger > SHAs: somente reais — onde não cunhado, o campo está ausente (não inventado)`

## Template do recibo de destino (preencher com evidência real)

```
SOURCE_WORKING_TREE_BASE: fffcb0cd0f4c1a4d498ffd7436f9522ad573f7d5 (+ marcadores de colheita)
DESTINATION_BASE_SHA: 0ead934b3f032cb265afa2770437ac3befd95838
FILES_HARVESTED: <lista literal do git diff --name-status>
FILES_SEMANTICALLY_MERGED: src/App.tsx · src/chrome.tsx · src/registry/model.ts · src/registry/registry.ts
TEST_COMMAND: npm test (após npm ci)
TEST_FILE_COUNT: <real>
TEST_COUNT: <real>
TEST_RESULTS: <literal da execução de destino>
TYPECHECK_RESULT: <literal>
BUILD_RESULT: <literal>
SECURITY_REGRESSION_RESULT: <PASS/FAIL com nomes de teste>
SERGIO_ATTRIBUTION_REGRESSION_RESULT: <PASS/FAIL com nomes de teste>
RESULTING_SHA: <git rev-parse HEAD real — nunca inventado>
DRAFT_PR_URL: <URL real do draft PR>
```

## Ciclo de vida (máximo autorizado)

IMPLEMENTED · TESTED — somente se a execução de destino passar ·
NOT_INDEPENDENTLY_ASSURED · NOT_ACCEPTED · NOT_MERGED · NOT_DEPLOYED · NOT_EXTERNALLY_READ_BACK

Sem deploy · sem DNS/indexação · sem mutação de Supabase de produção · sem registro AIPFIT.
