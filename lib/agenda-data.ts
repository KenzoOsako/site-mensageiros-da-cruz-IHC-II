import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { allRows } from './pagination';
import type { AgendaAction } from './agenda';

export async function readAgenda(db: SupabaseClient, memberId: string): Promise<AgendaAction[]> {
  const [actions, participations] = await Promise.all([
    allRows<Omit<AgendaAction, 'confirmed'>>(() => db.from('actions').select('id,title,location,starts_at,status').order('starts_at').order('id')),
    allRows<{ action_id: string }>(() => db.from('participations').select('action_id').eq('member_id', memberId).order('action_id')),
  ]);
  const confirmed = new Set(participations.map(row => row.action_id));
  return actions.map(action => ({ id: action.id, title: action.title, location: action.location, starts_at: action.starts_at, status: action.status, confirmed: confirmed.has(action.id) }));
}
