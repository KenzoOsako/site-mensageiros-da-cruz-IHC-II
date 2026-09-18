import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSource, RedirectSignal, redirectMock } from './load-source.mjs';

test('convite → cookie SSR → senha → entrada → sessão inativa → saída (Auth simulado)',async()=>{
  const jar=new Map();
  globalThis.__appTest={RedirectSignal,cookieJar:{getAll:()=>[...jar].map(([name,value])=>({name,value})),set:(name,value,options)=>{if(options?.maxAge===0) jar.delete(name);else jar.set(name,value);}}};
  const boundaries={'next/navigation':redirectMock,'next/headers':'export const cookies=async()=>globalThis.__appTest.cookieJar;','server-only':''};
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://fixture.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='fixture-public-key';
  const now=Math.floor(Date.now()/1000);
  const user={id:'10000000-0000-4000-8000-000000000001',aud:'authenticated',role:'authenticated',email:'fixture@example.com',email_confirmed_at:new Date().toISOString(),created_at:new Date().toISOString(),app_metadata:{provider:'email'},user_metadata:{}};
  const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
  const jwt=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:user.id,aud:'authenticated',exp:now+3600,iat:now})+'.fixture';
  const session={access_token:jwt,refresh_token:'fixture-refresh',token_type:'bearer',expires_in:3600,expires_at:now+3600,user};
  let active=true, passwordUpdates=0, verification=0;
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async(input,options={})=>{
    const url=new URL(typeof input==='string'?input:input.url || input.toString());
    assert.equal(url.origin,'https://fixture.supabase.co','unexpected network destination');
    let payload;
    if(url.pathname==='/auth/v1/verify') {verification++;payload=session;}
    else if(url.pathname==='/auth/v1/token') payload=session;
    else if(url.pathname==='/auth/v1/user') { if(options.method==='PUT') passwordUpdates++; payload=user; }
    else if(url.pathname==='/auth/v1/logout') return new Response(null,{status:204});
    else if(url.pathname==='/rest/v1/members') payload={id:user.id,name:'Pessoa fictícia',role:'participant',active};
    else throw new Error('Unhandled fixture request: '+url.pathname);
    return new Response(JSON.stringify(payload),{status:200,headers:{'Content-Type':'application/json'}});
  };
  try {
    const auth=await loadSource('app/auth/actions.ts',boundaries);
    const confirm=await loadSource('app/auth/confirm-action.ts',boundaries);
    const membership=await loadSource('lib/auth.ts',boundaries);
    const form=values=>{const f=new FormData();for(const [k,v] of Object.entries(values))f.set(k,v);return f;};
    const goes=(fn,target)=>assert.rejects(fn,e=>e instanceof RedirectSignal && e.location===target);
    await goes(()=>confirm.confirmAccess(form({type:'invite',token_hash:'fixture-token'})),'/ativar');
    assert.equal(verification,1); assert.ok([...jar.keys()].some(name=>name.includes('auth-token')));
    assert.equal((await membership.currentMember()).member.id,user.id);
    await goes(()=>auth.setPassword(form({password:'fixture-password',confirm:'fixture-password'})),'/painel');
    assert.equal(passwordUpdates,1);
    await goes(()=>auth.logout(),'/entrar');
    assert.equal((await membership.currentMember()),null);
    await goes(()=>auth.login(form({email:user.email,password:'fixture-password'})),'/painel');
    assert.equal((await membership.currentMember()).member.id,user.id);
    active=false;
    assert.equal(await membership.currentMember(),null);
    await goes(()=>auth.logout(),'/entrar');
    assert.equal(jar.size,0);
  } finally {
    globalThis.fetch=originalFetch;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
});
