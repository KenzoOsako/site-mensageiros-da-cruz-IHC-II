---
id: SPEC-juventude-em-acao
status: draft
created: 2026-09-14
updated: 2026-09-14
companions:
  - regras-e-pendencias.md
  - plano-de-validacao.md
sources: []
---

# Juventude em Ação

Especificação inicial derivada do registro de decisões da conversa. Este arquivo e seus documentos complementares definem a proposta; hipóteses e questões abertas não constituem requisitos aprovados pela entidade.

## Why

Criar um site que apresente o grupo Mensageiros da Cruz Tupã, da Paróquia São Pedro Apóstolo, e apoie a organização de suas ações comunitárias: visitas à Casa de Idosos, à APAE e à Casa do Garoto, encontros e apoio a atividades como quermesses. O grupo atende principalmente jovens de 12 a 18 anos, com participantes de outras idades, e relata organização predominantemente manual. O projeto integra o trabalho de extensão de SI406: a dificuldade específica e o benefício da solução deverão ser investigados com jovens e coordenadores, sem pressupor que todo processo manual precise ser substituído. Juventude em Ação permanece como nome de trabalho da solução.

## Capabilities

- **CAP-1 — Apresentação pública**
  - **intent:** Visitantes conhecem o propósito, as atividades e os encontros do grupo e descobrem como entrar em contato para participar.
  - **success:** Sem autenticação, uma pessoa encontra essas informações; os dados internos de participantes não aparecem na área pública.
- **CAP-2 — Acesso privado por convite**
  - **intent:** A coordenação convida participantes; cada participante acessa a área interna com suas credenciais e pode encerrar a sessão.
  - **success:** Um convidado consegue ativar seu acesso e entrar; visitante sem convite, credencial inválida e sessão encerrada não acessam recursos privados.
- **CAP-3 — Agenda de ações**
  - **intent:** Participantes consultam próximas ações, e a coordenação cria e atualiza sua programação.
  - **success:** Uma ação criada ou atualizada permanece disponível após nova consulta e pode ser localizada na agenda.
- **CAP-4 — Detalhes da ação**
  - **intent:** Participantes consultam objetivo, data, horário, local, orientações, tarefas e materiais de uma ação.
  - **success:** A partir da agenda, uma pessoa identifica quando e onde a ação ocorre e as formas de colaboração disponíveis.
- **CAP-5 — Participação**
  - **intent:** Participantes confirmam ou cancelam a própria participação; a coordenação acompanha as confirmações.
  - **success:** A alteração persiste e se reflete na consulta da coordenação sem duplicar a participação da mesma pessoa na mesma ação.
- **CAP-6 — Tarefas comunitárias**
  - **intent:** A coordenação organiza tarefas; participantes consultam oportunidades, assumem responsabilidades e informam conclusão.
  - **success:** Uma tarefa assumida identifica o responsável, e sua conclusão fica visível à coordenação após nova consulta.
- **CAP-7 — Materiais por ação**
  - **intent:** A coordenação registra necessidades de materiais, participantes oferecem contribuições e a coordenação confirma recebimentos.
  - **success:** A ação distingue quantidade necessária, oferecida e recebida; oferecer um material não o contabiliza automaticamente como recebido.
- **CAP-8 — Administração e permissões**
  - **intent:** A coordenação administra ações, tarefas, convites e recebimentos com permissões distintas das dos participantes.
  - **success:** Um participante não consegue executar operações exclusivas da coordenação nem alterar registros de outro participante, inclusive por requisição direta.

## Constraints

- Entregar uma aplicação com persistência e autenticação reais; protótipo navegável será uma etapa de validação, não a implementação final solicitada.
- Aplicar autorização aos dados e operações internos, além dos controles visuais da interface.
- Materiais pertencem a ações específicas, e a admissão ocorre por convite da coordenação, conforme decisões do usuário.
- Preservar diagnóstico, desenho participativo, testes de usabilidade e acessibilidade, melhorias e devolutiva no planejamento de SI406.
- Utilizar dados fictícios nas demonstrações iniciais; definir os procedimentos de participação de menores e tratamento de dados com os responsáveis antes do uso real.
- O prazo de 22/09/2026 do enunciado é para o plano assinado, não uma data confirmada de entrega do software.
- A instalação BMAD permanece local a este projeto.
- Hospedar na Vercel com custo zero como restrição; selecionar serviços de dados e autenticação compatíveis com esse orçamento. A adequação e os limites dos planos devem ser verificados na arquitetura.
- Não há prazo fixo para o site, conforme o usuário; isso não altera a data de entrega do plano da disciplina.

## Non-goals

- Estoque geral permanente, entradas e saídas desvinculadas de ações e empréstimo de bens.
- Cadastro público aberto para acesso à área interna.
- Nesta proposta inicial: pagamentos, chat, ranking de voluntários, aplicativo nativo e cadastro das pessoas atendidas nas instituições visitadas.
- Publicação em produção nesta etapa de planejamento.

## Success signal

Demonstrar a jornada completa: visitante encontra como participar; convidado acessa uma ação, confirma participação, assume uma tarefa e oferece um material; a coordenação consulta pendências e confirma recebimento. Os registros sobrevivem a uma nova sessão, e os testes de permissões impedem acesso indevido. Representantes do grupo avaliam as tarefas e a utilidade da solução; dificuldades observadas geram correções ou pendências explicitadas na entrega.

## Assumptions

- Uma entidade/paróquia na primeira versão, com perfis de participante e coordenação.
- Interface em português do Brasil, responsiva e com prioridade ao celular; dispositivos, conectividade e necessidades de acessibilidade ainda serão investigados.
- Participantes gerenciam seus compromissos, enquanto a coordenação acompanha o conjunto; visibilidade entre participantes ainda não está definida.
- Os cortes adicionais em Non-goals são propostas de escopo, exceto estoque permanente e cadastro aberto, já resolvidos pelo usuário.

## Open Questions

- **Q3:** Quem administrará as contas e a manutenção, e quais serviços gratuitos de dados e autenticação atenderão à Vercel e ao uso previsto?
- **Q4:** Quais conteúdos, imagens, horários e contatos oficiais podem ser publicados?
- **Q5:** Quais dados serão necessários, quem verá as listas de participantes e quais procedimentos serão adotados para participação de menores?
- **Q6:** Como ocorrerão entrega/validade dos convites, recuperação de acesso, desligamento de membros e criação inicial de coordenadores?
- **Q7:** Quais regras valem para vagas, prazos, desistência de tarefas e contribuições, alterações e cancelamento de ações?
- **Q8:** Quem participará dos testes, quais metas serão adotadas e a coordenação precisará editar o conteúdo público pelo próprio site?

As regras ainda abertas e o plano de investigação estão detalhados nos documentos complementares.
