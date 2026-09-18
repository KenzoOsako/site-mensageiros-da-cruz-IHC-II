---
title: Primeira versão funcional do Juventude em Ação
type: feature
created: 2026-09-14
status: done
baseline_commit: NO_VCS
route: full
review_loop_iteration: 1
---

<frozen-after-approval reason="Usuário autorizou começar o desenvolvimento e fazer o necessário nesta conversa">

## Intent

**Problem:** Existe uma especificação, mas nenhuma aplicação. Os Mensageiros da Cruz Tupã precisam apresentar o grupo e organizar suas ações comunitárias em uma área de acesso por convite.

**Approach:** Implementar a primeira versão Next.js/TypeScript preparada para Vercel, com Supabase para credenciais e persistência. Entregar os fluxos da especificação e uma prévia com dados fictícios claramente identificada, sem conceder acesso a dados reais. Preparar schema, permissões e instruções de conexão; contas externas não serão criadas nem mensagens enviadas neste trabalho.

## Boundaries & Constraints

**Always:** Usar identidade oficial, português e interface responsiva. Participante vê somente seus compromissos; coordenação administra ações e convites. Materiais são por ação, com oferta distinta de recebimento. Ausência de credenciais desabilita área real de forma explícita. Testar a autorização no banco. Preservar PDFs e BMAD locais. Decisões reversíveis de implementação são autorizadas por “Faça o que for necessário”.

**Never:** Publicar dados pessoais, criar usuários públicos sem convite, enviar e-mail, cadastrar beneficiários, cobrar pagamentos, inventar contato/horário oficial ou prometer operação em nuvem sem configuração. Não trocar Vercel por Sites hosting.

## I/O & Edge-Case Matrix

| Cenário | Entrada | Resultado | Erro |
|---|---|---|---|
| Sem configuração | Abrir site | Página pública e prévia fictícia; login real indisponível | Orientação de configuração no README |
| Autenticação | Credencial inválida ou sessão ausente | Sem dados privados | Mensagem genérica e rota de entrada |
| Ação | Coordenador cria; participante consulta | Dados persistem | Validar campos no servidor/banco |
| Participação | Confirmar duas vezes ou cancelar | Um registro ou nenhum | Sem duplicidade |
| Tarefa | Assumir/concluir | Um responsável; só ele conclui | Rejeitar conflito e alteração alheia |
| Material | Ofertar quantidade e confirmar recebimento | Totais distintos e não negativos | Rejeitar recebimento acima da oferta |
| Permissões | Participante tenta administrar | Operação negada inclusive no banco | Sem escalada de papel |

</frozen-after-approval>

## Code Map

- `_bmad-output/specs/spec-juventude-em-acao/` — referência de produto; preservar.
- `app/` — novas rotas públicas, entrada, painel, ação e API.
- `components/` — interface pública e painel reutilizável.
- `lib/` — modelos, Supabase e leitura de dados.
- `supabase/migrations/` — schema e políticas de acesso.
- `tests/` — verificação de regras e permissões sem contas reais.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `tsconfig.json` — preparar Next.js e TypeScript.
- [x] `supabase/migrations/`, `tests/` — persistência e autorização verificadas.
- [x] `lib/`, `app/auth/`, `app/painel/` — autenticação e operações validadas.
- [x] `app/`, `components/` — apresentação, entrada, agenda, ação, tarefas, materiais e coordenação.
- [x] `.env.example`, `README.md`, `scripts/bmad.ps1` — operação local, Vercel e correção reproduzível do BMAD.

**Acceptance Criteria:**
- Dado visitante sem sessão, quando abre o site, então conhece o grupo sem dados internos.
- Dado ambiente sem Supabase, quando abre a prévia, então vê identificação de dados fictícios, sem acesso real.
- Dado participante autenticado, quando confirma participação/assume tarefa/oferece material, então o banco aplica propriedade e persistência.
- Dado coordenador, quando cria uma ação e registra recebimento, então os estados são distintos e verificáveis.
- Dado checkout configurado, quando executa testes, typecheck e build, então todos passam.

## Implementation Notes

Autorização de execução já presente na conversa; não reabrir checkpoint de aprovação. Credenciais e validação com a entidade serão pendências de ativação real, não impedem escrever e testar o código. Regras iniciais: uma tarefa por responsável, coordenação também pode participar, recebimento parcial permitido até a oferta; sem envio automático de convites.

## Spec Change Log

- 2026-09-15, revisão 1: complementar os módulos afetados para idempotência de ofertas, comparação de recebimento anterior, liberação de tarefa incompleta, retirada de saldo não recebido, paginação e preservação de formulário. São decisões reversíveis de implementação dentro da autorização de fazer o necessário. KEEP: identidade visual, separação da prévia, propriedade dos registros e histórico recebido. Sem baseline Git, preservar arquivos do usuário e reaplicar apenas os módulos afetados; nenhuma reversão destrutiva do projeto.
- 2026-09-15: convite passa a exigir confirmação por POST antes de consumir token; o GET apenas mostra a página. Testar handlers de autenticação com limites de serviço substituídos; validação do Auth hospedado continua pendência explícita de ativação.

## Review Triage Log

| ID | Veredito | Evidência e encaminhamento |
|---|---|---|
| Blind 1 | medium | Leituras globais sem range existem; limite PostgREST pode truncar contribuições. bad_spec: filtrar por ação e paginar. |
| Blind 2 | medium | Cada insert gera novo UUID; envio repetido duplica oferta. bad_spec: ID estável por submissão. |
| Blind 3 | medium | SQL não concede liberação; tarefa fica presa após engano. bad_spec: liberar somente incompleta, pelo dono ou coordenação. |
| Blind 4 | medium | Desativação mantém compromissos. bad_spec: identificar inativos e permitir coordenação liberar tarefa/retirar saldo pendente, preservando entrega. |
| Blind 5 | medium | Não existe correção de oferta. bad_spec: retirar saldo não recebido e registrar nova oferta correta; preservar recebimento. |
| Blind 6 | medium | Redirect de falha descarta campos. bad_spec: estado de formulário para criação/edição de ação. |
| Blind 7 | medium | Error boundary afirma ausência de alteração sem evidência. patch: mensagem pede conferir resultado antes de repetir. |
| Blind 8 | medium | GET chama verifyOtp e pode ser consumido por prévia de link. bad_spec: página GET e confirmação explícita POST. |
| Blind 9 | medium | update recebido só compara ID e aceita formulário antigo. patch: comparar total esperado. |
| Blind 10 | medium | Testes originais cobrem SQL e não handlers/Auth. patch: testes do código dos handlers e cookies com fronteiras externas simuladas; Auth hospedado pendente, sem alegação de validação real. |
| Edge 1 | medium | Mesmo insert não idempotente de Blind 2. Mesma correção, achado mantido individualmente. |
| Edge 2 | medium | Mesmo overwrite de Blind 9. Mesma correção, achado mantido individualmente. |
| Edge 3 | medium | Mesma truncagem de Blind 1. Mesma correção, achado mantido individualmente. |
| Verification 1 | medium | Apenas uma oferta não distingue SUM de MAX. patch: testar dois contribuintes e isolamento entre materiais. |
| Verification 2 | medium | Conversão Brasília não atravessada por teste. patch: função de produção e round trip verificado. |
| Verification 3 | medium | Rejeição SQL não verifica mensagem de sucesso do handler. patch: invocar handler contra fixture que rejeita operação e verificar resultado. |

## Verification

- `npm test` — integridade e autorização no banco.
- `npm run typecheck` — TypeScript sem erros.
- `npm run build` — aplicação compila para Next.js/Vercel.
- Requisições HTTP locais — público, prévia e proteção de rotas.


## Resultado da execução

Concluída a primeira versão local. Todos os achados confirmados foram corrigidos, com 25 testes aprovados, typecheck, build e verificações HTTP/navegador. Detalhes e limites em verificacao-primeira-versao.md. Ativação Supabase e publicação Vercel continuam pendentes externas explícitas; não houve commit (NO_VCS).

