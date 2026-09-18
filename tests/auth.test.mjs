import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadSource, RedirectSignal, redirectMock } from './load-source.mjs';
const state={RedirectSignal}; globalThis.__appTest=state;
const boundaries={
  'next/navigation':redirectMock,
  '@/lib/supabase': 'export const configured=()=>globalThis.__appTest.configured; export const database=async()=>globalThis.__appTest.db;',
  '@/lib/auth':'export const currentMember=async()=>globalThis.__appTest.member; export const requireMember=async()=>{if(!globalThis.__appTest.member) throw new globalThis.__appTest.RedirectSignal("/entrar");return globalThis.__appTest.member;};',
  '@supabase/supabase-js':'export const createClient=()=>globalThis.__appTest.admin;',
};
const auth=await loadSource('app/auth/actions.ts',boundaries);
const confirm=await loadSource('app/auth/confirm-action.ts',boundaries);
const invitations=await loadSource('app/painel/convites/actions.ts',boundaries);
const form=values=>{const f=new FormData(); for(const [k,v] of Object.entries(values)) f.set(k,v);return f;};
const goes=(operation,location)=>assert.rejects(operation,e=>e instanceof RedirectSignal && e.location===location);
beforeEach(()=>{
  state.calls=[]; state.configured=true;
  state.db={auth:{
    signInWithPassword:async values=>{state.calls.push(['login',values]);return {error:state.loginError};},
    signOut:async()=>{state.calls.push(['logout']);return {error:null};},
    updateUser:async values=>{state.calls.push(['password',values]);return {error:state.passwordError};},
    verifyOtp:async values=>{state.calls.push(['verify',values]);return {error:state.otpError};},
  }};
  state.member={db:state.db,member:{id:'10000000-0000-4000-8000-000000000001',role:'participant'}};
  state.loginError=null; state.passwordError=null; state.otpError=null;
});
test('entrada sem configuração ou campos válidos não chama Auth',async()=>{
  state.configured=false;
  await goes(()=>auth.login(form({email:'a@example.com',password:'example-only'})),'/entrar?erro=configuracao');
  state.configured=true;
  await goes(()=>auth.login(form({email:'invalido',password:''})),'/entrar?erro=credenciais');
  assert.deepEqual(state.calls,[]);
});
test('credencial incorreta e membro sem acesso recebem erro genérico e sessão encerrada',async()=>{
  state.loginError={message:'invalid'};
  await goes(()=>auth.login(form({email:'a@example.com',password:'example-only'})),'/entrar?erro=credenciais');
  assert.equal(state.calls.at(-1)[0],'logout');
  state.loginError=null; state.member=null;
  await goes(()=>auth.login(form({email:'a@example.com',password:'example-only'})),'/entrar?erro=credenciais');
  assert.equal(state.calls.at(-1)[0],'logout');
});
test('membro válido entra e consegue sair',async()=>{
  await goes(()=>auth.login(form({email:'a@example.com',password:'example-only'})),'/painel');
  await goes(()=>auth.logout(),'/entrar');
  assert.equal(state.calls.at(-1)[0],'logout');
});
test('ativação valida tamanho e repetição, persiste senha e trata falha',async()=>{
  for(const data of [{password:'short',confirm:'short'},{password:'example-password',confirm:'different'}]) await goes(()=>auth.setPassword(form(data)),'/ativar?erro=senha');
  assert.equal(state.calls.length,0);
  await goes(()=>auth.setPassword(form({password:'example-password',confirm:'example-password'})),'/painel');
  assert.deepEqual(state.calls[0],['password',{password:'example-password'}]);
  state.passwordError={message:'failure'};
  await goes(()=>auth.setPassword(form({password:'example-password',confirm:'example-password'})),'/ativar?erro=senha');
  state.member=null;
  await goes(()=>auth.setPassword(form({password:'example-password',confirm:'example-password'})),'/entrar?erro=convite');
});
test('consumo de convite aceita somente tipos previstos e rejeita expirado',async()=>{
  await goes(()=>confirm.confirmAccess(form({token_hash:'fake-token',type:'signup'})),'/entrar?erro=convite');
  assert.equal(state.calls.length,0);
  for(const type of ['invite','recovery']) {
    await goes(()=>confirm.confirmAccess(form({token_hash:'fake-token',type})),'/ativar');
    assert.deepEqual(state.calls.at(-1),['verify',{token_hash:'fake-token',type}]);
  }
  state.otpError={message:'expired'};
  await goes(()=>confirm.confirmAccess(form({token_hash:'fake-token',type:'invite'})),'/entrar?erro=convite');
});
test('convite exige coordenação e cria apenas participante sem enviar email',async()=>{
  const input=form({name:'Pessoa fictícia',email:'a@example.com'});
  assert.match((await invitations.invite({},input)).error,/Somente/);
  state.member.member.role='coordinator';
  process.env.SUPABASE_SERVICE_ROLE_KEY='test-placeholder';
  process.env.NEXT_PUBLIC_SITE_URL='http://localhost:3000';
  let inserted;
  state.admin={auth:{admin:{generateLink:async payload=>{
    assert.deepEqual(payload,{type:'invite',email:'a@example.com'});
    return {data:{user:{id:'test-user'},properties:{hashed_token:'fake-token'}},error:null};
  }}},from:table=>({insert:async value=>{assert.equal(table,'members');inserted=value;return {error:null};}})};
  const result=await invitations.invite({},input);
  assert.equal(inserted.role,'participant'); assert.equal(inserted.name,'Pessoa fictícia');
  assert.equal(new URL(result.link).pathname,'/auth/confirm');
  assert.equal(new URL(result.link).searchParams.get('type'),'invite');
  delete process.env.SUPABASE_SERVICE_ROLE_KEY; delete process.env.NEXT_PUBLIC_SITE_URL;
});
