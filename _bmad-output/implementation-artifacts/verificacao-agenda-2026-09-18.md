# Agenda — verificação em 18/09/2026

Fonte: `spec-agenda-filtros.md`; projeto Juventude em Ação, Mensageiros da Cruz Tupã. Sem Git/commit e sem Supabase configurado.

Entregues busca por título/local sem acentos, filtros de período/situação e confirmações próprias, contagem e recuperação de resultados vazios. Dia civil em Brasília atualiza automaticamente, inclusive ao retomar aba. Prévia demonstra histórico e cancelamento com dados fictícios. Cancelar sob filtro próprio limpa detalhe e leva foco à agenda, evitando ativação acidental de outra ação.

## Evidência

- 33 testes passaram na execução de `npm test`; os quatro testes de componentes acrescentados durante essa execução passaram em `node --test tests/agenda-components.test.mjs`: **37 testes no conjunto**, sem falhas. Todos estão incluídos no glob normal de `npm test`.
- `npm run build` e `npm run typecheck` passaram. Next.js 16.3.5.
- `npm run test:http`, servidor de produção local porta 3001: quatro páginas públicas com CSP/nonce e quatro rotas privadas redirecionando visitante.
- Integração local Dashboard → readAgenda → PGlite com RLS real: coordenação e participante recebem apenas flags de suas próprias confirmações; payload da agenda não contém nomes/IDs de membros.
- Componentes/handlers reais com hooks determinísticos: filtros, contagem, reset, recuperação, seleção, cancelamento, bloqueio de ação cancelada e ciclo de relógio/listeners. Esses testes não equivalem a um renderizador DOM completo.
- Navegador sobre build: duas confirmações, filtro próprio, cancelamento por Enter preserva a outra confirmação, remove detalhe e foca Agenda de exemplo; histórico e cancelada têm resultados; confirmação cancelada desabilitada; busca sem resultado recupera quatro ações em Todas.
- Viewport móvel 390 × 844: largura de conteúdo e viewport útil iguais a 375 px, sem overflow horizontal. Busca normalizada e demais fluxos também foram verificados na rodada anterior de 16/09.
- Três revisores BMAD; dez achados individualmente registrados na especificação e tratados, nenhum adiado. Diff atualizado em `tmp/review/agenda.diff`.

## Limites e continuidade

Não foi criada conta externa, enviado e-mail, usado dado pessoal real ou feito deploy. Usuário informou que ainda não criou Supabase. Criar/configurar projeto, aplicar migração, ativar coordenação e testar Auth hospedado com contas fictícias continuam pendentes, conforme README. Depois validar com a entidade e preparar publicação Vercel. AGENTS.md/CLAUDE.md gerados pelo Next foram preservados.
