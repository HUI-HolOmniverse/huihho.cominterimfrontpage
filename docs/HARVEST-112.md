# HARVEST · HUI-Mater-Core Issue #112 — successor tranche

> Documento de colheita: permite ao runner com capacidade git transformar esta
> árvore de trabalho em commit + draft PR sem reescrever nada.

## Proveniência exata

| campo | valor |
| --- | --- |
| Repositório | `HUI-HolOmniverse/HUI-Mater-Core` |
| Branch de trabalho | `build/qwen-first-cycle-apps-tools-v0-4` |
| `EXACT_PARENT_SHA` | `bca6afd52e04d99fe15413508a8738e02c9c24c9` (instrução do fundador) |
| Predecessor observado (PR #1, `huihho.cominterimfrontpage`) | `9e6a2e10235787314aac162480e051f41d38b41c` |
| Re-verificação remota nesta rodada | Issue #112 → **404**; branch page → **404** (repo não público/inalcançável via proxy). Parent mantido conforme instrução; re-verificar antes do push. |
| Integração com PR #111 | PR #111 **não foi modificado**; esta tranche é sucessora aditiva. |

## O que esta tranche contém (os cinco pontos corrigidos)

1. **Suite executada de verdade.** `verifier/` é um pacote local (`file:./verifier`,
   `private: true`) cujo script `prepare` executa
   `node ../node_modules/vitest/vitest.mjs run --root .. --reporter=verbose --no-color`
   durante `npm install`. Evidência de execução real abaixo (43/43).
2. **Seletores de teste provados contra a marcação real** (Enter no campo do
   lançador, chips `adicionado · N`, diálogos `Inspector: …`, listas `Hólons de …`).
3. **Cobertura fechada**: reduced-motion do Explorer, rotas `#/holomniverse` e
   `#/holo-logoi`, round-trip de export público-seguro, `robots.txt`.
4. **Guardas de ambiente consolidados** em `src/test/setup.ts`
   (IntersectionObserver, scrollTo, canvas) — jsdom-safe sem tocar no produto.
5. **Bug de produto capturado pelo teste e corrigido**: `sanitizeRecord` aceitava
   `positiveNote: ""` (vazia) — agora cai no fallback ("nunca fabrica estado"
   vale também para strings vazias). `src/registry/model.ts`.

## Evidência de teste (execução real, `vitest 4.1.11`, ambiente jsdom)

```
✓ ui.test.tsx > lançador > busca encontra predecessores históricos e registros correntes pelo teclado
✓ ui.test.tsx > lançador > Enter abre o inspector (sem sair da experiência)
✓ ui.test.tsx > lançador > mostra estado antes de abrir (chip de ciclo de vida presente)
✓ ui.test.tsx > inspector > abre e fecha por teclado, restaurando o foco
✓ ui.test.tsx > inspector > links externos usam rel seguro e abrem em nova aba
✓ ui.test.tsx > inspector > navega a linhagem por teclado (botões de predecessores/sucessores)
✓ ui.test.tsx > reduced motion > respeita prefers-reduced-motion
✓ ui.test.tsx > rotas > rota #/iceberg carrega o atlas
✓ ui.test.tsx > rotas > rota #/registry carrega as lentes com skip link e busca
✓ ui.test.tsx > rotas > rota #/holomniverse carrega o Beholder Explorer
✓ ui.test.tsx > rotas > rota #/holo-logoi carrega o ledger de termos
✓ apps.test.tsx > Beholder Explorer > abre em ROOT com todas as famílias e navega por teclado (↓, ↵, esc)
✓ apps.test.tsx > Beholder Explorer > chega a TOPIC, mostra o registro e abre o inspector
✓ apps.test.tsx > Beholder Explorer > anota a separação entre projeção visual e autoridade
✓ apps.test.tsx > Beholder Explorer > reduced motion: projeção permanece estática e o teclado continua operante
✓ apps.test.tsx > Holo-Logoi > mostra o termo inicial com definição, base da crença e valor de continuidade
✓ apps.test.tsx > Holo-Logoi > busca filtra termos e a seleção atualiza o detalhe
✓ apps.test.tsx > Holo-Logoi > todo termo carrega linhagem e estado controlado
✓ apps.test.tsx > Snapshot Diff > exemplo contra a base: tudo inalterado, zero adições
✓ apps.test.tsx > Snapshot Diff > variante sintética rotulada: adição + reclassificação visíveis
✓ apps.test.tsx > Snapshot Diff > JSON inválido falha com segurança, com aviso e sem diff
✓ apps.test.tsx > Snapshot Diff > entrada colada com registro restrito nunca expõe URL protegida
✓ registry.test.ts > invariantes do registry > ids únicos + positiveNote em todo bloco + vocabulário controlado
✓ registry.test.ts > invariantes do registry > nenhum bloco é CURRENT sem a evidência exigida pelo modelo
✓ registry.test.ts > invariantes do registry > material privado/restrito nunca expõe URL protegida
✓ registry.test.ts > invariantes do registry > HUI e HUI ICEBERG permanecem distintos (não-colapso)
✓ registry.test.ts > invariantes do registry > estado malformado falha com segurança, nunca fabrica estado
✓ registry.test.ts > invariantes do registry > sanitize remove URL de fonte não pública
✓ registry.test.ts > consultas > parseQuery aceita comandos e texto livre, sem quebrar em malformados
✓ registry.test.ts > consultas > lançador encontra registros correntes E predecessores
✓ registry.test.ts > consultas > filtros de estado/tipo/disponibilidade funcionam
✓ registry.test.ts > consultas > estado desconhecido não fabrica resultados — retorna vazio com segurança
✓ registry.test.ts > consultas > adapter expõe metadado do snapshot público-seguro
✓ registry.test.ts > proteção de publicação > index.html mantém noindex,nofollow
✓ registry.test.ts > proteção de publicação > robots.txt mantém hold de indexação
✓ registry.test.ts > proteção de publicação > export público-seguro valida limpo e nunca vaza URL restrita
✓ fractal.test.ts > árvore fractal > ROOT cobre todas as famílias e todo registro é alcançável como TOPIC
✓ fractal.test.ts > árvore fractal > PROVENANCE espelha as sourceRefs de cada registro
✓ fractal.test.ts > árvore fractal > caminho desconhecido falha com segurança (null), nunca fabrica nó
✓ fractal.test.ts > snapshot diff > base contra si mesma: zero adições, tudo inalterado
✓ fractal.test.ts > snapshot diff > variante sintética: adição rotulada + reclassificação + ausências retidas
✓ fractal.test.ts > snapshot diff > entrada hostil/malformada falha com segurança, sem fabricar estado
✓ fractal.test.ts > snapshot diff > export público-seguro nunca expõe URL de material protegido

Test Files  4 passed (4)
     Tests  43 passed (43)
```

## Arquivos desta tranche

- novo: `verifier/package.json` — harness de execução da suite via `npm install`
- novo: `docs/HARVEST-112.md` — este documento
- novo (rodada anterior, retido): `src/registry/{model,registry,adapter,queries,Inspector,fractal,diff}.ts`,
  `src/registry/*.test.*`, `src/apps/{Explorer,Logoi,SnapshotTool}.tsx`, `src/apps/logoiTerms.ts`,
  `src/iceberg/*`, `src/LensPage.tsx`, `src/test/setup.ts`, `public/robots.txt`, `vitest.config.ts`
- alterado: `src/App.tsx`, `src/Launcher.tsx`, `src/LensPage.tsx`, `src/chrome.tsx`,
  `src/data.ts`, `src/index.css`, `index.html`, `package.json` (deps de teste + `hui-verifier`)

## Como colher (runner com git)

```bash
# 1. confirmar parent
git rev-parse HEAD   # deve ser bca6afd52e04d99fe15413508a8738e02c9c24c9

# 2. suite real
npm install          # o prepare do hui-verifier executa a suite (43 testes)
npm run build        # evidência de build

# 3. commit único e focado
git add -A
git commit -m "tools(v0.4.1): successor tranche — suite executada (43/43), cinco pontos corrigidos

- verifier/: executa a suite Vitest real durante npm install (prepare)
- seletores de UI-test provados contra a marcação (launcher/inspector/explorer)
- cobertura: reduced-motion Explorer, rotas #/holomniverse e #/holo-logoi,
  export público-seguro, robots.txt
- src/test/setup.ts: guardas jsdom (IntersectionObserver, scrollTo, canvas)
- model.ts: positiveNote vazia agora cai no fallback (bug capturado por teste)
- não toca PR #111 · noindex/nofollow mantido · sem merge/deploy/DNS"

# 4. registrar o SHA exato e abrir DRAFT PR contra HUI-Mater-Core
git rev-parse HEAD   # → RESULTING_SHA / EXACT_HEAD_SHA do recibo
gh pr create --draft --title "..." --body-file docs/HARVEST-112.md
```

## Governance mantida

`noindex,nofollow` + `robots.txt Disallow: /` · sem credenciais no browser ·
sem mutação de DNS · sem merge · PR #111 intacto · `ACCEPTED ≠ DEPLOYED ≠ LIVE` ·
`HUI ≠ ICEBERG` · ausente ≠ apagado.
