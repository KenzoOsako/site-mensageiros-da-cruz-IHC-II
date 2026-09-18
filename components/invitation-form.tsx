'use client';
import { useActionState } from 'react';
import { invite, type InvitationState } from '@/app/painel/convites/actions';
export function InvitationForm() {
  const [state,action,pending] = useActionState<InvitationState,FormData>(invite,{});
  return <form action={action}><label>Nome do participante<input name="name" required maxLength={100} autoComplete="off"/></label><label>E-mail<input name="email" type="email" required maxLength={254} autoComplete="off"/></label><button className="primary" disabled={pending}>{pending?'Gerando…':'Gerar convite'}</button>{state.error && <p role="alert" className="notice">{state.error}</p>}{state.link && <div className="notice" role="status"><strong>Convite pronto para compartilhar</strong><p>Envie este link apenas à pessoa convidada. Nenhuma mensagem foi enviada automaticamente.</p><label>Link de acesso<textarea className="invite-link" readOnly value={state.link} onFocus={e=>e.currentTarget.select()}/></label></div>}</form>;
}
