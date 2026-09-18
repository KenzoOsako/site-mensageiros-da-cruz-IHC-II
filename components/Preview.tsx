'use client';
import { useRef, useState } from 'react';
import { filterAgenda, initialAgendaFilters, type AgendaFilters as Filters } from '@/lib/agenda';
import { AgendaFilters } from './agenda-filters';

const referenceDate = '2026-10-24T15:00:00-03:00';

const upcomingExamples = [
  { id: 'encontro', starts_at: '2026-10-24T14:00:00-03:00', status: 'scheduled' as const, title: 'Encontro de solidariedade', date: '24 OUT', time: 'Sábado, 14h às 16h', location: 'Espaço comunitário de exemplo', category: 'CONVIVÊNCIA', description: 'Uma tarde para conversar, preparar cartões e compartilhar momentos de convivência.', instructions: 'Neste exemplo, chegue 15 minutos antes e procure a pessoa responsável pela organização.', tasks: ['Organizar o espaço', 'Preparar os cartões'], material: 'Papel colorido', unit: 'folhas', needed: 50 },
  { id: 'quermesse', starts_at: '2026-11-07T15:00:00-03:00', status: 'scheduled' as const, title: 'Mutirão da quermesse', date: '07 NOV', time: 'Sábado, 15h às 18h', location: 'Pátio de exemplo', category: 'COMUNIDADE', description: 'Vamos preparar o espaço e colaborar na organização de uma atividade comunitária.', instructions: 'Neste exemplo, combine sua tarefa com a coordenação e use roupas confortáveis.', tasks: ['Preparar as mesas', 'Organizar a sinalização'], material: 'Copos de papel', unit: 'unidades', needed: 100 },
];
const examples = [...upcomingExamples,
  { ...upcomingExamples[0], id: 'anterior', title: 'Oficina anterior fictícia', starts_at: '2026-10-17T14:00:00-03:00', date: '17 OUT', description: 'Exemplo fictício de uma atividade anterior à data de referência.' },
  { ...upcomingExamples[1], id: 'cancelada', title: 'Mutirão cancelado fictício', starts_at: '2026-10-31T15:00:00-03:00', date: '31 OUT', status: 'cancelled' as const, description: 'Exemplo fictício de uma ação cancelada. Não aceita novos compromissos.' },
];
type Commitment = { joined: boolean; tasks: Record<string, 'taken' | 'done'>; offered: number; received: number };
const empty = (): Commitment => ({ joined: false, tasks: {}, offered: 0, received: 0 });

export default function Preview() {
  const [filters, setFilters] = useState(initialAgendaFilters);
  const [selected, setSelected] = useState<string | null>('encontro');
  const [role, setRole] = useState<'participant' | 'coordinator'>('participant');
  const [records, setRecords] = useState<Record<string, Commitment>>(() => Object.fromEntries(examples.map(item => [item.id, empty()])));
  const agendaHeading = useRef<HTMLHeadingElement>(null);
  const [quantity, setQuantity] = useState('10');
  const [receipt, setReceipt] = useState('1');
  const [message, setMessage] = useState('Escolha uma ação e experimente como colaborar.');
  const visible = filterAgenda(examples.map(item => ({ ...item, confirmed: records[item.id].joined })), filters, referenceDate);
  const action = visible.find(item => item.id === selected);
  const current = action ? records[action.id] : undefined;
  function changeFilters(next: Filters) {
    const nextVisible = filterAgenda(examples.map(item => ({ ...item, confirmed: records[item.id].joined })), next, referenceDate);
    setFilters(next);
    setSelected(previous => nextVisible.some(item => item.id === previous) ? previous : nextVisible[0]?.id ?? null);
  }
  function update(value: Partial<Commitment>, feedback: string) {
    if (!action || action.status === 'cancelled') return;
    setRecords(previous => ({ ...previous, [action.id]: { ...previous[action.id], ...value } }));
    if (value.joined === false && filters.mine) {
      setSelected(null);
      agendaHeading.current?.focus();
      setMessage(feedback + ' Escolha uma ação na agenda para continuar.');
    } else setMessage(feedback);
  }
  function offer(event: React.FormEvent) { event.preventDefault(); if (!action || !current || action.status === 'cancelled') return; const amount = Number(quantity); if (!Number.isInteger(amount) || amount < 1 || amount > 100000) { setMessage('Informe uma quantidade inteira de 1 a 100.000.'); return; } update({ offered: current.offered + amount }, `Oferta de ${amount} ${action.unit} registrada somente nesta prévia. O recebimento ainda precisa ser confirmado.`); }
  function receive(event: React.FormEvent) { event.preventDefault(); if (!action || !current || action.status === 'cancelled') return; const amount = Number(receipt); if (!Number.isInteger(amount) || amount < 1 || amount > current.offered - current.received) { setMessage('O recebimento deve ser positivo e não pode ultrapassar o saldo oferecido.'); return; } update({ received: current.received + amount }, 'Recebimento fictício confirmado pela coordenação.'); }
  return <div className="dashboard preview-page">
    <div className="notice preview-notice"><strong>PRÉVIA · DADOS FICTÍCIOS</strong><span>Experimente à vontade. Nada aqui cria uma conta ou altera dados reais. Ao recarregar, os exemplos voltam ao início. Data de referência da demonstração: 24/10/2026, em Brasília; não é a agenda oficial.</span></div>
    <div className="dashboard-heading"><div><span className="eyebrow">ÁREA DO GRUPO / DEMONSTRAÇÃO</span><h1>O bem começa<br/>com um próximo passo.</h1><p>Encontre uma ação e escolha como colaborar.</p></div><label className="role-picker">Experimentar como<select value={role} onChange={event => { setRole(event.target.value as typeof role); setMessage('Perfil de demonstração alterado.'); }}><option value="participant">Participante fictício</option><option value="coordinator">Coordenação fictícia</option></select></label></div>
    <div className="preview-columns"><aside className="agenda"><div className="subheading"><h2 ref={agendaHeading} tabIndex={-1}>Agenda de exemplo</h2><span role="status">{visible.length} {visible.length === 1 ? 'ação encontrada' : 'ações encontradas'}</span></div><AgendaFilters value={filters} onChange={changeFilters} />{!visible.length && <div className="agenda-empty"><h3>Nenhuma ação encontrada</h3><p>Altere a busca para ver os exemplos.</p><button type="button" className="button button-outline" onClick={() => changeFilters({ search: '', mine: false, period: 'all' })}>Ver todas as ações</button></div>}{visible.map(item => <button type="button" key={item.id} className={`agenda-card ${action?.id === item.id ? 'selected' : ''}`} onClick={() => { setSelected(item.id); setMessage('Ação de exemplo selecionada.'); }} aria-pressed={action?.id === item.id}><span className="date-chip">{item.date}</span><span><small>{item.category}</small><strong>{item.title}</strong><span>{item.time}</span><span>{item.status === 'cancelled' ? 'Cancelada · exemplo fictício' : 'Programada'}</span>{item.confirmed && <span className="agenda-confirmed">✓ Sua participação confirmada</span>}</span><span aria-hidden="true">↗</span></button>)}<div className="aside-note"><span aria-hidden="true">✦</span><p><strong>Um compromisso de cada vez.</strong>Confirmação de participação expressa intenção. Não registra presença nem autorização de responsável.</p></div></aside>
      {action && current ? <section key={action.id} className="action-detail" aria-label="Detalhes da ação selecionada"><span className="badge">{action.status === 'cancelled' ? 'AÇÃO FICTÍCIA CANCELADA' : 'AÇÃO FICTÍCIA'}</span><h2>{action.title}</h2><p>{action.description}</p><dl className="action-facts"><div><dt>Quando</dt><dd>{action.date} · {action.time}</dd></div><div><dt>Onde</dt><dd>{action.location}</dd></div></dl><div className="instructions"><strong>Antes de participar</strong><p>{action.instructions}</p></div><div className="participation-line"><span>{current.joined ? '✓ Você confirmou sua participação' : 'Sua presença começa com uma confirmação'}</span><button type="button" disabled={action.status === 'cancelled'} className={current.joined ? 'button button-outline' : 'button'} onClick={() => update({ joined: !current.joined }, current.joined ? 'Participação fictícia cancelada.' : 'Participação fictícia confirmada. Você pode cancelar quando quiser.')}>{current.joined ? 'Cancelar participação' : 'Confirmar participação'}</button></div>
        <div className="detail-block"><div className="subheading"><h3>Tarefas para colaborar</h3><span>{action.tasks.length} oportunidades</span></div>{action.tasks.map(task => <div className="task-row" key={task}><div><strong>{task}</strong><small>{current.tasks[task] === 'done' ? '✓ Concluída por você' : current.tasks[task] === 'taken' ? 'Você assumiu esta tarefa' : 'Disponível · 1 responsável'}</small></div>{current.tasks[task] === 'done' ? <span className="badge success">Concluída</span> : <button type="button" disabled={action.status === 'cancelled'} className="button button-outline button-small" onClick={() => update({ tasks: { ...current.tasks, [task]: current.tasks[task] ? 'done' : 'taken' } }, current.tasks[task] ? 'Tarefa fictícia concluída.' : 'Você assumiu esta tarefa de exemplo.')}>{current.tasks[task] ? 'Concluir' : 'Assumir tarefa'}</button>}</div>)}</div>
        <div className="detail-block"><h3>Materiais da ação</h3><p>{action.material} <span className="muted">· {action.unit}</span></p><div className="material-stats"><div><strong>{action.needed}</strong><span>Necessários</span></div><div><strong>{current.offered}</strong><span>Oferecidos</span></div><div><strong>{current.received}</strong><span>Recebidos</span></div></div><p className="muted">Oferecer não confirma a entrega. A coordenação registra o recebimento.</p><form className="inline-form" onSubmit={offer}><label>Quantidade a oferecer<input type="number" disabled={action.status === 'cancelled'} required min="1" max="100000" step="1" value={quantity} onChange={event => setQuantity(event.target.value)}/></label><button className="button" type="submit" disabled={action.status === 'cancelled'}>Oferecer material</button></form>{role === 'coordinator' && <form className="inline-form coordination-box" onSubmit={receive}><label>Registrar recebimento fictício<input type="number" disabled={action.status === 'cancelled'} required min="1" max={Math.max(1, current.offered-current.received)} step="1" value={receipt} onChange={event => setReceipt(event.target.value)}/></label><button className="button" type="submit" disabled={action.status === 'cancelled' || current.offered === current.received}>Confirmar recebimento</button></form>}</div>
      </section> : <section className="action-detail" aria-label="Nenhuma ação selecionada"><h2>{visible.length ? 'Escolha uma ação' : 'Escolha outra busca'}</h2><p>{visible.length ? 'Selecione um cartão da agenda para abrir seus detalhes.' : 'Nenhuma ação corresponde aos filtros atuais. Use Ver todas as ações para voltar aos exemplos.'}</p></section>}</div><div role="status" aria-live="polite" className="feedback">{message}</div>
  </div>;
}
