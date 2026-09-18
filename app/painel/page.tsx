import { requireMember } from '@/lib/auth';
import { ActionForm } from '@/components/action-form';
import { readAgenda } from '@/lib/agenda-data';
import { AgendaList } from '@/components/agenda-list';
export const dynamic = 'force-dynamic';
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string }> }) {
  const { db, member } = await requireMember(); const query = await searchParams;
  const actions = await readAgenda(db, member.id);
  return <><div className="page-heading"><div><p className="eyebrow">NOSSA AGENDA</p><h1>Olá, {member.name}.</h1><p>Encontre sua próxima oportunidade de fazer o bem.</p></div><span className="role-badge">{member.role === 'coordinator' ? 'Coordenação' : 'Participante'}</span></div>{query.erro && <p role="alert" className="notice">Não foi possível salvar. Confira os campos e tente novamente.</p>}{query.ok && <p role="status" className="notice">Alterações salvas.</p>}
    <AgendaList actions={actions} now={new Date().toISOString()} coordinator={member.role === 'coordinator'} />
    {member.role === 'coordinator' && <section className="private-card"><h2>Organizar uma nova ação</h2><ActionForm /></section>}</>;
}
