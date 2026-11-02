import Link from 'next/link';
import { login } from '../auth/actions';
import { configured } from '@/lib/supabase';
import { contact } from '@/lib/contact';
import { LoginFields } from '@/components/login-fields';
import '../private.css';
export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return <div className="private-wrap auth-wrap"><Link href="/">← Voltar ao site</Link><section className="private-card"><p className="eyebrow">MENSAGEIROS DA CRUZ TUPÃ</p><h1>Bom ter você aqui.</h1><p>Entre para organizar suas próximas ações com o grupo.</p>
    {!configured() ? <div className="notice"><strong>A área dos participantes ainda não está conectada.</strong><p>Enquanto isso, você pode conhecer a prévia com exemplos fictícios.</p><Link href="/previa">Conhecer a prévia →</Link></div> : <form action={login}>
      {erro && <p role="alert" className="notice">{erro === 'convite' ? 'O convite é inválido ou expirou. Peça um novo link à coordenação.' : 'E-mail ou senha não conferem, ou o acesso não está ativo. Confira os dois campos e tente de novo. Se esqueceu a senha, peça ajuda à coordenação pelo link abaixo.'}</p>}
      <LoginFields /><button type="submit" className="primary">Entrar</button>
    </form>}
    <div className="recovery"><strong>Esqueceu a senha ou perdeu o acesso?</strong><p className="muted">O acesso é por convite da coordenação. Ela também recupera o acesso de quem já participa.</p><a className="text-link" href={contact.messageUrl} target="_blank" rel="noopener noreferrer">Pedir ajuda à coordenação no Instagram ↗<span className="sr-only"> (abre em nova aba)</span></a></div></section></div>;
}

