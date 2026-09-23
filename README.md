# Juventude em Ação

Site dos **Mensageiros da Cruz Tupã**, da **Paróquia São Pedro Apóstolo**. Next.js, TypeScript e Supabase, preparado para Vercel. BMAD e suas skills permanecem apenas neste projeto.

## Estado da entrega — 23/09/2026

**Primeira versão publicada em [HTTPS na Vercel](https://site-mensageiros-da-cruz-ihc-ii.vercel.app/); banco Supabase conectado e verificado.** O projeto Supabase `sistema-mensageiros-da-cruz` (`phaysezdaxyqtbnvgbpj`) contém as sete tabelas da migração, todas com RLS. A Data API está habilitada. O Auth impede cadastro público, permite e-mail/senha, exige senha de 12 caracteres, usa JWT de 900 segundos e aceita os retornos local e publicado em `/auth/confirm`. As chaves foram salvas apenas em `.env.local` e nas variáveis de Production da Vercel, sem entrar no Git. A consulta à tabela `actions` com a chave administrativa retornou HTTP 200; com a chave pública, HTTP 401, conforme a ausência intencional de acesso anônimo. A primeira conta de coordenação e seu perfil ativo foram criados; o convite privado aguarda a definição de senha pela pessoa convidada. O fluxo completo do Auth hospedado e a persistência com contas de teste ainda precisam de validação.

Repositório: [site-mensageiros-da-cruz-IHC-II](https://github.com/KenzoOsako/site-mensageiros-da-cruz-IHC-II).

O projeto organiza ações comunitárias e de solidariedade: agenda → detalhes → participação → tarefas, com necessidades, ofertas e recebimentos de materiais por ação. Não é controle de estoque geral nem sistema de doação financeira. O nome de trabalho é **Juventude em Ação**. O software não tem prazo definido; a implantação depende de validação com a entidade.

### O que já foi feito

- [x] Planejamento BMAD: escopo, regras, pendências e plano de validação, versionados em `_bmad-output/`.
- [x] Apresentação pública do grupo e navegação para área privada, com layout responsivo e link para pular ao conteúdo.
- [x] Prévia interativa com quatro ações fictícias, perfis de participante/coordenação e estado apenas em memória.
- [x] Login por e-mail/senha, saída, ativação por convite e recuperação administrativa; nenhuma inscrição pública implementada.
- [x] Verificação de membro ativo e papel no servidor; convites restritos à coordenação e novos membros sempre participantes.
- [x] Agenda privada, criação/edição/cancelamento de ações, instruções e detalhes da atividade.
- [x] Busca por título/local, filtros de próximas/anteriores/canceladas/todas e confirmações próprias. Dia e horários em Brasília, atualização na virada do dia e retomada da aba.
- [x] Confirmação/cancelamento de participação, tarefas com responsável único, conclusão e liberação de tarefa incompleta.
- [x] Materiais por ação, oferta separada do recebimento, recebimento parcial e retirada do saldo pendente preservando entregas.
- [x] Proteções contra oferta duplicada e atualização de recebimento com formulário desatualizado.
- [x] Migração PostgreSQL com tabelas, funções, permissões e RLS; isolamento entre participantes e bloqueio de membros inativos.
- [x] Scripts para primeira coordenação, recuperação e desativação, sem envio automático de mensagens.
- [x] CSP com nonce por resposta, cabeçalhos de segurança, validação de formulários e tratamento de falhas.
- [x] Revisões BMAD e verificações locais documentadas. Conjunto de **37 testes aprovados**, build e TypeScript aprovados; oito verificações HTTP e testes de navegador, inclusive teclado e celular.

Detalhes da evidência: [primeira versão](./_bmad-output/implementation-artifacts/verificacao-primeira-versao.md) e [agenda](./_bmad-output/implementation-artifacts/verificacao-agenda-2026-09-18.md). Os relatórios descrevem o estado na data de execução; referências à ausência de Git são históricas, anteriores à publicação deste repositório. Testes locais não comprovam funcionamento do Auth hospedado.

### Mapa do projeto

| Caminho | Conteúdo |
|---|---|
| `app/` | Páginas públicas, login, ativação e painel; ações de servidor |
| `components/` | Componentes, formulários, agenda e demonstração |
| `lib/` | Autenticação, clientes Supabase, validação, datas e consultas |
| `supabase/migrations/` | Estrutura do banco e autorização RLS |
| `scripts/` | Administração de membros, verificação HTTP e auxiliar BMAD |
| `tests/` | Testes de domínio, componentes, handlers, sessão simulada e SQL/PGlite |
| `_bmad-output/` | Especificações, regras, plano de validação e relatórios |
| `.agents/skills/`, `_bmad/` | BMAD instalado somente neste projeto |

Os PDFs originais da disciplina permanecem na pasta local e não são publicados. Um [rascunho do plano extensionista](./docs/plano-trabalho-2-rascunho.md) reúne o texto já sustentado pelas informações disponíveis e marca os campos desconhecidos. Os documentos Trabalho 2 e Trabalho 2 – formulário ainda precisam de revisão com a entidade, preenchimento final e assinaturas; a implementação do site não substitui essa entrega acadêmica. O [guia curto de operação](./docs/guia-de-uso.md) orienta coordenação e participantes.

## Rodar e avaliar agora

Requisito: Node.js 22 ou superior.

```powershell
git clone https://github.com/KenzoOsako/site-mensageiros-da-cruz-IHC-II.git
cd site-mensageiros-da-cruz-IHC-II
npm ci --cache ./tmp/npm-cache
npm run dev
```

Abra http://localhost:3000. `/` apresenta o grupo e o Instagram autorizado [@mensageirosdacruz_tupa](https://www.instagram.com/mensageirosdacruz_tupa/). `/previa` oferece agenda, detalhes, participação, tarefas, ofertas e recebimentos com **dados fictícios, somente em memória**. Recarregar zera a demonstração. `/entrar` explica quando o ambiente real está indisponível. Nenhum calendário oficial foi inventado.

## Ativar a área real

1. Entre no [painel Supabase](https://supabase.com/dashboard), crie/selecione a organização da equipe e crie um projeto no plano gratuito disponível. Escolha nome (por exemplo, `juventude-em-acao`), região adequada aos usuários e senha forte para o banco, guardada em gerenciador de senhas. Aguarde o provisionamento. A senha do banco não é a chave da API nem a senha de um participante. No SQL Editor, abra uma nova consulta e execute o conteúdo completo de [`supabase/migrations/202609140001_initial.sql`](./supabase/migrations/202609140001_initial.sql) **uma única vez em um banco novo**. O arquivo não é um script de reset. Confira as tabelas `members`, `actions`, `participations`, `tasks`, `assignments`, `materials` e `offers`, com RLS habilitado. Mantenha a Data API habilitada para o schema `public`; não crie políticas de acesso anônimo às tabelas privadas. [Guia oficial de criação e conexão](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs).
2. Em Authentication, desative novos cadastros públicos (Allow new users to sign up), habilite e-mail/senha, configure senha mínima de 12 caracteres e expiração do JWT em 900 segundos. O serviço administrativo cria os convites. Não é necessário SMTP para os links gerados pelo sistema, pois não há envio de e-mail.
3. Configure Site URL e URLs permitidas para a origem local e, ao publicar, para a origem HTTPS da Vercel.
4. Copie `.env.example` para `.env.local` e preencha as quatro variáveis. URL e chave `anon` (ou chave pública compatível) são públicas; a **service_role é exclusiva do servidor**. Nunca use `NEXT_PUBLIC_` no nome desta chave. Não envie segredos em chats nem os inclua no repositório.
5. Reinicie o servidor. Crie a primeira coordenação localmente:

```powershell
node --env-file=.env.local scripts/manage-member.mjs bootstrap "email-da-coordenacao@exemplo.com" "Nome da coordenação"
```

Use o e-mail verdadeiro na execução, não o exemplo. O comando cria o cadastro e imprime um link privado de ativação; não envia mensagem. Abra o link e escolha **Continuar e definir senha**. Apenas essa confirmação consome o token, evitando consumo acidental por prévias automáticas de links. Ele expira conforme a configuração do Supabase e tem uso único. Já existindo coordenação, o bootstrap recusa repetir.

6. A coordenação entra em `/painel`, cadastra ações e, em **Convites**, informa nome e e-mail do participante. O sistema gera um link que a coordenação entrega de forma privada. Novos participantes sempre têm papel de participante. Confirmação de participação não é presença nem autorização do responsável.

### Variáveis e URLs, sem ambiguidade

Copie o modelo somente se ainda não houver um arquivo configurado:

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

No painel Supabase, procure **Connect** e **Settings → API Keys**. Os nomes de menus podem mudar. Preencha localmente:

| Variável deste projeto | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, como `https://SEU-PROJETO.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública `anon` ou publishable compatível. Preserve este nome de variável: é o nome que o código lê. |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave administrativa `service_role`, somente no servidor e scripts administrativos |
| `NEXT_PUBLIC_SITE_URL` | Origem do próprio site, como `http://localhost:3000`, sem caminho de página |

Nunca coloque a chave administrativa no campo da chave pública. Neste ambiente local, as chaves existentes do projeto já estão em `.env.local` e a Data API respondeu ao teste. Em um novo computador ou na Vercel, configure as variáveis novamente; não copie o segredo para o Git. Se o painel apresentar um modelo novo de chaves, confira a [documentação de API Keys](https://supabase.com/docs/guides/api/api-keys) antes de substituir credenciais.

Em **Authentication → URL Configuration**, a Site URL do projeto hospedado é `https://site-mensageiros-da-cruz-ihc-ii.vercel.app`. Estão permitidos `https://site-mensageiros-da-cruz-ihc-ii.vercel.app/auth/confirm` e `http://localhost:3000/auth/confirm`, este último apenas para testes locais. Se usar outra porta/host, mantenha a mesma origem em todas as configurações. Os scripts geram o link a partir de `NEXT_PUBLIC_SITE_URL`, portanto uma origem errada produz convites para o endereço errado. [Configuração de URLs](https://supabase.com/docs/guides/auth/redirect-urls).

Desabilitar cadastro público no Supabase é necessário mesmo sem uma tela de cadastro, pois a API de Auth também existe. Confira as opções em [General configuration](https://supabase.com/docs/guides/auth/general-configuration). Não use SQL manual para definir senha de participante. A primeira pessoa coordenadora também define sua senha pelo link de ativação.

### Recuperação e desativação

Operações locais para o administrador que possui a chave de serviço:

```powershell
node --env-file=.env.local scripts/manage-member.mjs recover "email-do-membro@exemplo.com"
node --env-file=.env.local scripts/manage-member.mjs deactivate "email-do-membro@exemplo.com"
```

`recover` gera um link de nova senha somente para membro ativo, sem e-mail automático. Também atende convites expirados. `deactivate` retira o acesso aos dados mesmo com sessão existente. Coordenadores são desativados manualmente no Supabase, após garantir outro coordenador ativo. Se uma criação de convite falhar ao registrar o perfil, confira em Authentication e na tabela `members`: contas sem perfil não acessam dados; remova apenas o cadastro órfão confirmado antes de tentar de novo.

A coordenação deve revisar os compromissos de quem saiu: na ação, pode liberar tarefas incompletas e retirar o saldo ainda não recebido de ofertas. O histórico de entregas permanece. O participante também pode liberar sua própria tarefa incompleta e retirar sua própria oferta pendente; para corrigir quantidade, retire o saldo e faça uma nova oferta. Formulários antigos de recebimento são rejeitados quando o valor já mudou.

## Publicar na Vercel

O projeto está publicado em **[site-mensageiros-da-cruz-ihc-ii.vercel.app](https://site-mensageiros-da-cruz-ihc-ii.vercel.app/)**, a partir de `main`, como Next.js na Vercel Hobby. As quatro variáveis estão cadastradas como segredos somente em **Production**, com `NEXT_PUBLIC_SITE_URL` igual à origem HTTPS publicada. O Supabase usa essa origem como Site URL e permite seu `/auth/confirm`. Em 22/09/2026, o deployment de `2c756de` estava Ready; a página pública, a prévia interativa, a confirmação fictícia de participação e a tela de entrada foram verificadas no domínio HTTPS. A autenticação com contas reais ainda precisa de validação. Não configure rewrite de SPA. Mantenha ambientes de demonstração separados dos dados reais.

Passo a passo:

1. No painel Vercel, escolha **Add New → Project** e importe este repositório com autorização da conta responsável.
2. Use a raiz do repositório como Root Directory, preset **Next.js**, instalação `npm ci` e build `npm run build`; mantenha o diretório de saída padrão do framework. [Documentação oficial](https://vercel.com/docs/frameworks/full-stack/nextjs).
3. Configure as quatro variáveis da tabela no ambiente **Production**. Guarde a chave de serviço como segredo do servidor. Não reutilize o banco real em previews de alterações não revisadas.
4. Faça o deploy, confirme o domínio gerado, ajuste `NEXT_PUBLIC_SITE_URL` para essa origem e faça redeploy se ela mudou. Atualize também Site URL e redirecionamentos no Supabase.
5. As rotas `/`, `/previa` e `/entrar` já carregaram em produção. Ainda execute o fluxo completo com contas fictícias depois de criar a primeira coordenação. Gere novos links se os anteriores apontavam para localhost. Só então convide participantes reais.
6. Defina responsáveis por manutenção, recuperação de acesso, atualização de dependências e backup/restauração. Guardar código no GitHub não é backup do banco.

O [plano Hobby da Vercel](https://vercel.com/docs/plans/hobby) é gratuito e restrito a uso pessoal ou não comercial; a equipe e a entidade devem confirmar que o uso pretendido se enquadra nessa condição. O [Supabase Free](https://supabase.com/pricing) oferece 500 MB de banco e pode [pausar projetos com pouca atividade após sete dias](https://supabase.com/docs/guides/platform/free-project-pausing). Não há backup automático disponível para recuperação no plano gratuito: a [recomendação oficial](https://supabase.com/docs/guides/platform/backups) é exportar regularmente os dados com `supabase db dump` e guardar cópias fora do serviço. Definir responsável, frequência, local protegido e teste de restauração antes de armazenar dados reais. A gratuidade não garante disponibilidade contínua.

## Verificação

```powershell
npm test
npm run typecheck
npm run build
npm audit
```

Em 22/09/2026, `npm audit` consultou o registro npm e não encontrou vulnerabilidades nas dependências instaladas; repetir antes de publicar e periodicamente depois.

Com o servidor iniciado (`npm run start` após o build), execute também `npm run test:http`. Esse teste verifica público, redirecionamento de visitantes e a política CSP com nonce dos scripts. As páginas são dinâmicas para gerar um nonce por resposta; a integração Supabase ocorre no servidor.

Os testes usam PostgreSQL embarcado (PGlite) e executam a migração real, inclusive políticas RLS e permissões simulando os grants padrão do Supabase. Verificam visitantes, papéis, privacidade, duplicidade, disputa de tarefa, recebimento parcial, limites, cancelamento e inativação. Os testes dos handlers usam o código TypeScript de produção com fronteiras controladas; o teste de sessão atravessa o cliente Supabase SSR e cookies usando respostas HTTP fictícias. **Não validam o serviço Auth hospedado**: após preencher as chaves, testar dois participantes e um coordenador no Supabase real, incluindo convite, senha, sessão, recarregamento e saída.

## BMAD local

Planejamento em `_bmad-output/specs/spec-juventude-em-acao/`; execução em `_bmad-output/implementation-artifacts/spec-primeira-versao.md`.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/bmad.ps1 -Skill bmad-build
```

Esse auxiliar usa o Python disponível e Jinja2 em `tmp/python-packages` para contornar o erro de descoberta do Python pelo `uv run` neste computador. Renderiza as skills oficiais locais sem modificá-las nem instalar skills no usuário. Leia o `workflow.md` que o comando indicar.

## Antes da avaliação com o grupo

Validar textos, rotina de convites, necessidades por ação e termos usados nas tarefas. Obter autorização antes de usar fotos ou contatos. Avaliar no celular e por teclado: encontrar uma ação, entender instruções, confirmar participação, assumir/concluir tarefa e distinguir oferta de recebimento. Não cadastrar beneficiários nem dados sensíveis. A ativação para o grupo depende das contas da equipe e dessa validação.

## Tudo o que falta para entrar em uso

### Prioridade 1 — ativar e verificar os serviços

- [x] Criar projeto Supabase, aplicar migração, conferir RLS, habilitar Data API e configurar Auth/URLs e variáveis locais.
- [ ] Registrar com a entidade os responsáveis pela conta Supabase.
- [x] Criar a primeira conta de coordenação e seu perfil ativo; gerar convite privado para ativação no domínio publicado.
- [ ] A primeira coordenação deve definir a própria senha pelo convite; depois, criar dois participantes fictícios por convite.
- [ ] Validar convite de uso único, senha, login/logout, sessão após recarregar, recuperação e convite expirado no Auth hospedado.
- [ ] Testar no serviço real a separação de dados entre os dois participantes e a visão administrativa; conferir também Minhas confirmações na coordenação.
- [ ] Confirmar persistência após recarregar: ação, participação, tarefa, oferta e recebimento parcial.
- [ ] Testar disputa pela mesma tarefa, cancelamento de ação, recebimento desatualizado e perda de acesso de membro desativado.
- [x] Concluir 2FA da conta Vercel, criar projeto ligado ao GitHub, configurar quatro variáveis somente em Production, publicar e verificar páginas públicas e de entrada em HTTPS.
- [x] Definir Site URL e retorno HTTPS no Supabase, preservando o retorno local para desenvolvimento.
- [ ] Conferir elegibilidade, limites e adequação dos planos gratuitos da equipe; definir backup, teste de restauração e procedimento para indisponibilidade.

### Prioridade 2 — validar com a entidade e entregar a extensão

- [ ] Validar os demais textos públicos e a identidade visual com a entidade; confirmar uso de fotos/logotipo. O Instagram do grupo foi autorizado pela equipe e já consta na página pública.
- [ ] Observar a rotina e validar necessidades com coordenação e jovens; registrar retorno e alterações necessárias.
- [ ] Definir responsáveis por convites, organização das ações, recebimentos e suporte.
- [ ] Definir quais dados são necessários, regras de acesso/retenção/exclusão e orientação para participação de menores com a entidade. Confirmação no site não substitui autorização do responsável.
- [ ] Realizar avaliação de usabilidade no celular e por teclado: encontrar ação, compreender detalhes, confirmar, assumir tarefa e oferecer material; registrar dificuldades e retestar correções.
- [ ] Revisar/preencher os documentos acadêmicos Trabalho 2 e Trabalho 2 – formulário, obter validação/assinaturas exigidas e organizar evidências da atividade extensionista. Confirmar o prazo da disciplina separadamente do prazo do software.
- [x] Preparar orientação curta para coordenação e participantes em `docs/guia-de-uso.md`.
- [ ] Validar a orientação com a entidade e entregar a responsabilidade operacional.

### Melhorias futuras, sem compromisso de implementação nesta versão

Não estão implementados envio automático de e-mails/notificações, cadastro público, aplicativo móvel nativo, controle de presença, autorização digital de responsáveis, estoque geral, pagamentos/doações financeiras, cadastro de beneficiários, relatórios/exportações administrativos ou editor de conteúdo público. A manutenção de contas usa os scripts descritos. Avaliar essas necessidades com a entidade antes de ampliar o escopo. Não são requisitos para experimentar a prévia.

### Problemas comuns

| Sintoma | Conferir |
|---|---|
| Entrada informa ambiente indisponível | Variáveis preenchidas, nomes exatos e reinicialização/redeploy |
| Login não permite entrar no painel | Convite ativado, perfil existente em `members`, `active=true` e senha correta |
| Link aponta para endereço errado | `NEXT_PUBLIC_SITE_URL`; gerar novo link após corrigir |
| Convite expirado ou já utilizado | Administrador gera `recover` para o membro ativo |
| Erro de tabela/permissão | Migração completa no banco certo, Data API/schema e RLS; não desabilitar RLS para contornar |
| Bootstrap informa coordenação existente | Recuperar acesso com `recover`, sem repetir bootstrap |
| Dados somem ao atualizar `/previa` | Comportamento intencional; persistência existe apenas na área real configurada |
| Alteração de variável não aparece na Vercel | Conferir ambiente Production e executar novo deploy |

Arquivos `.env*` (exceto modelo vazio), `.next`, `node_modules`, caches, logs, PDFs locais e renders temporários do BMAD são ignorados pelo Git. Antes de qualquer commit, conferir `git diff --cached` e não versionar links privados de convite/recuperação.

## Encontrar ações na agenda

A agenda privada e a prévia compartilham busca por título ou local (sem diferença de maiúsculas ou acentos; espaços normalizados) e filtros combinados. **Hoje e próximas** inclui todas as ações programadas do dia civil em `America/Sao_Paulo`, mesmo após seu horário inicial, e as futuras. **Anteriores** mostra programadas antes de hoje, da mais recente para a mais antiga. **Canceladas** mostra somente canceladas; **Todas** inclui todas. As demais listas ficam em ordem crescente; empates de horário são resolvidos pelo ID.

**Minhas confirmações** considera somente a participação do usuário atual, inclusive na coordenação. Tarefas assumidas e materiais oferecidos não equivalem a confirmar participação. Cada confirmação aparece no cartão; a contagem acompanha os filtros. Limpar retorna a hoje e próximas, busca vazia e ações sem restringir às próprias confirmações. Os filtros ficam apenas em memória e reiniciam ao recarregar. A prévia usa 24/10/2026 como data de referência fictícia, indicada na página; não apresenta calendário oficial. A consulta privada busca apenas os identificadores das ações confirmadas pelo próprio membro, sem enviar dados dos demais participantes ao navegador. Falhas de leitura seguem para a tela de erro existente.

