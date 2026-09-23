'use client';

import { useActionState, useState } from 'react';
import { invite, type InvitationState } from '@/app/painel/convites/actions';

export function InvitationForm() {
  const [state, action, pending] = useActionState<InvitationState, FormData>(invite, {});
  const [copiedLink, setCopiedLink] = useState('');
  const [copyError, setCopyError] = useState(false);

  async function copyLink() {
    if (!state.link) return;
    try {
      await navigator.clipboard.writeText(state.link);
      setCopiedLink(state.link);
      setCopyError(false);
    } catch {
      setCopiedLink('');
      setCopyError(true);
    }
  }

  return <form action={action}>
    <label>Nome do participante<input name="name" required maxLength={100} autoComplete="off" /></label>
    <label>E-mail<input name="email" type="email" required maxLength={254} autoComplete="off" /></label>
    <button className="primary" disabled={pending}>{pending ? 'Gerando…' : 'Gerar convite'}</button>
    {state.error && <p role="alert" className="notice">{state.error}</p>}
    {state.link && <div className="notice">
      <strong>Convite pronto para compartilhar</strong>
      <p>Envie este link apenas à pessoa convidada. Nenhuma mensagem foi enviada automaticamente.</p>
      <label>Link de acesso<textarea className="invite-link" readOnly value={state.link} onFocus={event => event.currentTarget.select()} /></label>
      <button type="button" onClick={copyLink}>Copiar link</button>
      <span role="status" aria-live="polite">{copiedLink === state.link ? ' Link copiado.' : copyError ? ' Não foi possível copiar. Selecione o link acima para copiar manualmente.' : ''}</span>
    </div>}
  </form>;
}
