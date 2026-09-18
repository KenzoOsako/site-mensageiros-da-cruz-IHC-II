'use server';
import { redirect } from 'next/navigation';
import { database, configured } from '@/lib/supabase';
import { currentMember } from '@/lib/auth';
import { z } from 'zod';

export async function login(form: FormData) {
  if (!configured()) redirect('/entrar?erro=configuracao');
  const parsed = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect('/entrar?erro=credenciais');
  const db = await database();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error || !(await currentMember())) {
    await db.auth.signOut();
    redirect('/entrar?erro=credenciais');
  }
  redirect('/painel');
}
export async function logout() {
  if (configured()) { const db = await database(); await db.auth.signOut(); }
  redirect('/entrar');
}
export async function setPassword(form: FormData) {
  const context = await currentMember();
  if (!context) redirect('/entrar?erro=convite');
  const result = z.object({ password: z.string().min(12).max(128), confirm: z.string() }).refine(v => v.password === v.confirm).safeParse(Object.fromEntries(form));
  if (!result.success) redirect('/ativar?erro=senha');
  const { error } = await context.db.auth.updateUser({ password: result.data.password });
  if (error) redirect('/ativar?erro=senha');
  redirect('/painel');
}
