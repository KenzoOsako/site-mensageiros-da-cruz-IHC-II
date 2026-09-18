import 'server-only';
import { redirect } from 'next/navigation';
import { database, configured } from './supabase';

export async function currentMember() {
  if (!configured()) return null;
  const db = await database();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return null;
  const { data: member, error: profileError } = await db.from('members').select('id,name,role,active').eq('id', user.id).single();
  if (profileError || !member?.active) return null;
  return { db, member: member as { id: string; name: string; role: 'participant' | 'coordinator'; active: boolean } };
}
export async function requireMember() {
  const context = await currentMember();
  if (!context) redirect('/entrar');
  return context;
}
