'use server';
import { redirect } from 'next/navigation';
import { configured, database } from '@/lib/supabase';
import { accessToken } from '@/lib/access-token';
export async function confirmAccess(form: FormData) {
  const parsed = accessToken.safeParse(Object.fromEntries(form));
  if (!configured() || !parsed.success) redirect('/entrar?erro=convite');
  const db = await database();
  const { error } = await db.auth.verifyOtp(parsed.data);
  if (error) redirect('/entrar?erro=convite');
  redirect('/ativar');
}
