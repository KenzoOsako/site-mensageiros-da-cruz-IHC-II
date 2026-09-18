'use server';
import { createClient } from '@supabase/supabase-js';
import { requireMember } from '@/lib/auth';
import { z } from 'zod';
export type InvitationState = { error?: string; link?: string };
export async function invite(_state: InvitationState, form: FormData): Promise<InvitationState> {
  const { member } = await requireMember();
  if (member.role !== 'coordinator') return { error: 'Somente a coordenação pode convidar participantes.' };
  const parsed = z.object({ name: z.string().trim().min(1).max(100), email: z.string().email().max(254) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'Confira o nome e o e-mail.' };
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!key || !site) return { error: 'A criação de convites ainda não foi configurada.' };
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{ auth:{ persistSession:false,autoRefreshToken:false } });
  const { data, error } = await admin.auth.admin.generateLink({ type:'invite',email:parsed.data.email });
  if (error || !data.user || !data.properties?.hashed_token) return { error:'Não foi possível gerar o convite. O e-mail pode já ter uma conta. Procure o administrador para recuperar o acesso.' };
  // Never overwrite a role or re-enable an existing account through an invitation.
  const { error: memberError } = await admin.from('members').insert({ id:data.user.id,name:parsed.data.name,role:'participant' });
  if (memberError) return { error:'Não foi possível registrar o participante. O administrador precisa conferir o cadastro antes de gerar outro convite.' };
  const url = new URL('/auth/confirm', site); url.searchParams.set('token_hash',data.properties.hashed_token); url.searchParams.set('type','invite');
  return { link:url.toString() };
}
