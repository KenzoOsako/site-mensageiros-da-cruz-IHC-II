import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { loadSource } from './load-source.mjs';

// Execute the reader's actual projection, predicates and pagination under RLS.
function agendaDatabase(db) {
  const columns = {
    actions: new Set(['id', 'title', 'location', 'starts_at', 'status', 'objective', 'instructions']),
    participations: new Set(['action_id', 'member_id']),
  };
  return { from(table) {
    assert.ok(Object.hasOwn(columns, table));
    let fields = '*';
    const predicates = [], order = [], values = [];
    const column = name => {
      assert.ok(columns[table].has(name), `Unexpected ${table} column: ${name}`);
      return `"${name}"`;
    };
    const query = {
      select(selection) { fields = selection === '*' ? '*' : selection.split(',').map(column).join(','); return query; },
      eq(name, value) { values.push(value); predicates.push(`${column(name)} = $${values.length}`); return query; },
      order(name) { order.push(column(name)); return query; },
      async range(from, to) {
        const parameters = [...values, to - from + 1, from];
        const sql = `select ${fields} from "${table}"${predicates.length ? ` where ${predicates.join(' and ')}` : ''}${order.length ? ` order by ${order.join(',')}` : ''} limit $${values.length + 1} offset $${values.length + 2}`;
        // PostgREST sends timestamps as JSON strings, unlike PGlite's Date values.
        return { data: JSON.parse(JSON.stringify((await db.query(sql, parameters)).rows)), error: null };
      },
    };
    return query;
  } };
}

function findAgenda(element) {
  if (!element || typeof element !== 'object') return undefined;
  if (element.type?.name === 'AgendaListBoundary') return element.props;
  const children = element.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const result = findAgenda(child);
    if (result) return result;
  }
}

test('dashboard envia apenas confirmações do membro autenticado, inclusive para coordenação', async () => {
  const db = new PGlite();
  const coordinator = { id: '10000000-0000-4000-8000-000000000001', name: 'Coordenação privada', role: 'coordinator' };
  const participant = { id: '10000000-0000-4000-8000-000000000002', name: 'Participante privado', role: 'participant' };
  const other = { id: '10000000-0000-4000-8000-000000000003', name: 'Outra pessoa privada', role: 'participant' };
  const members = [coordinator, participant, other];
  const actionIds = members.map((_, index) => `20000000-0000-4000-8000-00000000000${index + 1}`);
  try {
    await db.exec(`create role authenticated; create role anon; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated,anon,service_role;
      grant execute on function auth.uid() to authenticated,anon,service_role;`);
    await db.exec(await readFile(new URL('../supabase/migrations/202609140001_initial.sql', import.meta.url), 'utf8'));
    for (const [index, member] of members.entries()) {
      await db.query('insert into auth.users values ($1)', [member.id]);
      await db.query('insert into members(id,name,role) values ($1,$2,$3)', [member.id, member.name, member.role]);
      await db.query("insert into actions(id,title,objective,starts_at,location,instructions) values ($1,$2,'Objetivo não enviado','2027-01-01T12:00:00Z','Local de teste','Instruções não enviadas')", [actionIds[index], `Ação ${index + 1}`]);
      await db.query('insert into participations(action_id,member_id) values ($1,$2)', [actionIds[index], member.id]);
    }
    const { default: Dashboard } = await loadSource('app/painel/page.tsx', {
      'server-only': '',
      '@/lib/auth': 'export async function requireMember() { return globalThis.__agendaDashboardTest; }',
      '@/components/action-form': 'export function ActionForm() { return null; }',
      '@/components/agenda-list': 'export function AgendaListBoundary() { return null; } export { AgendaListBoundary as AgendaList };',
    });
    for (const member of [coordinator, participant]) {
      await db.exec('reset role; set role authenticated');
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [member.id]);
      // The coordinator can see all rows; its own-only result must come from the reader.
      assert.equal((await db.query('select * from participations')).rows.length, member === coordinator ? 3 : 1);
      globalThis.__agendaDashboardTest = { db: agendaDatabase(db), member };
      const props = findAgenda(await Dashboard({ searchParams: Promise.resolve({}) }));
      assert.ok(props, 'Dashboard must render AgendaList');
      assert.equal(props.coordinator, member.role === 'coordinator');
      assert.deepEqual(props.actions, actionIds.map((id, index) => ({
        id, title: `Ação ${index + 1}`, location: 'Local de teste', starts_at: '2027-01-01T12:00:00.000Z',
        status: 'scheduled', confirmed: members[index].id === member.id,
      })));
      const serialized = JSON.stringify(props.actions);
      for (const privateMember of members) {
        assert.ok(!serialized.includes(privateMember.id), 'Agenda must not contain member identifiers');
        assert.ok(!serialized.includes(privateMember.name), 'Agenda must not contain member names');
      }
    }
  } finally {
    delete globalThis.__agendaDashboardTest;
    await db.close();
  }
});
