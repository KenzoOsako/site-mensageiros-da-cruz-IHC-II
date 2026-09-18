import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSource } from './load-source.mjs';

const { civilDate, normalizeSearch, filterAgenda, initialAgendaFilters } = await loadSource('lib/agenda.ts');
const { readAgenda } = await loadSource('lib/agenda-data.ts', { 'server-only': '' });
const now = '2026-09-16T01:00:00Z'; // Ainda dia 15 em Brasília.
const action = (id, starts_at, extra = {}) => ({ id, starts_at, title: 'Ação solidária', location: 'São Pedro', status: 'scheduled', confirmed: false, ...extra });
const rows = [
  action('tomorrow', '2026-09-16T12:00:00Z', { confirmed: true }),
  action('yesterday', '2026-09-14T16:00:00Z'),
  action('today-b', '2026-09-15T09:00:00Z'),
  action('cancelled', '2026-09-16T15:00:00Z', { status: 'cancelled', confirmed: true }),
  action('today-a', '2026-09-15T09:00:00Z', { confirmed: true }),
  action('older', '2026-09-13T12:00:00Z'),
];
const ids = (filters = {}) => filterAgenda(rows, { ...initialAgendaFilters, ...filters }, now).map(row => row.id);

test('data civil usa Brasília e próximas inclui hoje após início, com desempate estável', () => {
  assert.equal(civilDate(now), '2026-09-15');
  assert.equal(civilDate('2026-09-16T03:00:00Z'), '2026-09-16');
  assert.deepEqual(ids(), ['today-a', 'today-b', 'tomorrow']);
});
test('histórico decrescente, cancelamento separado, todas completas e entrada imutável', () => {
  const before = structuredClone(rows);
  assert.deepEqual(ids({ period: 'past' }), ['yesterday', 'older']);
  assert.deepEqual(ids({ period: 'cancelled' }), ['cancelled']);
  assert.deepEqual(ids({ period: 'all' }), ['older', 'yesterday', 'today-a', 'today-b', 'tomorrow', 'cancelled']);
  assert.deepEqual(rows, before);
  const ties = [action('b', '2026-09-14T12:00:00Z'), action('a', '2026-09-14T12:00:00Z')];
  assert.deepEqual(filterAgenda(ties, { ...initialAgendaFilters, period: 'past' }, now).map(row => row.id), ['a', 'b']);
});
test('busca normalizada encontra título ou local e combina todos os filtros por AND', () => {
  assert.equal(normalizeSearch('  SAO   PEDRO '), normalizeSearch('São Pedro'));
  assert.deepEqual(ids({ search: '  SAO   PEDRO ', mine: true }), ['today-a', 'tomorrow']);
  assert.deepEqual(ids({ search: 'acao SOLIDARIA', mine: true, period: 'cancelled' }), ['cancelled']);
  assert.deepEqual(ids({ search: 'inexistente', mine: true, period: 'all' }), []);
  assert.deepEqual(ids({ search: 'solidaria sao' }), []); // Sem casar entre campos.
  assert.deepEqual(filterAgenda([], initialAgendaFilters, now), []);
});

function databaseMock({ failTable, rejectTable } = {}) {
  const calls = [];
  const actions = Array.from({ length: 501 }, (_, index) => action(String(index), '2026-09-15T09:00:00Z'));
  const confirmations = Array.from({ length: 500 }, (_, index) => ({ action_id: String(index) }));
  const db = { from(table) {
    const call = { table, order: [], filters: [] }; calls.push(call);
    const query = {
      select(fields) { call.select = fields; return query; },
      eq(field, value) { call.filters.push([field, value]); return query; },
      order(field) { call.order.push(field); return query; },
      async range(from, to) {
        call.range = [from, to];
        if (rejectTable === table) throw new Error('offline');
        if (failTable === table) return { data: null, error: { message: 'unavailable' } };
        return { data: (table === 'actions' ? actions : confirmations).slice(from, to + 1), error: null };
      },
    }; return query;
  } };
  return { db, calls };
}
test('leitor pagina ambas consultas e sempre restringe confirmações ao próprio membro no servidor', async () => {
  const { db, calls } = databaseMock();
  const result = await readAgenda(db, 'coordinator-own-id');
  assert.equal(result.length, 501);
  assert.equal(result[0].confirmed, true);
  assert.equal(result[500].confirmed, false);
  assert.deepEqual(Object.keys(result[0]).sort(), ['confirmed', 'id', 'location', 'starts_at', 'status', 'title']);
  for (const call of calls) {
    if (call.table === 'actions') {
      assert.equal(call.select, 'id,title,location,starts_at,status');
      assert.deepEqual(call.order, ['starts_at', 'id']);
    } else {
      assert.equal(call.select, 'action_id');
      assert.deepEqual(call.filters, [['member_id', 'coordinator-own-id']]);
      assert.deepEqual(call.order, ['action_id']);
    }
  }
  for (const table of ['actions', 'participations']) assert.deepEqual(calls.filter(call => call.table === table).map(call => call.range), [[0, 499], [500, 999]]);
});
test('erros retornados ou rejeições de ambas leituras propagam sem falsa lista vazia', async () => {
  for (const table of ['actions', 'participations']) {
    await assert.rejects(readAgenda(databaseMock({ failTable: table }).db, 'me'), /carregar/);
    await assert.rejects(readAgenda(databaseMock({ rejectTable: table }).db, 'me'), /offline/);
  }
});
