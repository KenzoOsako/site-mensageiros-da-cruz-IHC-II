import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSource } from './load-source.mjs';

// Exercise production component callbacks with deterministic hook state and effect lifecycle.
const replacements = {
  react: `export function useState(v){return globalThis.__agendaHooks.state(v)}
    export function useRef(v){return globalThis.__agendaHooks.ref(v)}
    export function useEffect(fn){globalThis.__agendaHooks.effect(fn)}`,
  './agenda-filters': 'export const AgendaFilters = "agenda-filters";',
  'next/link': 'export default "a";',
};
const { default: Preview } = await loadSource('components/Preview.tsx', replacements);
const { AgendaList } = await loadSource('components/agenda-list.tsx', replacements);
function harness(component, props = {}) {
  const values = [], effects = [];
  let cursor = 0;
  const hooks = {
    state(initial) {
      const index = cursor++;
      if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial;
      return [values[index], next => { values[index] = typeof next === 'function' ? next(values[index]) : next; }];
    },
    ref(initial) { return hooks.state(() => ({ current: initial }))[0]; },
    effect(fn) { const index = cursor++; if (!(index in values)) { values[index] = true; effects.push(fn); } },
  };
  return {
    effects,
    render() { cursor = 0; globalThis.__agendaHooks = hooks; return component(props); },
  };
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join('');
  if (tree == null || typeof tree === 'boolean') return '';
  return typeof tree === 'object' ? text(tree.props?.children) : String(tree);
}
const button = (tree, label) => nodes(tree).find(node => node.type === 'button' && text(node) === label);
const detail = tree => nodes(tree).find(node => node.props?.['aria-label'] === 'Detalhes da ação selecionada');
const filters = tree => nodes(tree).find(node => node.type === 'agenda-filters');
const defaults = { search: '', mine: false, period: 'upcoming' };

test('prévia reconcilia seleção ao filtrar, sem restaurar seleção antiga na limpeza', () => {
  const app = harness(Preview);
  let tree = app.render();
  filters(tree).props.onChange({ ...defaults, search: 'quermesse' });
  tree = app.render();
  assert.equal(detail(tree).key, 'quermesse');
  filters(tree).props.onChange(defaults);
  assert.equal(detail(app.render()).key, 'quermesse');
});
test('cancelamento sob filtro próprio remove detalhes, foca título e exige seleção explícita', () => {
  const app = harness(Preview);
  let tree = app.render();
  button(tree, 'Confirmar participação').props.onClick();
  tree = app.render();
  nodes(tree).find(node => node.type === 'button' && text(node).includes('Mutirão da quermesse')).props.onClick();
  tree = app.render();
  button(tree, 'Confirmar participação').props.onClick();
  tree = app.render();
  filters(tree).props.onChange({ ...defaults, mine: true });
  tree = app.render();
  let focused = false;
  const heading = nodes(tree).find(node => node.type === 'h2' && text(node) === 'Agenda de exemplo');
  assert.equal(heading.props.tabIndex, -1);
  heading.props.ref.current = { focus() { focused = true; } };
  button(tree, 'Cancelar participação').props.onClick();
  tree = app.render();
  assert.equal(focused, true);
  assert.equal(detail(tree), undefined);
  assert.equal(button(tree, 'Cancelar participação'), undefined);
  assert.match(text(tree), /Escolha uma ação na agenda para continuar/);
  assert.match(text(tree), /1ação encontrada|1 ação encontrada/);
  nodes(tree).find(node => node.type === 'button' && text(node).includes('Encontro de solidariedade')).props.onClick();
  assert.equal(detail(app.render()).key, 'encontro');
});
test('prévia oferece histórico, bloqueia mutações canceladas e recupera todas após vazio', () => {
  const app = harness(Preview);
  let tree = app.render();
  filters(tree).props.onChange({ ...defaults, period: 'past' });
  tree = app.render();
  assert.equal(detail(tree).key, 'anterior');
  filters(tree).props.onChange({ ...defaults, period: 'cancelled' });
  tree = app.render();
  assert.equal(detail(tree).key, 'cancelada');
  const controls = nodes(detail(tree)).filter(node => ['button', 'input'].includes(node.type));
  assert.ok(controls.length > 0);
  assert.ok(controls.every(node => node.props.disabled));
  button(tree, 'Confirmar participação').props.onClick();
  button(tree, 'Assumir tarefa').props.onClick();
  nodes(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  tree = app.render();
  assert.ok(button(tree, 'Confirmar participação'));
  assert.ok(button(tree, 'Assumir tarefa'));
  assert.doesNotMatch(text(tree), /Oferta de 10|Você assumiu/);
  filters(tree).props.onChange({ ...defaults, mine: true, search: 'inexistente' });
  tree = app.render();
  assert.equal(detail(tree), undefined);
  button(tree, 'Ver todas as ações').props.onClick();
  tree = app.render();
  assert.deepEqual(filters(tree).props.value, { search: '', mine: false, period: 'all' });
  assert.match(text(tree), /4ações encontradas|4 ações encontradas/);
});
test('agenda mantém SSR, atualiza na montagem/virada/foco/visibilidade e limpa listeners/timer', () => {
  const actual = { window: globalThis.window, document: globalThis.document, setTimeout, clearTimeout, now: Date.now };
  const focus = new Map(), visibility = new Map(), timers = new Map();
  let instant = Date.parse('2026-09-16T02:59:59.000Z'), sequence = 0;
  globalThis.window = { addEventListener: (key, fn) => focus.set(key, fn), removeEventListener: key => focus.delete(key) };
  globalThis.document = { visibilityState: 'visible', addEventListener: (key, fn) => visibility.set(key, fn), removeEventListener: key => visibility.delete(key) };
  globalThis.setTimeout = (fn, delay) => { timers.set(++sequence, { fn, delay }); return sequence; };
  globalThis.clearTimeout = id => timers.delete(id);
  Date.now = () => instant;
  try {
    const action = { id: 'today', starts_at: '2026-09-15T12:00:00Z', title: 'Ação teste', location: 'Local', status: 'scheduled', confirmed: false };
    const app = harness(AgendaList, { actions: [action], now: '2026-09-16T12:00:00Z', coordinator: false });
    let tree = app.render();
    assert.match(text(tree), /Nenhuma ação encontrada/); // Initial render uses server value.
    const cleanup = app.effects[0]();
    tree = app.render();
    assert.match(text(tree), /Ação teste/);
    assert.match(text(tree), /Horários de Brasília/);
    assert.equal([...timers.values()][0].delay, 1000);
    instant += 1000;
    [...timers.values()][0].fn();
    tree = app.render();
    assert.match(text(tree), /Nenhuma ação encontrada/);
    button(tree, 'Ver todas as ações').props.onClick();
    tree = app.render();
    assert.deepEqual(filters(tree).props.value, { search: '', mine: false, period: 'all' });
    filters(tree).props.onChange(defaults);
    instant = Date.parse('2026-09-15T20:00:00Z');
    focus.get('focus')();
    assert.match(text(app.render()), /Ação teste/);
    instant = Date.parse('2026-09-17T20:00:00Z');
    visibility.get('visibilitychange')();
    assert.match(text(app.render()), /Nenhuma ação encontrada/);
    assert.equal(timers.size, 1);
    cleanup();
    assert.equal(timers.size + focus.size + visibility.size, 0);
  } finally {
    globalThis.window = actual.window; globalThis.document = actual.document;
    globalThis.setTimeout = actual.setTimeout; globalThis.clearTimeout = actual.clearTimeout; Date.now = actual.now;
    delete globalThis.__agendaHooks;
  }
});
