'use client';
import { useActionState } from 'react';
import { saveAction, type ActionState } from '@/app/painel/actions';
import { decodeBrasilia } from '@/lib/time';
import { PendingButton } from './pending-button';
export type ActionRecord = { id: string; title: string; objective: string; location: string; starts_at: string; instructions: string; status: string };
export function ActionForm({ action }: { action?: ActionRecord }) {
  const [state, submit] = useActionState<ActionState, FormData>(saveAction, {});
  const values = state.values ?? { ...action, starts_at: action ? decodeBrasilia(action.starts_at) : '' };
  return <form action={submit} className="private-form">{state.error && <p role="alert" className="notice">{state.error}</p>}{action && <input type="hidden" name="action_id" value={action.id} />}<label>Nome da ação<input name="title" required minLength={3} maxLength={120} defaultValue={values.title} /></label><label>Objetivo<textarea name="objective" required minLength={3} maxLength={2000} defaultValue={values.objective} /></label><div className="form-columns"><label>Data e horário (Brasília)<input type="datetime-local" name="starts_at" required defaultValue={values.starts_at} /></label><label>Local<input name="location" required minLength={3} maxLength={200} defaultValue={values.location} /></label></div><label>Orientações<textarea name="instructions" maxLength={3000} defaultValue={values.instructions} /></label><label>Situação<select name="status" defaultValue={values.status || 'scheduled'}><option value="scheduled">Programada</option><option value="cancelled">Cancelada</option></select></label><PendingButton className="primary">{action ? 'Salvar alterações' : 'Criar ação'}</PendingButton></form>;
}
