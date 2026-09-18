'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { civilDate, filterAgenda, initialAgendaFilters, type AgendaAction } from '@/lib/agenda';
import { AgendaFilters } from './agenda-filters';

export function AgendaList({ actions, now, coordinator }: { actions: AgendaAction[]; now: string; coordinator: boolean }) {
  const [filters, setFilters] = useState(initialAgendaFilters);
  const [clock, setClock] = useState(now);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function refresh() {
      clearTimeout(timer);
      const instant = Date.now();
      setClock(new Date(instant).toISOString());
      // Find the next civil-day boundary in the named zone, without assuming an offset.
      const today = civilDate(instant);
      let start = instant, end = instant + 36 * 60 * 60 * 1000;
      while (end - start > 1) {
        const middle = Math.floor((start + end) / 2);
        if (civilDate(middle) === today) start = middle;
        else end = middle;
      }
      timer = setTimeout(refresh, end - instant);
    }
    function onVisible() { if (document.visibilityState === 'visible') refresh(); }
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  const visible = filterAgenda(actions, filters, clock);
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });
  return <section aria-label="Ações do grupo">
    <p className="muted">Horários de Brasília</p>
    <AgendaFilters value={filters} onChange={setFilters} />
    <p role="status">{visible.length} {visible.length === 1 ? 'ação encontrada' : 'ações encontradas'}</p>
    <div className="action-grid">{visible.map(action => <Link className="action-tile" href={`/painel/acoes/${action.id}`} key={action.id}><span className="role-badge">{action.status === 'cancelled' ? 'Cancelada' : 'Programada'}</span>{action.confirmed && <span className="agenda-confirmed">✓ Sua participação confirmada</span>}<h2>{action.title}</h2><p>{date.format(new Date(action.starts_at))}</p><p>{action.location}</p><span className="tile-link">Ver ação →</span></Link>)}</div>
    {!actions.length ? <div className="private-card"><h2>A agenda começa aqui</h2><p>{coordinator ? 'Cadastre a primeira ação para reunir o grupo.' : 'A coordenação ainda não publicou ações. Volte em breve.'}</p></div> : !visible.length && <div className="private-card"><h2>Nenhuma ação encontrada</h2><p>Altere a busca ou os filtros para encontrar outras ações.</p><button type="button" onClick={() => setFilters({ search: '', mine: false, period: 'all' })}>Ver todas as ações</button></div>}
  </section>;
}
