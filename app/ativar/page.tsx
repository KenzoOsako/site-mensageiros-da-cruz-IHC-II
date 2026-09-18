export const dynamic = 'force-dynamic';
import { requireMember } from '@/lib/auth';
import { setPassword } from '../auth/actions';
import '../private.css';
export default async function Activate({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  await requireMember(); const { erro } = await searchParams;
  return <div className="private-wrap auth-wrap"><section className="private-card"><h1>Defina sua senha</h1><p>Use pelo menos 12 caracteres. Você usará esta senha para entrar no grupo.</p><form action={setPassword}>{erro && <p role="alert">As senhas precisam ser iguais e ter entre 12 e 128 caracteres.</p>}<label>Nova senha<input type="password" name="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label><label>Repita a senha<input type="password" name="confirm" minLength={12} maxLength={128} autoComplete="new-password" required /></label><button className="primary">Salvar senha e entrar</button></form></section></div>;
}

