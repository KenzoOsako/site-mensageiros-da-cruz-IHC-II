import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSource } from './load-source.mjs';

// Execute real components and handlers; provide a minimal state/effect host without a DOM.
const filtersModule = await loadSource('components/agenda-filters.tsx');
globalThis.__agendaControls = { filtersModule, states: [], cursor: 0, effects: [] };
const { AgendaList } = await loadSource('components/agenda-list.tsx', {
  './agenda-filters': 'export const AgendaFilters = globalThis.__agendaControls.filtersModule.AgendaFilters;',
  'next/link': 'export default function Link() {}',
  react: `export function useState(initial) {
    const host = globalThis.__agendaControls, index = host.cursor++;
    if (!(index in host.states)) host.states[index] = initial;
    return [host.states[index], value => { host.states[index] = typeof value === 'function' ? value(host.states[index]) : value; }];
  }
  export function useEffect(callback) { globalThis.__agendaControls.effects.push(callback); }`,
});
function nodes(element) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element, ...nodes(element.props?.children)];
}
const rows = [
  { id: 'own', title: 'Ação própria', location: 'São Pedro', starts_at: '2026-09-18T12:00:00Z', status: 'scheduled', confirmed: true },
  { id: 'other', title: 'Outra ação', location: 'São Pedro', starts_at: '2026-09-19T12:00:00Z', status: 'scheduled', confirmed: false },
  { id: 'past', title: 'Anterior', location: 'Praça', starts_at: '2026-09-17T12:00:00Z', status: 'scheduled', confirmed: true },
];
test('controles reais atualizam cartões, contagem, filtros combinados e recuperação do vazio', () => {
  const host = globalThis.__agendaControls;
  host.states = [];
  function render() {
    host.cursor = 0;
    const tree = AgendaList({ actions: rows, now: '2026-09-18T15:00:00Z', coordinator: false });
    const all = nodes(tree);
    const filter = all.find(node => node.type === filtersModule.AgendaFilters);
    return { all, controls: nodes(filtersModule.AgendaFilters(filter.props)) };
  }
  function check(expected) {
    const view = render();
    assert.deepEqual(view.all.filter(node => node.props?.href).map(node => node.props.href), expected.map(id => `/painel/acoes/${id}`));
    assert.equal(view.all.find(node => node.props?.role === 'status').props.children[0], expected.length);
    return view;
  }
  check(['own', 'other']).controls.find(node => node.props?.type === 'checkbox').props.onChange({ target: { checked: true } });
  check(['own']).controls.find(node => node.props?.type === 'search').props.onChange({ target: { value: '  SAO  PEDRO ' } });
  check(['own']).controls.find(node => node.type === 'select').props.onChange({ target: { value: 'past' } });
  const empty = check([]);
  empty.all.find(node => node.type === 'button' && node.props.children === 'Ver todas as ações').props.onClick();
  const all = check(['past', 'own', 'other']);
  assert.equal(all.controls.find(node => node.props?.type === 'checkbox').props.checked, false);
  assert.equal(all.controls.find(node => node.props?.type === 'search').props.value, '');
  all.controls.find(node => node.type === 'button').props.onClick();
  const reset = check(['own', 'other']);
  assert.equal(reset.controls.find(node => node.type === 'select').props.value, 'upcoming');
});

test('relógio atualiza no próximo dia de Brasília e limpa timer e listeners', () => {
  const host = globalThis.__agendaControls;
  host.states = []; host.cursor = 0; host.effects = [];
  const originals = { window: globalThis.window, document: globalThis.document, setTimeout, clearTimeout, now: Date.now };
  const listeners = new Map();
  let instant = Date.parse('2026-09-19T02:59:59Z'), pending, cleared = false;
  const events = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  try {
    globalThis.window = events;
    globalThis.document = { ...events, visibilityState: 'visible' };
    Date.now = () => instant;
    globalThis.setTimeout = (callback, delay) => { pending = { callback, delay }; return 1; };
    globalThis.clearTimeout = () => { cleared = true; };
    AgendaList({ actions: rows, now: '2026-09-18T00:00:00Z', coordinator: false });
    const cleanup = host.effects[0]();
    assert.equal(host.states[1], new Date(instant).toISOString());
    assert.equal(pending.delay, 1000);
    instant += 1000;
    pending.callback();
    assert.equal(host.states[1], '2026-09-19T03:00:00.000Z');
    host.cursor = 0;
    const tree = AgendaList({ actions: rows, now: '2026-09-18T00:00:00Z', coordinator: false });
    assert.deepEqual(nodes(tree).filter(node => node.props?.href).map(node => node.props.href), ['/painel/acoes/other']);
    instant += 86400000;
    listeners.get('focus')();
    assert.equal(host.states[1], new Date(instant).toISOString());
    assert.ok(listeners.has('visibilitychange'));
    cleanup();
    assert.equal(listeners.size, 0); assert.equal(cleared, true);
  } finally {
    globalThis.window = originals.window; globalThis.document = originals.document;
    globalThis.setTimeout = originals.setTimeout; globalThis.clearTimeout = originals.clearTimeout; Date.now = originals.now;
  }
});
