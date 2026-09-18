# Regras e pendências

## Base de evidências

Fonte: conversa com Kenzo, iniciada com análise dos sete PDFs de SI406. O relato da entidade descreve evangelização juvenil pela formação e prática solidária, visitas a instituições e colaboração paroquial. A organização manual é um fato relatado; atrasos, perdas, retrabalho e redução da participação ainda não foram demonstrados.

Decisões confirmadas em 14/09/2026: site com área pública e área privada; agenda, detalhes, participação, tarefas e materiais; primeira versão com materiais por ação e entrada por convite da coordenação. A entidade se chama Mensageiros da Cruz Tupã, da Paróquia São Pedro Apóstolo. Juventude em Ação é o nome de trabalho da solução. O usuário definiu ausência de prazo fixo e hospedagem na Vercel, com custo zero.

## Perfis propostos

| Operação | Visitante | Participante | Coordenação |
|---|---|---|---|
| Consultar apresentação e contato | Sim | Sim | Sim |
| Consultar agenda e detalhes internos | Não | Sim | Sim |
| Confirmar/cancelar a própria participação | Não | Sim | A definir quando atuar como participante |
| Assumir tarefas e oferecer materiais | Não | Sim | A definir quando atuar como participante |
| Criar/editar ações e tarefas | Não | Não | Sim |
| Acompanhar confirmações e recebimentos | Não | Somente acesso próprio proposto | Sim |
| Convidar membros | Não | Não | Sim |

A consulta da lista completa de participantes por outros participantes não está autorizada por esta proposta. A política definitiva depende de Q5; não inferir que todo dado privado é visível para qualquer pessoa autenticada.

## Distinções que devem permanecer na interface

- **Participação:** confirmar intenção não registra presença efetiva nem autorização de responsável para uma saída.
- **Tarefa:** assumir responsabilidade não equivale a concluir. Definir número de responsáveis, desistência e eventual validação da conclusão.
- **Materiais:** necessidade, oferta e recebimento são informações distintas. Definir unidades, recebimento parcial, desistência e excesso antes de implementar os cálculos finais.
- **Contato público:** manifestar interesse em participar não concede acesso; a coordenação envia o convite.
- **Ação alterada/cancelada:** a interface deve evitar informação contraditória, mas regras de comunicação e cancelamento dependem de Q7. Notificações automáticas ainda não fazem parte do escopo confirmado.

## Decisões antes da implementação afetada

| Pendência | Define | Momento necessário |
|---|---|---|
| Q3: serviços gratuitos e continuidade | Dados, autenticação, contas e manutenção | Antes da arquitetura e da operação real |
| Q4: conteúdo oficial | Textos, marca, fotos e contato | Antes da publicação; protótipo pode usar conteúdo provisório identificado |
| Q5: dados, visibilidade e menores | Modelo de dados, acesso e avaliação | Antes de coletar dados reais ou implementar permissões definitivas |
| Q6: ciclo de acesso | Convites, recuperação, desligamento e administradores | Antes de implementar autenticação |
| Q7: regras operacionais | Participação, tarefas e contribuições | Antes de implementar cada fluxo |
| Q8: testes e edição pública | Critérios de aceitação e administração | Antes da avaliação e do fechamento do escopo |

## Continuidade e limites

A entidade ainda deve validar a demanda e a proposta. Casa de Idosos, APAE e Casa do Garoto são instituições mencionadas no relato; não há autorização, parceria formal ou acesso aos seus dados presumidos. O público direto do sistema é o grupo juvenil e sua coordenação.

Vercel foi escolhida como hospedagem, com orçamento zero. Stack, provedor de autenticação, banco e domínio ainda não foram escolhidos; verificar a adequação dos planos gratuitos ao uso previsto e aos termos vigentes na etapa de arquitetura, sem prometer capacidade ilimitada. A manutenção deve ter responsável e condições acordadas. Não apresentar redução de trabalho ou aumento de voluntariado como resultados já alcançados.
