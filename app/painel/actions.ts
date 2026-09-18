'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireMember } from '@/lib/auth';
import { actionFields, id, quantity, received } from '@/lib/validation';
import { z } from 'zod';
import { encodeBrasilia } from '@/lib/time';

export type ActionState = { error?: string; values?: Record<string, string> };
export async function saveAction(_previous: ActionState, form: FormData): Promise<ActionState> {
  const { db, member } = await requireMember();
  const values = Object.fromEntries(['title','objective','location','starts_at','instructions','status'].map(key => [key, String(form.get(key) ?? '')]));
  let destination = '/painel';
  try {
    if (member.role !== 'coordinator') throw new Error('forbidden');
    const actionId = form.get('action_id') ? id.parse(form.get('action_id')) : null;
    const data = actionFields.parse({ ...values, starts_at: encodeBrasilia(values.starts_at) });
    const result = actionId ? await db.from('actions').update(data).eq('id',actionId).select('id').single() : await db.from('actions').insert(data).select('id').single();
    if (result.error || !result.data) throw new Error('save');
    destination = `/painel/acoes/${result.data.id}`;
  } catch { return { error: 'Não foi possível salvar. Confira os campos e tente novamente; suas informações foram mantidas.', values }; }
  revalidatePath('/painel', 'layout');
  redirect(`${destination}?ok=1`);
}

export async function mutate(form: FormData) {
  const { db, member } = await requireMember();
  let destination = '/painel';
  let failed = false;
  try {
    const op = z.enum(['participate','cancel-participation','task','claim','complete','release','material','offer','receive','withdraw-offer']).parse(form.get('op'));
    const actionId = form.get('action_id') ? id.parse(form.get('action_id')) : null;
    if (actionId) destination = `/painel/acoes/${actionId}`;
    if (['task','material','receive'].includes(op) && member.role !== 'coordinator') throw new Error('forbidden');
    let result;
    switch (op) {
      case 'participate': result = await db.from('participations').upsert({ action_id: id.parse(actionId), member_id: member.id }, { onConflict: 'action_id,member_id', ignoreDuplicates: true }); break;
      case 'cancel-participation': result = await db.from('participations').delete().eq('action_id', id.parse(actionId)).eq('member_id', member.id); break;
      case 'task': result = await db.from('tasks').insert({ action_id: id.parse(actionId), title: z.string().trim().min(3).max(200).parse(form.get('title')) }); break;
      case 'claim': result = await db.from('assignments').insert({ task_id: id.parse(form.get('task_id')), member_id: member.id }); break;
      case 'complete': result = await db.from('assignments').update({ completed: true }).eq('task_id', id.parse(form.get('task_id'))).eq('member_id', member.id).eq('claim_id', id.parse(form.get('expected_claim'))).select('task_id').single(); break;
      case 'release': result = await db.rpc('release_task', { target_task: id.parse(form.get('task_id')), expected_member: id.parse(form.get('expected_member')), expected_claim: id.parse(form.get('expected_claim')) }); break;
      case 'material': result = await db.from('materials').insert({ action_id: id.parse(actionId), title: z.string().trim().min(2).max(100).parse(form.get('title')), unit: z.string().trim().min(1).max(30).parse(form.get('unit')), needed: quantity.parse(form.get('needed')) }); break;
      case 'offer': result = await db.from('offers').upsert({ id: id.parse(form.get('offer_id')), material_id: id.parse(form.get('material_id')), member_id: member.id, quantity: quantity.parse(form.get('quantity')) }, { onConflict: 'id', ignoreDuplicates: true }); break;
      case 'receive': result = await db.from('offers').update({ received: received.parse(form.get('received')) }).eq('id', id.parse(form.get('offer_id'))).eq('received', received.parse(form.get('expected_received'))).select('id').single(); break;
      case 'withdraw-offer': result = await db.rpc('withdraw_offer', { target_offer: id.parse(form.get('offer_id')), expected_quantity: received.parse(form.get('expected_quantity')), expected_received: received.parse(form.get('expected_received')) }); break;
    }
    if (result?.error) throw result.error;
  } catch { failed = true; }
  revalidatePath('/painel', 'layout');
  redirect(`${destination}?${failed ? 'erro=operacao' : 'ok=1'}`);
}
