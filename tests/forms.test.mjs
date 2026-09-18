import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadSource, RedirectSignal, redirectMock } from './load-source.mjs';
const state={RedirectSignal};globalThis.__appTest=state;
const {saveAction,mutate}=await loadSource('app/painel/actions.ts',{
  '@/lib/auth':'export const requireMember=async()=>globalThis.__appTest;',
  'next/navigation':redirectMock,'next/cache':'export const revalidatePath=()=>{};',
});
const valid={title:'Visita fictícia',objective:'Conviver e ajudar',location:'Local de teste',starts_at:'2027-01-01T10:00',instructions:'Orientações de teste',status:'scheduled'};
const form=values=>{const f=new FormData();for(const [k,v] of Object.entries(values))f.set(k,v);return f;};
beforeEach(()=>{
  state.member={id:'10000000-0000-4000-8000-000000000001',role:'coordinator'};state.writes=[];state.result={data:null,error:{message:'fixture unavailable'}};
  state.db={from:table=>({insert:value=>{state.writes.push({table,value});return {select:()=>({single:async()=>state.result})};}})};
});
test('erro de persistência preserva campos e horário civil da ação',async()=>{
  const result=await saveAction({},form(valid));
  assert.ok(result.error); assert.deepEqual(result.values,valid);
  assert.equal(state.writes[0].value.starts_at,'2027-01-01T10:00:00-03:00');
});
test('data inválida e participante não criam ação',async()=>{
  assert.ok((await saveAction({},form({...valid,starts_at:'2027-02-30T10:00'}))).error);
  state.member.role='participant';
  assert.ok((await saveAction({},form(valid))).error);
  assert.equal(state.writes.length,0);
});
test('ação persistida direciona ao registro criado',async()=>{
  const id='20000000-0000-4000-8000-000000000001';state.result={data:{id},error:null};
  await assert.rejects(saveAction({},form(valid)),error=>error instanceof RedirectSignal && error.location===`/painel/acoes/${id}?ok=1`);
});
test('participante não chega à gravação administrativa mesmo forjando formulário',async()=>{
  state.member.role='participant';
  for(const op of ['receive','material','task']) await assert.rejects(mutate(form({op,action_id:'20000000-0000-4000-8000-000000000001'})),error=>error instanceof RedirectSignal && error.location.endsWith('?erro=operacao'));
  assert.equal(state.writes.length,0);
});
