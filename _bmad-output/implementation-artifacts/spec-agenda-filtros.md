---
title: Encontrar ações e participações na agenda
type: feature
created: 2026-09-16
status: done
route: full
baseline_commit: NO_VCS
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="Usuário autorizou continuar o desenvolvimento e fazer o necessário; escolhas reversíveis dentro de CAP-3 e CAP-5">

## Intent

**Problem:** A agenda privada lista todas as ações por data crescente, misturando atividades antigas e canceladas às próximas e sem indicar as confirmações do próprio usuário. Com mais ações, torna-se difícil localizar a atividade desejada.

**Approach:** Acrescentar busca por título/local, filtros de período/situação e de participação própria, com regras comuns à área privada e à prévia fictícia. Preservar a navegação aos detalhes e os fluxos existentes.

## Boundaries & Constraints

**Always:** Português, celular e teclado. Padrão “Hoje e próximas” considera o dia civil em America/Sao_Paulo, incluindo todas as ações programadas de hoje mesmo após seu horário inicial. “Anteriores” inclui programadas antes de hoje, em ordem decrescente; “Canceladas” inclui apenas canceladas; “Todas” inclui todas. Demais listas têm ordem crescente com desempate por ID. Busca sem distinção de caixa/acentos, trim e espaços normalizados; termo deve estar no título ou local. Filtros se combinam por AND. “Minhas confirmações” refere-se somente à participação do usuário atual, inclusive coordenador; tarefas/ofertas não equivalem a confirmação. Identificar cada confirmação no cartão. Preservar RLS e autenticação. Contagem corresponde ao conjunto filtrado. Limpar restaura próximos + busca vazia + todas as pessoas (sem filtro próprio).

**Never:** Exibir nomes/IDs de outros participantes no cliente; alterar migração/autenticação ou criar serviço/conta externa; inventar eventos oficiais; esconder erro de carregamento como lista vazia; persistir filtros/dados pessoais em armazenamento do navegador. Sem novas dependências. Filtros são locais e reiniciam ao recarregar. Não alterar PDFs nem skills oficiais.

## I/O & Edge-Case Matrix

| Cenário | Entrada | Esperado | Erro |
|---|---|---|---|
| Próximas | Hoje, ontem, amanhã, cancelada | Apenas hoje/amanhã programadas; crescente | Sem erro |
| Fuso | Instante 01:00 UTC ainda no dia anterior em Brasília | Classificação pelo dia de Brasília | Relógio injetado em testes |
| Histórico e cancelamento | Período anteriores/canceladas/todas | Anteriores desc; canceladas separadas; todas completas | Sem mutação do array original |
| Busca | “  SAO   PEDRO ” e “São Pedro” em título/local | Mesmo resultado sem acentos/caixa | Campo rotulado |
| Próprias | Confirmação própria, de outro, sem confirmação | Só próprias quando filtro ligado | Leitura sempre filtra member_id no servidor |
| Filtros combinados | Busca + período + próprias sem resultado | Contagem zero, estado vazio e limpar | Não confundir com agenda sem cadastro |
| Leitura falha | Query de ações/participações rejeita | Error boundary existente | Sem sucesso/lista vazia falsa |
| Prévia | Confirmar/cancelar com filtro próprio | Lista atualiza imediatamente; detalhe apenas de item visível | Todos dados fictícios, nenhum Auth necessário |

</frozen-after-approval>

## Code Map

- `app/painel/page.tsx`: requireMember e allRows existentes; atualmente só consulta actions. Manter criação de ação exclusiva da coordenação, mensagens e navegação.
- `lib/pagination.ts`: allRows usa queries novas/range com ordenação estável; reutilizar para participations, filtradas por member.id e ordenadas action_id.
- `components/Preview.tsx`: dois eventos fictícios, estado em memória e fluxos já testados. Acrescentar campos starts_at/status e referência temporal fixa claramente indicada como demonstração. Manter seus formulários e comportamento.
- `app/globals.css`, `app/private.css`: estilos existentes; novas classes específicas de agenda, sem vazamento para outros forms.
- `tests/load-source.mjs`: executa TypeScript de produção, permite substituir fronteiras por mocks. Reutilizar.

## Tasks & Acceptance

- [x] `lib/agenda.ts`: tipos e funções puras para data civil, normalização, filtro/ordenação; relógio explícito. Evitar O(n²).
- [x] `lib/agenda-data.ts`: leitor de ações e confirmações próprias, campos mínimos e erro propagado; reutilizar allRows. Facilitar teste do contrato de consulta sem Supabase conectado.
- [x] `components/agenda-filters.tsx`, `components/agenda-list.tsx`: controles compartilhados e lista privada com contagem, badges, links e estados vazios; entrada de dados serializável e somente bool próprio.
- [x] `app/painel/page.tsx`: integrar leitura e lista, sem perder formulário da coordenação.
- [x] `components/Preview.tsx`: usar mesmas regras/controles; quando seleção ficar fora do filtro, selecionar primeiro visível ou mostrar vazio sem formulários ocultos. Demonstração com data de referência fixa; label evita confusão com agenda oficial.
- [x] CSS: garantir controles rotulados, foco visível, layout móvel sem overflow; botões com type explícito.
- [x] `tests/agenda.test.mjs`: matriz incluindo fuso, empates, acentos, interseção, não mutação, consulta de confirmação própria e falhas. Testar funções reais.
- [x] `README.md`: documentar filtros e regras de data/participação; manter limites da integração hospedada.

**Acceptance Criteria:**
- Dado membro autenticado, quando abre a agenda, então identifica próximas ações e suas confirmações sem receber dados de outras pessoas.
- Dada prévia, quando confirma e filtra suas participações, então encontra só a ação confirmada e pode cancelar sem deixar detalhes incompatíveis com a lista.
- Dado visitante, quando tenta abrir painel, então continua redirecionado à entrada.
- Dado projeto local, quando executa testes/typecheck/build, então todos passam.

## Implementation Notes

Não há Supabase configurado nem Git. Ativação externa é pendência separada e não impede esta melhoria. A autorização de desenvolvimento já foi dada; não reabrir aprovação de decisões reversíveis. Parent fará integração/build e registro no Second Brain; agente implementador limita-se aos arquivos da tarefa e testes específicos, sem iniciar servidor.

## Spec Change Log

## Review Triage Log
Revisão concluída em 18/09/2026. Três camadas retornaram; a camada de lacunas foi retomada após falha temporária por limite de uso. Correções verificadas pelo agente principal. Nenhum achado adiado nesta iteração.

| Achado | Veredito | Evidência e tratamento |
|---|---|---|
| Blind B1: relógio congelado | medium / patch | `now` fixo mantinha o dia anterior após meia-noite. Efeito atualiza montagem, virada civil, foco e visibilidade; testes exercitam timer e cleanup. |
| Blind B2: vazio sem saída | low / patch | Limpar restaurava próximas mesmo quando só havia antigas/canceladas. Botão Ver todas as ações agora limpa busca/próprias e usa todas. |
| Blind B3: exemplos sem histórico/cancelamento | low / patch | Dois exemplos originais eram próximos. Acrescentados exemplos explicitamente fictícios e cancelada com mutações bloqueadas. |
| Blind B4: seleção antiga reaparece | low / patch | Fallback não reconciliava ID selecionado; limpar trazia seleção antiga. Filtros reconciliam seleção de forma persistente. |
| Blind B5: foco troca de ação ao cancelar | medium / patch | Mesmo DOM podia trocar conteúdo mantendo botão de cancelar focado. Cancelamento sob filtro próprio limpa seleção, foca título da agenda e exige escolha explícita; detalhe tem key por ID. |
| Blind B6: fuso não indicado | low / patch | Lista privada formatava Brasília sem rótulo. Incluído Horários de Brasília. |
| Blind B7: componentes sem regressão automatizada | medium / patch | Testes originais só executavam helpers. Novos testes executam callbacks reais e componentes com host determinístico; navegador confirma foco/estados. |
| Edge E1: data após meia-noite | medium / patch | Mesmo defeito de B1, corrigido no mesmo efeito e verificado pela matriz de relógio. |
| Verification V1: controles não exercitados | medium / patch | Alterar checked não quebraria testes antigos. `agenda-controls.test.mjs` executa controles reais e verifica identidades, contagem, combinação, reset e recuperação. |
| Verification V2: identidade no dashboard | medium / patch | Mock antigo só registrava eq. `agenda-dashboard.test.mjs` executa Dashboard → readAgenda em PGlite/RLS com confirmações distintas; coordenador pode ler três linhas mas só marca sua própria. |

## Verification

`npm test`, `npm run typecheck`, `npm run build`, `npm run test:http` com servidor local. Navegador: buscar, trocar filtro, confirmar/cancelar na prévia, limpar e viewport móvel. Integração hospedada não será alegada sem credenciais/configuração e teste real.


