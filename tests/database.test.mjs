import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { loadSource, RedirectSignal, redirectMock } from './load-source.mjs';

const db = new PGlite();
const coordinator = '10000000-0000-4000-8000-000000000001';
const first = '10000000-0000-4000-8000-000000000002';
const second = '10000000-0000-4000-8000-000000000003';
const inactive = '10000000-0000-4000-8000-000000000004';
let action, task, material, offer;
async function asMember(id) {
  await db.exec('reset role; set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
}
before(async () => {
  await db.exec(`create role authenticated; create role anon; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated,anon,service_role;
    grant execute on function auth.uid() to authenticated,anon,service_role;
    alter default privileges in schema public grant all on tables to authenticated,anon;`);
  await db.exec(await readFile(new URL('../supabase/migrations/202609140001_initial.sql', import.meta.url), 'utf8'));
  for (const [id, name, role, active] of [[coordinator,'Coordenação','coordinator',true],[first,'Pessoa A','participant',true],[second,'Pessoa B','participant',true],[inactive,'Inativo','participant',false]]) {
    await db.query('insert into auth.users values ($1)',[id]);
    await db.query('insert into members values ($1,$2,$3,$4)',[id,name,role,active]);
  }
  await asMember(coordinator);
  action = (await db.query("insert into actions(title,objective,starts_at,location) values ('Ação teste','Objetivo teste','2027-01-01T10:00:00-03:00','Local teste') returning id")).rows[0].id;
  task = (await db.query("insert into tasks(action_id,title) values ($1,'Separar materiais') returning id",[action])).rows[0].id;
  material = (await db.query("insert into materials(action_id,title,unit,needed) values ($1,'Arroz','pacotes',10) returning id",[action])).rows[0].id;
});
after(async () => { await db.close(); });
test('visitante não lê dados nem funções privadas', async () => {
  await db.exec('reset role; set role anon');
  await assert.rejects(db.query('select * from actions'), /permission denied/);
  await assert.rejects(db.query('select * from material_totals($1)',[action]), /permission denied/);
});
test('membro consulta agenda mas não cria ação ou promove seu papel', async () => {
  await asMember(first);
  assert.equal((await db.query('select * from actions')).rows.length,1);
  assert.equal((await db.query('select * from members')).rows.length,1);
  await assert.rejects(db.query("insert into actions(title,objective,starts_at,location) values ('Teste','Teste',now(),'Teste')"), /row-level security/);
  await assert.rejects(db.query("update members set role='coordinator' where id=$1",[first]), /permission denied/);
});
test('confirmação repetida é idempotente e dados alheios permanecem privados', async () => {
  await asMember(first);
  for (let i=0;i<2;i++) await db.query('insert into participations(action_id,member_id) values($1,$2) on conflict do nothing',[action,first]);
  assert.equal((await db.query('select * from participations')).rows.length,1);
  await assert.rejects(db.query('insert into participations values($1,$2)',[action,second]), /row-level security/);
  await asMember(second);
  assert.equal((await db.query('select * from participations')).rows.length,0);
  await db.query('delete from participations where member_id=$1',[first]);
  await asMember(first);
  assert.equal((await db.query('select * from participations')).rows.length,1);
  await db.query('delete from participations where action_id=$1',[action]);
  assert.equal((await db.query('select * from participations')).rows.length,0);
});
test('tarefa tem um responsável e somente ele pode concluir', async () => {
  await asMember(first);
  await db.query('insert into assignments(task_id) values($1)',[task]);
  await asMember(second);
  await assert.rejects(db.query('insert into assignments(task_id) values($1)',[task]), /duplicate key/);
  assert.equal((await db.query('select * from assignments')).rows.length,0);
  assert.equal((await db.query('select * from task_availability($1)',[action])).rows[0].taken,true);
  assert.equal((await db.query('update assignments set completed=true where task_id=$1 returning *',[task])).rows.length,0);
  await asMember(first);
  await assert.rejects(db.query('update assignments set member_id=$1 where task_id=$2',[second,task]), /permission denied/);
  assert.equal((await db.query('update assignments set completed=true where task_id=$1 returning completed',[task])).rows[0].completed,true);
});
test('ofertas e recebimentos são distintos, privados e limitados', async () => {
  await asMember(first);
  for (const n of [0,-1,100001]) await assert.rejects(db.query('insert into offers(material_id,quantity) values($1,$2)',[material,n]),/check constraint|row-level security/);
  offer = (await db.query('insert into offers(material_id,quantity) values($1,5) returning id',[material])).rows[0].id;
  assert.equal((await db.query('update offers set received=3 where id=$1 returning id',[offer])).rows.length,0);
  await asMember(second);
  assert.equal((await db.query('select * from offers')).rows.length,0);
  const totals = (await db.query('select * from material_totals($1)',[action])).rows[0];
  assert.equal(Number(totals.offered),5); assert.equal(Number(totals.received),0);
  await asMember(coordinator);
  await assert.rejects(db.query('update offers set received=6 where id=$1',[offer]),/check constraint/);
  await db.query('update offers set received=3 where id=$1',[offer]);
  await assert.rejects(db.query('update offers set quantity=7 where id=$1',[offer]),/permission denied/);
  assert.equal(Number((await db.query('select * from material_totals($1)',[action])).rows[0].received),3);
});
test('ação cancelada recusa novas confirmações, tarefas e ofertas', async () => {
  await asMember(coordinator);
  await db.query("update actions set status='cancelled' where id=$1",[action]);
  const otherTask=(await db.query("insert into tasks(action_id,title) values($1,'Nova tarefa') returning id",[action])).rows[0].id;
  await asMember(first);
  await assert.rejects(db.query('insert into participations(action_id) values($1)',[action]),/row-level security/);
  await assert.rejects(db.query('insert into offers(material_id,quantity) values($1,1)',[material]),/row-level security/);
  await assert.rejects(db.query('insert into assignments(task_id) values($1)',[otherTask]),/row-level security/);
  assert.equal((await db.query('update assignments set completed=false where task_id=$1 returning *',[task])).rows.length,0);
});
test('membro inativo perde acesso inclusive aos agregados', async () => {
  await asMember(inactive);
  for(const table of ['actions','members','tasks','materials','participations','offers','assignments']) assert.equal((await db.query(`select * from ${table}`)).rows.length,0);
  assert.equal((await db.query('select * from material_totals($1)',[action])).rows.length,0);
  assert.equal((await db.query('select * from task_availability($1)',[action])).rows.length,0);
});

test('ofertas idempotentes, dois contribuintes e agregados isolados por material e ação', async () => {
  await asMember(coordinator);
  const anotherAction = (await db.query("insert into actions(title,objective,starts_at,location) values ('Outra ação','Objetivo',now(),'Local') returning id")).rows[0].id;
  const newMaterial = (await db.query("insert into materials(action_id,title,unit,needed) values($1,'Papel','folhas',20) returning id",[anotherAction])).rows[0].id;
  const secondMaterial = (await db.query("insert into materials(action_id,title,unit,needed) values($1,'Tinta','latas',5) returning id",[anotherAction])).rows[0].id;
  await asMember(first);
  const token = '20000000-0000-4000-8000-000000000001';
  for(let i=0;i<2;i++) await db.query('insert into offers(id,material_id,quantity) values($1,$2,7) on conflict(id) do nothing',[token,newMaterial]);
  await db.query('insert into offers(material_id,quantity) values($1,2)',[secondMaterial]);
  await asMember(second);
  await db.query('insert into offers(material_id,quantity) values($1,3)',[newMaterial]);
  const totals = (await db.query('select * from material_totals($1)',[anotherAction])).rows;
  assert.equal(totals.length,2);
  assert.equal(Number(totals.find(row=>row.material_id===newMaterial).offered),10);
  assert.equal(Number(totals.find(row=>row.material_id===secondMaterial).offered),2);
  assert.equal((await db.query('select * from offers where material_id=$1',[newMaterial])).rows.length,1);
  assert.equal((await db.query('select * from material_totals($1)',[action])).rows.length,1);
});

test('recebimento obsoleto não sobrescreve e retirada preserva histórico recebido', async () => {
  await asMember(coordinator);
  const newAction = (await db.query("insert into actions(title,objective,starts_at,location) values ('Entrega','Objetivo',now(),'Local') returning id")).rows[0].id;
  const newMaterial = (await db.query("insert into materials(action_id,title,unit,needed) values($1,'Papel','folhas',20) returning id",[newAction])).rows[0].id;
  await asMember(first);
  const newOffer = (await db.query('insert into offers(material_id,quantity) values($1,10) returning id',[newMaterial])).rows[0].id;
  await asMember(second);
  await assert.rejects(db.query('select withdraw_offer($1,10,0)',[newOffer]),/não autorizada/);
  await asMember(coordinator);
  assert.equal((await db.query('update offers set received=4 where id=$1 and received=0 returning id',[newOffer])).rows.length,1);
  assert.equal((await db.query('update offers set received=2 where id=$1 and received=0 returning id',[newOffer])).rows.length,0);
  await asMember(first);
  await assert.rejects(db.query('select withdraw_offer($1,10,0)',[newOffer]),/alterada/);
  await assert.rejects(db.query('select withdraw_offer($1,null,null)',[newOffer]),/alterada/);
  await db.query('select withdraw_offer($1,10,4)',[newOffer]);
  const preserved = (await db.query('select quantity,received from offers where id=$1',[newOffer])).rows[0];
  assert.deepEqual(preserved,{quantity:4,received:4});
  const totals = (await db.query('select * from material_totals($1)',[newAction])).rows[0];
  assert.equal(Number(totals.offered),4); assert.equal(Number(totals.received),4);
  // A receipt form from before the withdrawal cannot exceed the now reduced offer.
  await asMember(coordinator);
  await assert.rejects(db.query('update offers set received=8 where id=$1 and received=4',[newOffer]),/check constraint/);
  await asMember(first);
  const untouched = (await db.query('insert into offers(material_id,quantity) values($1,3) returning id',[newMaterial])).rows[0].id;
  await db.query('select withdraw_offer($1,3,0)',[untouched]);
  assert.deepEqual((await db.query('select quantity,received from offers where id=$1',[untouched])).rows[0],{quantity:0,received:0});
});

test('liberação própria, conclusão imutável para liberação e proteção contra formulário antigo', async () => {
  await asMember(coordinator);
  const newAction = (await db.query("insert into actions(title,objective,starts_at,location) values ('Mutirão','Objetivo',now(),'Local') returning id")).rows[0].id;
  const newTask = (await db.query("insert into tasks(action_id,title) values($1,'Organizar mesas') returning id",[newAction])).rows[0].id;
  await asMember(first);
  const claim = (await db.query('insert into assignments(task_id) values($1) returning claim_id',[newTask])).rows[0].claim_id;
  await asMember(second);
  await assert.rejects(db.query('select release_task($1,$2,$3)',[newTask,first,claim]),/não autorizada/);
  await asMember(first);
  await db.query('select release_task($1,$2,$3)',[newTask,first,claim]);
  const reclaim = (await db.query('insert into assignments(task_id) values($1) returning claim_id',[newTask])).rows[0].claim_id;
  await assert.rejects(db.query('select release_task($1,$2,$3)',[newTask,first,claim]),/alterada/);
  await db.query('update assignments set completed=true where task_id=$1',[newTask]);
  await assert.rejects(db.query('select release_task($1,$2,$3)',[newTask,first,reclaim]),/não autorizada/);
  await asMember(coordinator);
  await assert.rejects(db.query('select release_task($1,$2,$3)',[newTask,first,reclaim]),/não autorizada/);
  assert.equal((await db.query('select * from task_availability($1)',[newAction])).rows.length,1);
  assert.ok(!(await db.query('select * from task_availability($1)',[action])).rows.some(row=>row.task_id===newTask));
});

test('coordenação libera tarefas e saldos de pessoa inativa; estranho não obtém acesso', async () => {
  await asMember(coordinator);
  const newAction = (await db.query("insert into actions(title,objective,starts_at,location) values ('Retirada','Objetivo',now(),'Local') returning id")).rows[0].id;
  const newTask = (await db.query("insert into tasks(action_id,title) values($1,'Preparar espaço') returning id",[newAction])).rows[0].id;
  const newMaterial = (await db.query("insert into materials(action_id,title,unit,needed) values($1,'Papel','folhas',10) returning id",[newAction])).rows[0].id;
  await db.exec('reset role');
  const claim=(await db.query('insert into assignments(task_id,member_id) values($1,$2) returning claim_id',[newTask,inactive])).rows[0].claim_id;
  const newOffer=(await db.query('insert into offers(material_id,member_id,quantity,received) values($1,$2,10,3) returning id',[newMaterial,inactive])).rows[0].id;
  for(const actor of [inactive,'90000000-0000-4000-8000-000000000001']) {
    await asMember(actor);
    await assert.rejects(db.query('select release_task($1,$2,$3)',[newTask,inactive,claim]),/não autorizada/);
    await assert.rejects(db.query('select withdraw_offer($1,10,3)',[newOffer]),/não autorizada/);
    assert.equal((await db.query('select * from material_totals($1)',[newAction])).rows.length,0);
  }
  await asMember(coordinator);
  assert.equal((await db.query('select active from members where id=$1',[inactive])).rows[0].active,false);
  await db.query('select release_task($1,$2,$3)',[newTask,inactive,claim]);
  await db.query('select withdraw_offer($1,10,3)',[newOffer]);
  assert.equal((await db.query('select * from assignments where task_id=$1',[newTask])).rows.length,0);
  assert.deepEqual((await db.query('select quantity,received from offers where id=$1',[newOffer])).rows[0],{quantity:3,received:3});
});

test('handler real redireciona falhas de claim/recebimento sem sucesso falso', async () => {
  await asMember(coordinator);
  const newAction = (await db.query("insert into actions(title,objective,starts_at,location) values ('Handler','Objetivo',now(),'Local') returning id")).rows[0].id;
  const newTask = (await db.query("insert into tasks(action_id,title) values($1,'Organizar tudo') returning id",[newAction])).rows[0].id;
  const newMaterial = (await db.query("insert into materials(action_id,title,unit,needed) values($1,'Papel','folhas',10) returning id",[newAction])).rows[0].id;
  await asMember(first);
  await db.query('insert into assignments(task_id) values($1)',[newTask]);
  const newOffer=(await db.query('insert into offers(material_id,quantity) values($1,5) returning id',[newMaterial])).rows[0].id;
  // The adapter executes the handler's actual SQL mutations under authenticated RLS.
  const adapter = {
    from(table) {
      return {
        async insert(value) {
          assert.equal(table,'assignments');
          try { await db.query('insert into assignments(task_id,member_id) values($1,$2)',[value.task_id,value.member_id]); return {error:null}; }
          catch(error) { return {error}; }
        },
        update(value) {
          assert.equal(table,'offers');
          const filters={};
          const builder={ eq(key,expected) { filters[key]=expected; return builder; }, select(){return builder;}, async single() {
            try {
              const result=await db.query('update offers set received=$1 where id=$2 and received=$3 returning id',[value.received,filters.id,filters.received]);
              return result.rows.length ? {data:result.rows[0],error:null} : {data:null,error:new Error('stale')};
            } catch(error) {return {error};}
          }};
          return builder;
        },
      };
    },
  };
  globalThis.__appTest={RedirectSignal,member:{id:second,role:'participant'},db:adapter};
  const { mutate }=await loadSource('app/painel/actions.ts',{
    '@/lib/auth': 'export async function requireMember(){return globalThis.__appTest;}',
    'next/navigation':redirectMock,
    'next/cache':'export function revalidatePath(){}',
  });
  const form=(fields)=>{const value=new FormData();for(const [key,item] of Object.entries(fields))value.set(key,item);return value;};
  await asMember(second);
  await assert.rejects(mutate(form({op:'claim',action_id:newAction,task_id:newTask})),error=>error instanceof RedirectSignal && error.location.endsWith('?erro=operacao'));
  await asMember(coordinator); globalThis.__appTest.member={id:coordinator,role:'coordinator'};
  await assert.rejects(mutate(form({op:'receive',action_id:newAction,offer_id:newOffer,received:'6',expected_received:'0'})),error=>error instanceof RedirectSignal && error.location.endsWith('?erro=operacao'));
  assert.equal((await db.query('select received from offers where id=$1',[newOffer])).rows[0].received,0);
  assert.equal((await db.query('select member_id from assignments where task_id=$1',[newTask])).rows[0].member_id,first);
  delete globalThis.__appTest;
});

test('conversão Brasília preserva hora civil e rejeita calendário inválido', async () => {
  const {encodeBrasilia,decodeBrasilia}=await loadSource('lib/time.ts');
  for(const civil of ['2026-09-15T00:00','2026-12-31T23:59','2028-02-29T12:30']) assert.equal(decodeBrasilia(encodeBrasilia(civil)),civil);
  assert.equal(new Date(encodeBrasilia('2026-09-15T14:00')).toISOString(),'2026-09-15T17:00:00.000Z');
  for(const invalid of ['2026-02-29T12:00','2026-04-31T12:00','2026-01-01T24:00','2026-09-15','']) assert.throws(()=>encodeBrasilia(invalid));
});

test('paginação lê além do limite e não devolve resultado parcial quando falha', async () => {
  const {allRows}=await loadSource('lib/pagination.ts');
  const values=Array.from({length:1201},(_,id)=>({id})); const calls=[];
  const result=await allRows(()=>({async range(from,to){calls.push([from,to]);return {data:values.slice(from,to+1),error:null};}}));
  assert.deepEqual(result,values); assert.deepEqual(calls,[[0,499],[500,999],[1000,1499]]);
  await assert.rejects(allRows(()=>({async range(from){return from===0?{data:values.slice(0,500),error:null}:{data:null,error:new Error('network')};}})),/todos os registros/);
});
