import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth';
import { id as uuid } from '@/lib/validation';
import { ActionForm } from '@/components/action-form';
import { mutate } from '../../actions';
import { allRows } from '@/lib/pagination';
import { PendingButton } from '@/components/pending-button';
import { randomUUID } from 'node:crypto';
export const dynamic = 'force-dynamic';
function Fields({ op, actionId, extra = {} }: { op: string; actionId: string; extra?: Record<string,string> }) { return <><input type="hidden" name="op" value={op} /><input type="hidden" name="action_id" value={actionId} />{Object.entries(extra).map(([key,value]) => <input key={key} type="hidden" name={key} value={value} />)}</>; }
export default async function ActionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string; ok?: string }> }) {
  const { id } = await params; if (!uuid.safeParse(id).success) notFound();
  const { db, member } = await requireMember(); const admin = member.role === 'coordinator'; const query = await searchParams;
  const actionResult = await db.from('actions').select('*').eq('id',id).maybeSingle();
  if (actionResult.error) throw new Error('Falha ao carregar a ação.');
  const action = actionResult.data; if (!action) notFound();
  const [tasks,materials,parts,assignments,offers,availability,materialTotals,members] = await Promise.all([
    allRows(() => db.from('tasks').select('*').eq('action_id',id).order('title').order('id')),
    allRows(() => db.from('materials').select('*').eq('action_id',id).order('title').order('id')),
    allRows(() => db.from('participations').select('*').eq('action_id',id).order('member_id')),
    allRows(() => db.from('assignments').select('*,tasks!inner(action_id)').eq('tasks.action_id',id).order('task_id')),
    allRows(() => db.from('offers').select('*,materials!inner(action_id)').eq('materials.action_id',id).order('id')),
    allRows<{task_id:string;taken:boolean}>(() => db.rpc('task_availability', { target_action: id }).order('task_id')),
    allRows<{material_id:string;offered:number;received:number}>(() => db.rpc('material_totals', { target_action: id }).order('material_id')),
    allRows(() => db.from('members').select('id,name,active').order('id')),
  ]);
  const names = new Map(members.map(m=>[m.id,`${m.name}${admin && !m.active ? ' (acesso inativo)' : ''}`]));
  const assignmentsByTask = new Map(assignments.map(item=>[item.task_id,item]));
  const availabilityByTask = new Map(availability.map(item=>[item.task_id,item.taken]));
  const totalsByMaterial = new Map(materialTotals.map(item=>[item.material_id,item]));
  const offersByMaterial = new Map<string, typeof offers>();
  for (const offer of offers) {
    const group = offersByMaterial.get(offer.material_id) ?? [];
    group.push(offer); offersByMaterial.set(offer.material_id,group);
  }
  const participating = parts.some(p=>p.member_id === member.id); const cancelled = action.status === 'cancelled';
  const date = new Intl.DateTimeFormat('pt-BR',{ dateStyle:'full',timeStyle:'short',timeZone:'America/Sao_Paulo' }).format(new Date(action.starts_at));
  return <><Link href="/painel">← Voltar à agenda</Link><div className="page-heading"><div><p className="eyebrow">{cancelled?'AÇÃO CANCELADA':'VAMOS JUNTOS'}</p><h1>{action.title}</h1><p>{date}</p></div></div>
    {query.erro && <p role="alert" className="notice">Não foi possível concluir. Confira os campos: a tarefa pode já ter sido assumida, ou a quantidade recebida pode ultrapassar a oferta.</p>}{query.ok && <p role="status" className="notice">Pronto! Sua alteração foi salva.</p>}
    <section className="private-card"><h2>Sobre a ação</h2><p className="long-text">{action.objective}</p><p><strong>Local:</strong> {action.location}</p>{action.instructions && <><h3>Antes de participar</h3><p className="long-text">{action.instructions}</p></>}
    {cancelled && <p className="notice">Esta ação foi cancelada. Novas participações, tarefas e ofertas estão fechadas.</p>}
    {(!cancelled || participating) && <form action={mutate}><Fields op={participating?'cancel-participation':'participate'} actionId={id}/><PendingButton className="primary">{participating?'Cancelar minha participação':'Confirmar minha participação'}</PendingButton></form>}<p className="muted">A confirmação indica intenção de participar e não substitui a autorização dos responsáveis.</p>
    {admin && <details><summary>Participantes confirmados ({parts.length})</summary><ul>{parts.map(p=><li key={p.member_id}>{names.get(p.member_id) || 'Participante'}</li>)}</ul>{!parts.length && <p>Nenhuma confirmação ainda.</p>}</details>}</section>
    <div className="details-columns"><section className="private-card"><h2>Cada ajuda faz diferença</h2><p>Escolha uma tarefa para colaborar.</p>{!tasks.length && <p className="muted">As tarefas ainda serão organizadas.</p>}{tasks.map(task=>{
      const assignment = assignmentsByTask.get(task.id); const own = assignment?.member_id === member.id ? assignment : undefined;
      const taken = availabilityByTask.get(task.id);
      return <article className="list-row" key={task.id}><h3>{task.title}</h3>{own ? <><p>{own.completed?'✓ Você concluiu esta tarefa.':'Esta tarefa está com você.'}</p>{!own.completed && !cancelled && <form action={mutate}><Fields op="complete" actionId={id} extra={{task_id:task.id,expected_claim:own.claim_id}}/><PendingButton>Marcar como concluída</PendingButton></form>}</> : taken ? <p className="muted">{admin && assignment ? `${names.get(assignment.member_id)||'Participante'} · ${assignment.completed?'Concluída':'Em andamento'}` : 'Já tem alguém cuidando desta tarefa.'}</p> : !cancelled && <form action={mutate}><Fields op="claim" actionId={id} extra={{task_id:task.id}}/><PendingButton>Quero ajudar nesta tarefa</PendingButton></form>}{assignment && !assignment.completed && (own || admin) && <form action={mutate}><Fields op="release" actionId={id} extra={{task_id:task.id,expected_member:assignment.member_id,expected_claim:assignment.claim_id}}/><PendingButton>Liberar tarefa</PendingButton></form>}</article>;
    })}{admin && !cancelled && <details><summary>Adicionar tarefa</summary><form action={mutate}><Fields op="task" actionId={id}/><label>O que precisa ser feito?<input name="title" required minLength={3} maxLength={200}/></label><PendingButton>Adicionar tarefa</PendingButton></form></details>}</section>
    <section className="private-card"><h2>Materiais para esta ação</h2><p>Uma oferta só conta como recebida após a confirmação da coordenação.</p>{!materials.length && <p className="muted">Nenhum material solicitado.</p>}{materials.map(material=>{
      const totals = totalsByMaterial.get(material.id) || {offered:0,received:0}; const visibleOffers = offersByMaterial.get(material.id) ?? [];
      return <article key={material.id} className="list-row"><h3>{material.title} <small>({material.unit})</small></h3><div className="material-numbers"><span><strong>{material.needed}</strong>Necessários</span><span><strong>{totals.offered}</strong>Oferecidos</span><span><strong>{totals.received}</strong>Recebidos</span></div>{!cancelled && <form action={mutate} className="inline-form"><Fields op="offer" actionId={id} extra={{material_id:material.id,offer_id:randomUUID()}}/><label>Quanto você pode levar?<input name="quantity" type="number" min={1} max={100000} step={1} required/></label><PendingButton>Oferecer</PendingButton></form>}
      {visibleOffers.map(offer=><div key={offer.id}><p className="muted">{offer.member_id===member.id?'Sua oferta':names.get(offer.member_id)||'Participante'}: {offer.quantity} · Recebidos: {offer.received}</p>{admin && <form action={mutate} className="inline-form"><Fields op="receive" actionId={id} extra={{offer_id:offer.id,expected_received:String(offer.received)}}/><label>Total já recebido desta oferta<input name="received" type="number" min={0} max={offer.quantity} step={1} defaultValue={offer.received} required/></label><PendingButton>Confirmar recebimento</PendingButton></form>}{offer.quantity > offer.received && (admin || offer.member_id === member.id) && <form action={mutate}><Fields op="withdraw-offer" actionId={id} extra={{offer_id:offer.id,expected_quantity:String(offer.quantity),expected_received:String(offer.received)}}/><PendingButton>Retirar saldo não recebido ({offer.quantity-offer.received})</PendingButton></form>}</div>)}</article>;
    })}{admin && !cancelled && <details><summary>Solicitar material</summary><form action={mutate}><Fields op="material" actionId={id}/><label>Material<input name="title" required minLength={2} maxLength={100}/></label><label>Unidade (ex.: kit, pacote)<input name="unit" required maxLength={30}/></label><label>Quantidade necessária<input name="needed" type="number" min={1} max={100000} step={1} required/></label><PendingButton>Adicionar material</PendingButton></form></details>}</section></div>
    {admin && <section className="private-card"><details><summary>Editar dados da ação</summary><ActionForm action={action}/></details></section>}</>;
}
