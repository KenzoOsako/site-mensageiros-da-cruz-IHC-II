# Verificação — primeira versão local

Data: 2026-09-15. Fonte canônica: projeto `C:/Users/kenzo/OneDrive/Documents/Codigo/IHC II`; tarefa `01a0a063-8ed4-78b2-ba7e-419480b28af7`.

## Resultado verificado

- `npm test`: 25 testes aprovados, sem falhas. Incluem PostgreSQL/PGlite com a migração real, autorização RLS, duplicidade, concorrência, retirada/liberação, isolamento de contribuições e handlers de produção.
- Teste de sessão usa o cliente Supabase SSR real e cookies, com respostas HTTP Auth simuladas. Testa convite, senha, entrada, sessão inativa e saída. Não é validação de Supabase hospedado.
- `npm run typecheck` e `npm run build`: aprovados em Next.js 16.3.5.
- `npm run test:http`: quatro páginas públicas respondem 200 com CSP/nonce; quatro rotas privadas redirecionam visitante para entrada. Sem contas reais.
- `npm audit`: zero vulnerabilidades reportadas; instalação/atualização consultou o registro, conferência final usou cache local.
- Navegador: apresentação e prévia conferidas; participação/cancelamento, atribuição/conclusão, oferta de 5 e recebimento parcial de 2, reinício ao recarregar. Em viewport 390×844, área útil 375px sem overflow horizontal. Após build final, interação da prévia confirmada e console sem erros.
- BMAD: `scripts/bmad.ps1 -Skill bmad-build` renderizou o workflow oficial local. Nenhuma skill instalada no usuário.

## Revisão

Três revisores independentes (blind, edge e verification-gap). Os 16 achados estão individualmente classificados na especificação da execução. Correções incorporadas e conferidas pelo agente principal e pelos testes; não foi feita nova rodada independente após as correções.

Entregues proteção contra reenvio de oferta e recebimento obsoleto, liberação de tarefa incompleta, retirada de saldo preservando entregas, paginação por ação, manutenção de campos em falha e confirmação POST do convite. Nenhum defeito confirmado foi transferido para backlog.

## Limites e próxima etapa

Não existe `.env.local`, projeto Supabase conectado, teste de Auth hospedado ou deploy Vercel nesta entrega. Não há repositório Git, commit ou PR. A primeira versão local está concluída; a ativação real depende das contas e chaves da equipe, migração e teste com participantes fictícios no serviço configurado. Instruções e bootstrap em `README.md`.

Validar conteúdo/fluxos com os Mensageiros da Cruz Tupã antes do uso real. Não foram inventados contatos/horários, utilizados dados pessoais de participantes ou enviadas mensagens.
