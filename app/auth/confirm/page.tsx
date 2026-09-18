import { confirmAccess } from '../confirm-action';
import { configured } from '@/lib/supabase';
import { accessToken } from '@/lib/access-token';
import Link from 'next/link';
import '../../private.css';
export const dynamic = 'force-dynamic';
export default async function Confirm({ searchParams }: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
  const parsed = accessToken.safeParse(await searchParams);
  return <div className="private-wrap auth-wrap"><section className="private-card"><h1>Acesse seu convite</h1>{configured() && parsed.success ? <><p>Continue para definir sua senha e acessar a área dos Mensageiros da Cruz Tupã. Este link é pessoal e de uso único.</p><form action={confirmAccess}><input type="hidden" name="token_hash" value={parsed.data.token_hash}/><input type="hidden" name="type" value={parsed.data.type}/><button className="primary">Continuar e definir senha</button></form></> : <><p>O link está incompleto ou o acesso ainda não foi configurado. Peça orientação à coordenação.</p><Link href="/entrar">Voltar à entrada</Link></>}</section></div>;
}
