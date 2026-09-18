import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
for(const [route,marker] of [['/','Mensageiros da Cruz'],['/previa','DADOS FICTÍCIOS'],['/entrar','Bom ter você aqui'],['/auth/confirm','Acesse seu convite']]) {
  const response=await fetch(base+route,{redirect:'manual'});
  assert.equal(response.status,200,route);
  const html=await response.text(); assert.ok(html.includes(marker),route);
  const policy=response.headers.get('content-security-policy'); assert.ok(policy?.includes("object-src 'none'"));
  const nonce=policy.match(/'nonce-([^']+)'/)?.[1]; assert.ok(nonce);
  for(const tag of html.matchAll(/<script\b[^>]*>/g)) assert.ok(tag[0].includes(`nonce="${nonce}"`),`${route}: script without matching nonce`);
  assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  console.log(`OK ${route}: público, CSP e nonce`);
}
for(const route of ['/painel','/painel/convites','/painel/acoes/10000000-0000-4000-8000-000000000001','/ativar']) {
  const response=await fetch(base+route,{redirect:'manual'});
  assert.equal(response.status,307,route); assert.equal(response.headers.get('location'),'/entrar',route);
  console.log(`OK ${route}: visitante redirecionado`);
}
console.log('Verificação HTTP concluída. Nenhum usuário real foi utilizado.');
