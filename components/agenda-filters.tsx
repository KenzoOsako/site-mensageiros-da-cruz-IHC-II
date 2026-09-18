'use client';
import { initialAgendaFilters, type AgendaFilters as Filters, type AgendaPeriod } from '@/lib/agenda';

export function AgendaFilters({ value, onChange }: { value: Filters; onChange: (value: Filters) => void }) {
  return <div className="agenda-filters" role="group" aria-label="Filtros da agenda">
    <label>Buscar por título ou local<input type="search" value={value.search} onChange={event => onChange({ ...value, search: event.target.value })} /></label>
    <label>Período e situação<select value={value.period} onChange={event => onChange({ ...value, period: event.target.value as AgendaPeriod })}><option value="upcoming">Hoje e próximas</option><option value="past">Anteriores</option><option value="cancelled">Canceladas</option><option value="all">Todas</option></select></label>
    <label className="agenda-own"><input type="checkbox" checked={value.mine} onChange={event => onChange({ ...value, mine: event.target.checked })} />Minhas confirmações</label>
    <button type="button" className="button button-outline" onClick={() => onChange({ ...initialAgendaFilters })}>Limpar filtros</button>
  </div>;
}
