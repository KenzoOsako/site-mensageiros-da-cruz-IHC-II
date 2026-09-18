import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth';
import { InvitationForm } from '@/components/invitation-form';
export default async function Invites() {
  const { member } = await requireMember(); if (member.role !== 'coordinator') notFound();
  return <><p className="eyebrow">COORDENAÇÃO</p><h1>Uma porta aberta, com cuidado.</h1><p>Convide os participantes do grupo para a área interna.</p><section className="private-card"><h2>Novo convite</h2><InvitationForm/></section></>;
}
