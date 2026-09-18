create table public.members (id uuid primary key references auth.users(id) on delete cascade, name text not null check(length(name) between 1 and 100), role text not null default 'participant' check(role in ('participant','coordinator')), active boolean not null default true);
create function public.is_member() returns boolean language sql stable security definer set search_path = public,pg_temp as $$ select exists(select 1 from members where id = auth.uid() and active) $$;
create function public.is_coordinator() returns boolean language sql stable security definer set search_path = public,pg_temp as $$ select exists(select 1 from members where id = auth.uid() and active and role='coordinator') $$;
create table public.actions (id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 3 and 120), objective text not null check(length(objective) between 3 and 2000), starts_at timestamptz not null, location text not null check(length(location) between 3 and 200), instructions text not null default '' check(length(instructions)<=3000), status text not null default 'scheduled' check(status in ('scheduled','cancelled')));
create table public.participations (action_id uuid references actions(id) on delete cascade, member_id uuid references members(id) on delete cascade default auth.uid(), primary key(action_id,member_id));
create table public.tasks (id uuid primary key default gen_random_uuid(), action_id uuid not null references actions(id) on delete cascade, title text not null check(length(title) between 3 and 200));
create table public.assignments (task_id uuid primary key references tasks(id) on delete cascade, member_id uuid not null references members(id) on delete cascade default auth.uid(), completed boolean not null default false, claim_id uuid not null default gen_random_uuid());
create table public.materials (id uuid primary key default gen_random_uuid(), action_id uuid not null references actions(id) on delete cascade, title text not null check(length(title) between 2 and 100), unit text not null check(length(unit) between 1 and 30), needed integer not null check(needed>0 and needed<=100000));
create table public.offers (id uuid primary key default gen_random_uuid(), material_id uuid not null references materials(id) on delete cascade, member_id uuid not null references members(id) on delete cascade default auth.uid(), quantity integer not null check(quantity>=0 and quantity<=100000), received integer not null default 0 check(received>=0 and received<=quantity));
alter table members enable row level security;
alter table actions enable row level security;
alter table participations enable row level security;
alter table tasks enable row level security;
alter table assignments enable row level security;
alter table materials enable row level security;
alter table offers enable row level security;
create policy member_read on members for select to authenticated using (is_member() and (id=auth.uid() or is_coordinator()));
create policy action_read on actions for select to authenticated using (is_member());
create policy action_admin on actions for all to authenticated using (is_coordinator()) with check (is_coordinator());
create policy task_read on tasks for select to authenticated using(is_member());
create policy task_admin on tasks for all to authenticated using(is_coordinator()) with check(is_coordinator());
create policy material_read on materials for select to authenticated using(is_member());
create policy material_admin on materials for all to authenticated using(is_coordinator()) with check(is_coordinator());
create policy participation_read on participations for select to authenticated using(is_member() and (member_id=auth.uid() or is_coordinator()));
create policy participation_insert on participations for insert to authenticated with check(is_member() and member_id=auth.uid() and exists(select 1 from actions where id=action_id and status='scheduled'));
create policy participation_delete on participations for delete to authenticated using(is_member() and member_id=auth.uid());
create policy assignment_read on assignments for select to authenticated using(is_member() and (member_id=auth.uid() or is_coordinator()));
create policy assignment_insert on assignments for insert to authenticated with check(is_member() and member_id=auth.uid() and not completed and exists(select 1 from tasks t join actions a on a.id=t.action_id where t.id=task_id and a.status='scheduled'));
create policy assignment_update on assignments for update to authenticated using(is_member() and member_id=auth.uid() and exists(select 1 from tasks t join actions a on a.id=t.action_id where t.id=task_id and a.status='scheduled')) with check(is_member() and member_id=auth.uid());
create policy offer_read on offers for select to authenticated using(is_member() and (member_id=auth.uid() or is_coordinator()));
create policy offer_insert on offers for insert to authenticated with check(is_member() and member_id=auth.uid() and received=0 and quantity>0 and exists(select 1 from materials m join actions a on a.id=m.action_id where m.id=material_id and a.status='scheduled'));
create policy offer_receive on offers for update to authenticated using(is_coordinator()) with check(is_coordinator());
-- Remove Supabase default privileges before granting only the required operations.
revoke all on members,actions,participations,tasks,assignments,materials,offers from public,anon,authenticated;
grant all on members,actions,participations,tasks,assignments,materials,offers to service_role;
revoke create on schema public from public,anon,authenticated;
grant usage on schema public to authenticated,service_role;
grant select on members to authenticated;
grant select,insert,update,delete on actions,tasks,materials,participations to authenticated;
grant select,insert on assignments,offers to authenticated;
grant update(completed) on assignments to authenticated;
grant update(received) on offers to authenticated;
create function public.task_availability(target_action uuid) returns table(task_id uuid, taken boolean) language sql stable security definer set search_path=public,pg_temp as $$ select t.id, exists(select 1 from assignments a where a.task_id=t.id) from tasks t where is_member() and t.action_id=target_action $$;
create function public.material_totals(target_action uuid) returns table(material_id uuid, offered bigint, received bigint) language sql stable security definer set search_path=public,pg_temp as $$ select m.id, coalesce(sum(o.quantity),0), coalesce(sum(o.received),0) from materials m left join offers o on o.material_id=m.id where is_member() and m.action_id=target_action group by m.id $$;
-- Lock and compare the form's state. An old form cannot release a new owner or
-- withdraw a balance that changed through a concurrent receipt.
create function public.release_task(target_task uuid, expected_member uuid, expected_claim uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare current_assignment assignments%rowtype;
begin
  select * into current_assignment from assignments where task_id=target_task for update;
  if not found or not is_member() or expected_member is null or expected_claim is null or current_assignment.member_id<>expected_member or current_assignment.claim_id<>expected_claim or current_assignment.completed or not (current_assignment.member_id=auth.uid() or is_coordinator()) then
    raise exception 'Tarefa alterada ou operação não autorizada';
  end if;
  delete from assignments where task_id=target_task;
end $$;
create function public.withdraw_offer(target_offer uuid, expected_quantity integer, expected_received integer) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare current_offer offers%rowtype;
begin
  select * into current_offer from offers where id=target_offer for update;
  if not found or not is_member() or expected_quantity is null or expected_received is null or current_offer.quantity<>expected_quantity or current_offer.received<>expected_received or not (current_offer.member_id=auth.uid() or is_coordinator()) then
    raise exception 'Oferta alterada ou operação não autorizada';
  end if;
  update offers set quantity=received where id=target_offer;
end $$;
revoke all on function public.task_availability(uuid), public.material_totals(uuid), public.release_task(uuid,uuid,uuid), public.withdraw_offer(uuid,integer,integer) from public,anon;
grant execute on function public.task_availability(uuid), public.material_totals(uuid), public.release_task(uuid,uuid,uuid), public.withdraw_offer(uuid,integer,integer) to authenticated;
