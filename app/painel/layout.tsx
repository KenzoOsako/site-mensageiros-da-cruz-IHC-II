export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { requireMember } from '@/lib/auth';
import { logout } from '../auth/actions';
import '../private.css';
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { member } = await requireMember();
  return <div className="private-app"><header className="private-header"><Link className="private-brand" href="/painel">Mensageiros da Cruz <small>JUVENTUDE EM AÇÃO</small></Link><nav aria-label="Área dos participantes"><Link href="/painel">Agenda</Link>{member.role === 'coordinator' && <Link href="/painel/convites">Convites</Link>}<Link href="/">Site do grupo</Link><form action={logout}><button>Sair</button></form></nav></header><div className="private-wrap">{children}</div></div>;
}

