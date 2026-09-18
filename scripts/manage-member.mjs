import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Local administration only. generateLink creates a link without sending email.
const [operation, rawEmail, rawName] = process.argv.slice(2);
const email = z.string().email().parse(rawEmail);
const url = z.string().url().parse(process.env.NEXT_PUBLIC_SUPABASE_URL);
const site = z.string().url().parse(process.env.NEXT_PUBLIC_SITE_URL);
const key = z.string().min(1).parse(process.env.SUPABASE_SERVICE_ROLE_KEY);
const admin = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
if (!['bootstrap','recover','deactivate'].includes(operation)) throw new Error('Use bootstrap <email> <nome>, recover <email> ou deactivate <email>.');
async function findUser() {
  for (let page=1;;page++) {
    const {data,error} = await admin.auth.admin.listUsers({page,perPage:100});
    if(error) throw new Error('Falha ao consultar contas.');
    const user=data.users.find(u=>u.email?.toLowerCase()===email.toLowerCase());
    if(user) return user;
    if(data.users.length<100) return null;
  }
}
const user=await findUser();
if(operation==='deactivate') {
  if(!user) throw new Error('Conta não encontrada.');
  const {data:member,error:readError}=await admin.from('members').select('role').eq('id',user.id).single();
  if(readError || !member) throw new Error('Membro não encontrado.');
  if(member.role==='coordinator') throw new Error('Desativação de coordenador deve ser feita no painel Supabase após conferir outro coordenador ativo.');
  const {error}=await admin.from('members').update({active:false}).eq('id',user.id);
  if(error) throw new Error('Falha ao desativar.');
  console.log('Participante desativado. A sessão deixa de ter acesso aos dados.');
} else {
  if(operation==='bootstrap') {
    const name=z.string().trim().min(1).max(100).parse(rawName);
    const {data:existing,error}=await admin.from('members').select('id').eq('role','coordinator').eq('active',true).limit(1);
    if(error) throw new Error('Aplique a migração antes de criar a coordenação.');
    if(existing.length) throw new Error('Já existe coordenação. Use recover para restaurar acesso.');
    if(user) throw new Error('O e-mail já possui conta. Confira o cadastro no Supabase antes do bootstrap.');
    const {data,error:linkError}=await admin.auth.admin.generateLink({type:'invite',email});
    if(linkError || !data.user || !data.properties) throw new Error('Falha ao gerar convite inicial.');
    const {error:insertError}=await admin.from('members').insert({id:data.user.id,name,role:'coordinator'});
    if(insertError) {
      const {error:cleanup}=await admin.auth.admin.deleteUser(data.user.id);
      throw new Error(cleanup?'Cadastro incompleto. Remova a conta órfã no Supabase antes de repetir.':'Falha no cadastro; a conta recém-criada foi removida.');
    }
    const link=new URL('/auth/confirm',site); link.searchParams.set('type','invite'); link.searchParams.set('token_hash',data.properties.hashed_token);
    console.log('Link privado de uso único. Não publique nem inclua em commits.\n'+link);
  } else {
    if(!user) throw new Error('Conta não encontrada.');
    const {data:member,error}=await admin.from('members').select('active').eq('id',user.id).single();
    if(error || !member?.active) throw new Error('A recuperação exige membro ativo.');
    const {data,error:linkError}=await admin.auth.admin.generateLink({type:'recovery',email});
    if(linkError || !data.properties) throw new Error('Falha ao gerar recuperação.');
    const link=new URL('/auth/confirm',site); link.searchParams.set('type','recovery'); link.searchParams.set('token_hash',data.properties.hashed_token);
    console.log('Link privado de uso único. Não publique nem inclua em commits.\n'+link);
  }
}
