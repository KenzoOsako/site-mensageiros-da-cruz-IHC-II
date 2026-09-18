import Link from 'next/link';
import { login } from '../auth/actions';
import { configured } from '@/lib/supabase';
import '../private.css';
export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return <div className="private-wrap auth-wrap"><Link href="/">← Voltar ao site</Link><section className="private-card"><p className="eyebrow">MENSAGEIROS DA CRUZ TUPÃ</p><h1>Bom ter você aqui.</h1><p>Entre para organizar suas próximas ações com o grupo.</p>
    {!configured() ? <div className="notice"><strong>A área dos participantes ainda não está conectada.</strong><p>Enquanto isso, você pode conhecer a prévia com exemplos fictícios.</p><Link href="/previa">Conhecer a prévia →</Link></div> : <form action={login}>
      {erro && <p role="alert" className="notice">{erro === 'convite' ? 'O convite é inválido ou expirou. Peça um novo link à coordenação.' : 'Não foi possível entrar. Confira seus dados e se seu acesso está ativo.'}</p>}
      <label>E-mail<input name="email" type="email" required autoComplete="email" maxLength={254} /></label><label>Senha<input name="password" type="password" required autoComplete="current-password" maxLength={128} /></label><button className="primary">Entrar</button>
    </form>}
    <p className="muted">O acesso é por convite da coordenação. Para participar ou recuperar seu acesso, procure os responsáveis pelo grupo na Paróquia São Pedro Apóstolo.</p></section></div>;
}

