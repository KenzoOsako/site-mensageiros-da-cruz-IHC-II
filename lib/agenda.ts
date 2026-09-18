export type AgendaAction = { id: string; title: string; location: string; starts_at: string; status: 'scheduled' | 'cancelled'; confirmed: boolean };
export type AgendaPeriod = 'upcoming' | 'past' | 'cancelled' | 'all';
export type AgendaFilters = { search: string; period: AgendaPeriod; mine: boolean };
export const initialAgendaFilters: AgendaFilters = { search: '', period: 'upcoming', mine: false };
const civilFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });

export function civilDate(instant: string | number | Date): string {
  const parts = civilFormatter.formatToParts(new Date(instant));
  const value = (type: string) => parts.find(part => part.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g, ' ');
}
export function filterAgenda<T extends AgendaAction>(actions: readonly T[], filters: AgendaFilters, now: string | number | Date): T[] {
  const today = civilDate(now);
  const search = normalizeSearch(filters.search);
  return actions.filter(action => {
    if (filters.mine && !action.confirmed) return false;
    if (search && !normalizeSearch(action.title).includes(search) && !normalizeSearch(action.location).includes(search)) return false;
    if (filters.period === 'all') return true;
    if (filters.period === 'cancelled') return action.status === 'cancelled';
    if (action.status !== 'scheduled') return false;
    const day = civilDate(action.starts_at);
    return filters.period === 'past' ? day < today : day >= today;
  }).sort((a, b) => {
    const difference = Date.parse(a.starts_at) - Date.parse(b.starts_at);
    return (filters.period === 'past' ? -difference : difference) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
}
