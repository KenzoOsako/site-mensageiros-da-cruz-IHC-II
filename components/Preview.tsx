'use client';
import { useEffect, useRef, useState } from 'react';
import { civilDate, filterAgenda, initialAgendaFilters, type AgendaFilters as Filters } from '@/lib/agenda';
import { AgendaFilters } from './agenda-filters';

const referenceDate = '2026-10-24T15:00:00-03:00';

const upcomingExamples = [
  { id: 'encontro', starts_at: '2026-10-24T14:00:00-03:00', status: 'scheduled' as const, title: 'Encontro de solidariedade', date: '24 OUT', time: 'Sábado, 14h às 16h', location: 'Espaço comunitário de exemplo', category: 'CONVIVÊNCIA', description: 'Uma tarde para conversar, preparar cartões e compartilhar momentos de convivência.', instructions: 'Neste exemplo, chegue 15 minutos antes e procure a pessoa responsável pela organização.', tasks: ['Organizar o espaço', 'Preparar os cartões'], material: 'Papel colorido', unit: 'folhas', needed: 50 },
  { id: 'quermesse', starts_at: '2026-11-07T15:00:00-03:00', status: 'scheduled' as const, title: 'Mutirão da quermesse', date: '07 NOV', time: 'Sábado, 15h às 18h', location: 'Pátio de exemplo', category: 'COMUNIDADE', description: 'Vamos preparar o espaço e colaborar na organização de uma atividade comunitária.', instructions: 'Neste exemplo, combine sua tarefa com a coordenação e use roupas confortáveis.', tasks: ['Preparar as mesas', 'Organizar a sinalização'], material: 'Copos de papel', unit: 'unidades', needed: 100 },
];
const examples = [...upcomingExamples,
  { ...upcomingExamples[0], id: 'anterior', title: 'Oficina anterior fictícia', starts_at: '2026-10-17T14:00:00-03:00', date: '17 OUT', description: 'Exemplo fictício de uma atividade que já aconteceu. Não aceita novos compromissos.' },
  { ...upcomingExamples[1], id: 'cancelada', title: 'Mutirão cancelado fictício', starts_at: '2026-10-31T15:00:00-03:00', date: '31 OUT', status: 'cancelled' as const, description: 'Exemplo fictício de uma ação cancelada. Não aceita novos compromissos.' },
];
type Example = (typeof examples)[number];
type Commitment = { joined: boolean; tasks: Record<string, 'taken' | 'done'>; offered: number; receipts: number[] };
const empty = (): Commitment => ({ joined: false, tasks: {}, offered: 0, receipts: [] });
const isPast = (item: Example) => civilDate(item.starts_at) < civilDate(referenceDate);
const situation = (item: Example) => item.status === 'cancelled' ? 'Cancelada' : isPast(item) ? 'Realizada' : 'Programada';
const roleNames = { participant: 'Participante fictício', coordinator: 'Coordenação fictícia' };
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export default function Preview() {
  const [filters, setFilters] = useState(initialAgendaFilters);
  const [selected, setSelected] = useState<string | null>('encontro');
  const [role, setRole] = useState<'participant' | 'coordinator'>('participant');
  const [records, setRecords] = useState<Record<string, Commitment>>(() => Object.fromEntries(examples.map(item => [item.id, empty()])));
  const agendaHeading = useRef<HTMLHeadingElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const lastTaskClick = useRef({ task: '', at: 0 });
  const [quantity, setQuantity] = useState('10');
  const [receipt, setReceipt] = useState('1');
  const [offerError, setOfferError] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [pendingExcess, setPendingExcess] = useState<number | null>(null);
  const [message, setMessage] = useState('Escolha uma ação e experimente como colaborar.');
  // The notice is transient: it disappears on its own so it never keeps describing an old context.
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(''), 8000); return () => clearTimeout(timer); }, [message]);
  const visible = filterAgenda(examples.map(item => ({ ...item, confirmed: records[item.id].joined })), filters, referenceDate);
  const action = visible.find(item => item.id === selected);
  const current = action ? records[action.id] : undefined;
  const cancelled = action?.status === 'cancelled';
  const locked = !!action && (cancelled || isPast(action));
  const lockReason = cancelled ? 'Ação cancelada: não aceita novos compromissos.' : 'Esta ação já aconteceu: não aceita novos compromissos.';
  const received = current ? sum(current.receipts) : 0;
  function resetForms() { setOfferError(''); setReceiptError(''); setPendingExcess(null); }
  function changeFilters(next: Filters) {
    const nextVisible = filterAgenda(examples.map(item => ({ ...item, confirmed: records[item.id].joined })), next, referenceDate);
    setFilters(next);
    setSelected(previous => nextVisible.some(item => item.id === previous) ? previous : nextVisible[0]?.id ?? null);
    resetForms();
    setMessage('');
  }
  function select(id: string) {
    setSelected(id);
    resetForms();
    setMessage('');
    if (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 720px)').matches) setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }
  function save(value: Partial<Commitment>, feedback: string) {
    if (!action) return;
    setRecords(previous => ({ ...previous, [action.id]: { ...previous[action.id], ...value } }));
    if (value.joined === false && filters.mine) {
      setSelected(null);
      agendaHeading.current?.focus();
      setMessage(feedback + ' Escolha uma ação na agenda para continuar.');
    } else setMessage(feedback);
  }
  function update(value: Partial<Commitment>, feedback: string) { if (!action || locked) return; save(value, feedback); }
  function changeTask(task: string, next: 'taken' | 'done' | null, feedback: string) {
    if (!current) return;
    // Ignore a second click on the same task right after the first, so a double click cannot take and finish it at once.
    const now = Date.now();
    if (lastTaskClick.current.task === task && now - lastTaskClick.current.at < 800) return;
    lastTaskClick.current = { task, at: now };
    const tasks = { ...current.tasks };
    if (next) tasks[task] = next; else delete tasks[task];
    update({ tasks }, feedback);
  }
  function applyOffer(total: number) {
    if (!action) return;
    setPendingExcess(null);
    setOfferError('');
    update({ offered: total }, `${action.title}: sua oferta agora é de ${total} ${action.unit}, somente nesta prévia. O recebimento ainda precisa ser confirmado.`);
  }
  function offer(event: React.FormEvent) {
    event.preventDefault();
    if (!action || !current || locked) return;
    const total = Number(quantity);
    if (quantity.trim() === '' || !Number.isInteger(total) || total < 1 || total > 100000) { setOfferError('Informe um número inteiro de 1 a 100.000.'); return; }
    if (total < received) { setOfferError(`A coordenação já recebeu ${received} ${action.unit}. A oferta não pode ser menor que isso.`); return; }
    if (total > action.needed) { setOfferError(''); setPendingExcess(total); return; }
    applyOffer(total);
  }
  function withdraw() {
    if (!action || !current) return;
    resetForms();
    update({ offered: received }, received ? `${action.title}: a parte não entregue da sua oferta foi retirada.` : `${action.title}: sua oferta foi retirada.`);
  }
  function receive(event: React.FormEvent) {
    event.preventDefault();
    if (!action || !current || cancelled) return;
    const amount = Number(receipt);
    const balance = current.offered - received;
    if (receipt.trim() === '' || !Number.isInteger(amount) || amount < 1) { setReceiptError('Informe um número inteiro maior que zero.'); return; }
    if (amount > balance) { setReceiptError(`Só faltam receber ${balance} ${action.unit} do que foi oferecido.`); return; }
    setReceiptError('');
    save({ receipts: [...current.receipts, amount] }, `${action.title}: recebimento fictício de ${amount} ${action.unit} registrado pela coordenação.`);
  }
  function reverse(index: number) {
    if (!action || !current) return;
    const amount = current.receipts[index];
    save({ receipts: current.receipts.filter((_, position) => position !== index) }, `${action.title}: recebimento de ${amount} ${action.unit} estornado.`);
  }
  const available = action && current ? action.tasks.filter(task => !current.tasks[task]).length : 0;
  return <div className="dashboard preview-page">
    <div className="notice preview-notice"><strong>PRÉVIA · DADOS FICTÍCIOS</strong><span>Experimente à vontade. Nada aqui cria uma conta ou altera dados reais. Ao recarregar, os exemplos voltam ao início. Data de referência da demonstração: 24/10/2026, em Brasília; não é a agenda oficial.</span></div>
    <div className="dashboard-heading"><div><span className="eyebrow">ÁREA DO GRUPO / DEMONSTRAÇÃO</span><h1>O bem começa<br/>com um próximo passo.</h1><p>Encontre uma ação e escolha como colaborar.</p><a className="jump-link" href="#agenda">Ir para a agenda ↓</a></div><div className="role-picker"><label>Experimentar como<select value={role} onChange={event => { const next = event.target.value as typeof role; setRole(next); setMessage(next === 'coordinator' ? `Agora você vê a prévia como ${roleNames[next]}. A agenda e a ação escolhida continuam as mesmas; em Materiais da ação apareceu a área da coordenação.` : `Agora você vê a prévia como ${roleNames[next]}. A área da coordenação foi ocultada.`); }}><option value="participant">{roleNames.participant}</option><option value="coordinator">{roleNames.coordinator}</option></select></label><p className={`role-banner ${role}`}>Você está vendo como <strong>{roleNames[role]}</strong></p></div></div>
    <div className="preview-columns"><aside className="agenda" id="agenda"><div className="subheading"><h2 ref={agendaHeading} tabIndex={-1}>Agenda de exemplo</h2><span role="status">{visible.length} {visible.length === 1 ? 'ação encontrada' : 'ações encontradas'}</span></div><AgendaFilters value={filters} onChange={changeFilters} />{!visible.length && <div className="agenda-empty"><h3>Nenhuma ação encontrada</h3><p>Nenhum exemplo corresponde à busca e aos filtros escolhidos.</p><button type="button" className="button button-outline" onClick={() => changeFilters({ search: '', mine: false, period: 'all' })}>Ver todas as ações</button></div>}{visible.map(item => <button type="button" key={item.id} className={`agenda-card ${action?.id === item.id ? 'selected' : ''}`} onClick={() => select(item.id)} aria-pressed={action?.id === item.id}><span className="date-chip">{item.date}</span><span><small>{item.category}</small><strong>{item.title}</strong><span className="agenda-time">{item.time}</span><span className={`status-tag ${item.status === 'cancelled' ? 'cancelled' : isPast(item) ? 'past' : ''}`}>{situation(item)}</span>{item.confirmed && <span className="agenda-confirmed">✓ Sua participação confirmada</span>}</span><span aria-hidden="true">→</span></button>)}<div className="aside-note"><span aria-hidden="true">✦</span><p><strong>Um compromisso de cada vez.</strong>Confirmação de participação expressa intenção. Não registra presença nem autorização de responsável.</p></div></aside>
      {action && current ? <section key={action.id} ref={detailRef} className="action-detail" aria-label="Detalhes da ação selecionada"><a className="jump-link" href="#agenda">↑ Voltar à agenda</a><span className="badge">{cancelled ? 'AÇÃO FICTÍCIA CANCELADA' : isPast(action) ? 'AÇÃO FICTÍCIA REALIZADA' : 'AÇÃO FICTÍCIA'}</span><h2>{action.title}</h2><p>{action.description}</p><dl className="action-facts"><div><dt>Quando</dt><dd>{action.date} · {action.time}</dd></div><div><dt>Onde</dt><dd>{action.location}</dd></div></dl><div className="instructions"><strong>Antes de participar</strong><p>{action.instructions}</p></div>
        <div className="participation-line"><span>{locked ? lockReason : current.joined ? '✓ Você confirmou sua participação' : 'Sua presença começa com uma confirmação'}</span><button type="button" disabled={locked} className={current.joined ? 'button button-outline' : 'button'} onClick={() => update({ joined: !current.joined }, current.joined ? `${action.title}: participação fictícia cancelada.` : `${action.title}: participação fictícia confirmada. Você pode cancelar quando quiser.`)}>{current.joined ? 'Cancelar participação' : 'Confirmar participação'}</button></div>
        <div className="detail-block"><div className="subheading"><h3>Tarefas para colaborar</h3><span>{locked ? 'Indisponíveis' : `${available} de ${action.tasks.length} ${available === 1 ? 'disponível' : 'disponíveis'}`}</span></div>{action.tasks.map(task => <div className="task-row" key={task}><div><strong>{task}</strong><small>{locked ? (cancelled ? 'Indisponível · ação cancelada' : 'Indisponível · ação realizada') : current.tasks[task] === 'done' ? '✓ Concluída por você' : current.tasks[task] === 'taken' ? 'Você assumiu esta tarefa' : 'Disponível · 1 responsável'}</small></div>
          {current.tasks[task] === 'done' ? <div className="task-actions"><span className="badge success">Concluída</span><button type="button" disabled={locked} className="button button-outline button-small" onClick={() => changeTask(task, 'taken', `${task}: conclusão desfeita. A tarefa continua com você.`)}>Reabrir</button></div>
          : current.tasks[task] === 'taken' ? <div className="task-actions"><button type="button" disabled={locked} className="button button-small" onClick={() => changeTask(task, 'done', `${task}: tarefa fictícia concluída. Use Reabrir se foi engano.`)}>Concluir</button><button type="button" disabled={locked} className="button button-outline button-small" onClick={() => changeTask(task, null, `${task}: tarefa devolvida. Ela está disponível de novo.`)}>Devolver</button></div>
          : <button type="button" disabled={locked} className="button button-outline button-small" onClick={() => changeTask(task, 'taken', `${task}: você assumiu esta tarefa de exemplo.`)}>Assumir tarefa</button>}</div>)}</div>
        <div className="detail-block"><h3>Materiais da ação</h3><p>{action.material} <span className="muted">· {action.unit}</span></p><div className="material-stats"><div><strong>{action.needed}</strong><span>Necessários</span></div><div><strong>{current.offered}</strong><span>Oferecidos</span></div><div><strong>{received}</strong><span>Recebidos</span></div></div><p className="muted">{current.offered >= action.needed ? 'A necessidade desta ação já foi coberta pelas ofertas.' : `Faltam ${action.needed - current.offered} ${action.unit} para cobrir a necessidade.`} Oferecer não confirma a entrega; a coordenação registra o recebimento.</p>
          {current.offered > 0 && <div className="own-offer"><span>Sua oferta: <strong>{current.offered} {action.unit}</strong></span><button type="button" disabled={locked || current.offered === received} className="button button-outline button-small" onClick={withdraw}>{received ? 'Retirar o que não foi entregue' : 'Retirar oferta'}</button></div>}
          <form className="inline-form" noValidate onSubmit={offer}><label>{current.offered > 0 ? `Alterar sua oferta para (total em ${action.unit})` : `Quantidade a oferecer (${action.unit})`}<input type="number" inputMode="numeric" disabled={locked} min="1" max="100000" step="1" value={quantity} aria-invalid={!!offerError} aria-describedby={offerError ? 'offer-error' : undefined} onChange={event => { setQuantity(event.target.value); setOfferError(''); setPendingExcess(null); }}/></label><button className="button" type="submit" disabled={locked}>{current.offered > 0 ? 'Atualizar oferta' : 'Oferecer material'}</button></form>
          {offerError && <p className="field-error" id="offer-error" role="alert">{offerError}</p>}
          {pendingExcess !== null && <div className="excess-warning" role="alert"><p>Sua oferta de <strong>{pendingExcess} {action.unit}</strong> passa da necessidade de {action.needed} {action.unit}. Confira se o número está certo.</p><div className="task-actions"><button type="button" className="button button-small" onClick={() => applyOffer(pendingExcess)}>Confirmar {pendingExcess} {action.unit}</button><button type="button" className="button button-outline button-small" onClick={() => setPendingExcess(null)}>Corrigir</button></div></div>}
          {locked && <p className="muted">{lockReason}</p>}
          {role === 'coordinator' && <div className="coordination-box"><h4>Área da coordenação</h4><form className="inline-form" noValidate onSubmit={receive}><label>Registrar recebimento ({action.unit})<input type="number" inputMode="numeric" disabled={cancelled} min="1" max={Math.max(1, current.offered - received)} step="1" value={receipt} aria-invalid={!!receiptError} aria-describedby={receiptError ? 'receipt-error' : undefined} onChange={event => { setReceipt(event.target.value); setReceiptError(''); }}/></label><button className="button button-outline" type="submit" disabled={cancelled || current.offered === received}>Confirmar recebimento</button></form>{receiptError && <p className="field-error" id="receipt-error" role="alert">{receiptError}</p>}
            {current.receipts.length ? <ul className="receipt-list" aria-label="Histórico de recebimentos">{current.receipts.map((amount, index) => <li key={index}><span>Recebimento {index + 1}: <strong>{amount} {action.unit}</strong></span><button type="button" disabled={cancelled} className="button button-outline button-small" onClick={() => reverse(index)}>Estornar</button></li>)}</ul> : <p className="muted">Nenhum recebimento registrado ainda.</p>}</div>}</div>
      </section> : visible.length > 0 && <section className="action-detail" aria-label="Nenhuma ação selecionada"><h2>Escolha uma ação</h2><p>Selecione um cartão da agenda para abrir seus detalhes.</p></section>}</div><div role="status" aria-live="polite" className="feedback">{message}</div>
  </div>;
}
