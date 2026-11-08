-- Event waitlist and event-staff check-in v1: gated until church-run staging.
-- No tickets or paid-event entitlement claims without a reconciled provider.
create table public.event_staff_assignments (
 event_id uuid not null references public.events(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 assigned_at timestamptz not null default now(),
 primary key(event_id,user_id)
);
alter table public.event_staff_assignments enable row level security;
create policy "staff sees own event assignment" on public.event_staff_assignments
 for select to authenticated using(user_id=auth.uid() or public.has_role(array['super_admin']::public.member_role[]));
-- Only a trusted administrator inserts staff assignments; no client write policy.

create table public.event_checkins (
 registration_id uuid primary key references public.event_registrations(id) on delete cascade,
 event_id uuid not null references public.events(id) on delete cascade,
 checked_in_by uuid not null references auth.users(id),
 checked_in_at timestamptz not null default now()
);
alter table public.event_checkins enable row level security;
create policy "attendee sees own event checkin" on public.event_checkins for select to authenticated
 using(exists(select 1 from public.event_registrations r
  where r.id=registration_id and r.user_id=auth.uid()));
-- Check-ins are created exclusively by staff RPC; no client insert/update/delete policies.

create policy "assigned staff sees event registrations" on public.event_registrations
 for select to authenticated using(
  public.has_role(array['super_admin']::public.member_role[])
  or exists(select 1 from public.event_staff_assignments a
    where a.event_id=event_registrations.event_id and a.user_id=auth.uid())
 );

create policy "assigned staff sees attendance" on public.event_checkins
 for select to authenticated using(
  public.has_role(array['super_admin']::public.member_role[])
  or exists(select 1 from public.event_staff_assignments a
    where a.event_id=event_checkins.event_id and a.user_id=auth.uid())
 );

create or replace function public.register_or_waitlist(p_event_id uuid,p_allow_waitlist boolean default false)
returns public.registration_status language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); e public.events%rowtype; old public.event_registrations%rowtype;
 cnt integer; result public.registration_status;
begin
 if v_user is null then raise exception 'Authentication required';end if;
 select * into e from public.events where id=p_event_id for update;
 if not found or not e.published or not e.registration_enabled or e.starts_at<=now() then
  raise exception 'Event registration unavailable';end if;
 select * into old from public.event_registrations where event_id=p_event_id and user_id=v_user for update;
 if found and old.status in ('registered','waitlisted') then return old.status;end if;
 select count(*) into cnt from public.event_registrations
  where event_id=p_event_id and status='registered';
 if e.capacity is null or cnt<e.capacity then result:='registered';
 elsif p_allow_waitlist then result:='waitlisted';
 else raise exception 'Event is full. Request a waitlist place explicitly';end if;
 insert into public.event_registrations(event_id,user_id,status)
 values(p_event_id,v_user,result)
 on conflict(event_id,user_id) do update set status=excluded.status,created_at=now();
 return result;
end; $$;

-- Maintain lock ordering event -> registration for both register and cancel.
create or replace function public.cancel_event_registration(p_registration_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid();v_event_id uuid;
 e public.events%rowtype;r public.event_registrations%rowtype;
 next_id uuid;
begin
 if v_user is null then raise exception 'Authentication required';end if;
 select event_id into v_event_id from public.event_registrations
  where id=p_registration_id and user_id=v_user;
 if v_event_id is null then raise exception 'Registration not found';end if;
 select * into e from public.events where id=v_event_id for update;
 select * into r from public.event_registrations where id=p_registration_id for update;
 if not found or r.user_id<>v_user then raise exception 'Registration not found';end if;
 if r.status='cancelled' then return;end if;
 update public.event_registrations set status='cancelled' where id=p_registration_id;
 if r.status='registered' and e.starts_at>now() then
  select id into next_id from public.event_registrations
   where event_id=v_event_id and status='waitlisted'
   order by created_at,id limit 1 for update;
  if next_id is not null then
   update public.event_registrations set status='registered' where id=next_id;
  end if;
 end if;
end; $$;

create or replace function public.checkin_event_registration(p_registration_id uuid)
returns timestamptz language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=auth.uid();r public.event_registrations%rowtype;
 e public.events%rowtype; existing timestamptz; stamped timestamptz;
begin
 if v_user is null then raise exception 'Authentication required';end if;
 select * into r from public.event_registrations where id=p_registration_id for update;
 if not found or r.status<>'registered' then raise exception 'Ticket is not registered';end if;
 select * into e from public.events where id=r.event_id;
 if not e.published or now()<e.starts_at-interval '12 hours'
   or now()>coalesce(e.ends_at,e.starts_at+interval '12 hours') then
  raise exception 'Check-in window closed';end if;
 if not (public.has_role(array['super_admin']::public.member_role[])
  or exists(select 1 from public.event_staff_assignments a where a.event_id=r.event_id and a.user_id=v_user)) then
  raise exception 'Approved event staff only';end if;
 insert into public.event_checkins(registration_id,event_id,checked_in_by)
 values(r.id,r.event_id,v_user)
 on conflict(registration_id) do nothing returning checked_in_at into stamped;
 if stamped is not null then return stamped;end if;
 select checked_in_at into existing from public.event_checkins where registration_id=r.id;
 return existing;
end; $$;

revoke all on function public.register_or_waitlist(uuid,boolean) from public,anon;
revoke all on function public.checkin_event_registration(uuid) from public,anon;
grant execute on function public.register_or_waitlist(uuid,boolean) to authenticated;
grant execute on function public.checkin_event_registration(uuid) to authenticated;

-- A registration ID may form an opaque check-in reference. QR rendering/scanning
-- is deliberately deferred until real native-device check-in UAT and church acceptance.
