-- No production data is seeded. Apply only to an approved development project first.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create table public.staff_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('admin','events'))
);
create table public.events (
 id uuid primary key default gen_random_uuid(),
 title text not null check (length(trim(title)) between 1 and 160),
 description text not null default '' check(length(description)<=10000),
 location text not null check(length(trim(location)) between 1 and 300),
 starts_at timestamptz not null, ends_at timestamptz not null,
 capacity integer not null check(capacity between 1 and 10000),
 status text not null default 'draft' check(status in ('draft','published','cancelled')),
 created_at timestamptz not null default now(), check(ends_at>starts_at)
);
create table public.registrations (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.events(id),
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'confirmed' check(status in ('confirmed','cancelled')),
 created_at timestamptz not null default now(), unique(event_id,user_id)
);
create index registrations_user_idx on public.registrations(user_id);
create table public.registration_confirmations (
 registration_id uuid primary key references public.registrations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 message text not null,
 created_at timestamptz not null default now()
);
create index confirmations_user_idx on public.registration_confirmations(user_id);
create table public.audit_events (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id) on delete set null,
 action text not null, entity_id uuid not null, created_at timestamptz not null default now()
);
alter table public.staff_roles enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.registration_confirmations enable row level security;
alter table public.audit_events enable row level security;
revoke all on public.staff_roles, public.events, public.registrations, public.registration_confirmations, public.audit_events from anon, authenticated;
grant select on public.events to anon,authenticated;
grant select on public.staff_roles,public.registrations,public.registration_confirmations,public.audit_events to authenticated;
create policy own_role on public.staff_roles for select to authenticated using(user_id=(select auth.uid()));
create function private.is_staff() returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.staff_roles where user_id=(select auth.uid()) and role in ('admin','events'));
$$;
revoke all on function private.is_staff() from public,anon,authenticated;
grant execute on function private.is_staff() to authenticated;
create policy published_events on public.events for select to anon,authenticated using(status='published');
create policy staff_events on public.events for select to authenticated using((select private.is_staff()));
create policy registrations_owner on public.registrations for select to authenticated using(user_id=(select auth.uid()) or (select private.is_staff()));
create policy confirmations_owner on public.registration_confirmations for select to authenticated using(user_id=(select auth.uid()));
create policy staff_audit on public.audit_events for select to authenticated using((select private.is_staff()));
-- Definer needed only for transactional writes unavailable to API roles. Each
-- entry checks identity/ownership explicitly; private is not an exposed API schema.
create function private.register_for_event(p_event_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare e public.events; r public.registrations; uid uuid := auth.uid();
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'AUTH_REQUIRED'; end if;
 select * into e from public.events where id=p_event_id for update;
 if not found or e.status<>'published' or e.starts_at<=now() then raise exception 'EVENT_CLOSED'; end if;
 select * into r from public.registrations where event_id=e.id and user_id=uid;
 if found and r.status='confirmed' then return r.id; end if;
 if (select count(*) from public.registrations where event_id=e.id and status='confirmed')>=e.capacity then raise exception 'EVENT_FULL'; end if;
 insert into public.registrations(event_id,user_id) values(e.id,uid)
 on conflict(event_id,user_id) do update set status='confirmed',created_at=now() returning * into r;
 insert into public.registration_confirmations(registration_id,user_id,message) values(r.id,uid,'Your place is confirmed. Reference: '||r.id::text)
 on conflict(registration_id) do update set message=excluded.message,created_at=now();
 insert into public.audit_events(actor_id,action,entity_id) values(uid,'registration.confirmed',r.id);
 return r.id;
end; $$;
create function private.cancel_registration(p_event_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare rid uuid; uid uuid := auth.uid();
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 perform 1 from public.events where id=p_event_id for update;
 update public.registrations set status='cancelled' where event_id=p_event_id and user_id=uid and status='confirmed' returning id into rid;
 if rid is not null then
 delete from public.registration_confirmations where registration_id=rid;
 insert into public.audit_events(actor_id,action,entity_id) values(uid,'registration.cancelled',rid);
 end if;
end; $$;
create function private.save_event(p_id uuid,p_title text,p_description text,p_location text,p_starts_at timestamptz,p_ends_at timestamptz,p_capacity integer,p_status text) returns uuid language plpgsql security definer set search_path='' as $$
declare eid uuid;
begin
 if auth.uid() is null or not exists(select 1 from public.staff_roles where user_id=auth.uid() and role in ('admin','events')) then raise exception 'STAFF_REQUIRED'; end if;
 if p_id is not null then
 perform 1 from public.events where id=p_id for update;
 if not found then raise exception 'EVENT_NOT_FOUND'; end if;
 if p_capacity<(select count(*) from public.registrations where event_id=p_id and status='confirmed') then raise exception 'CAPACITY_BELOW_REGISTRATIONS'; end if;
 update public.events set title=p_title,description=p_description,location=p_location,starts_at=p_starts_at,ends_at=p_ends_at,capacity=p_capacity,status=p_status where id=p_id returning id into eid;
 else
 insert into public.events(title,description,location,starts_at,ends_at,capacity,status) values(p_title,p_description,p_location,p_starts_at,p_ends_at,p_capacity,p_status) returning id into eid;
 end if;
 insert into public.audit_events(actor_id,action,entity_id) values(auth.uid(),'event.'||p_status,eid);
 return eid;
end; $$;
create function public.register_for_event(p_event_id uuid) returns uuid language sql security invoker set search_path='' as $$ select private.register_for_event(p_event_id); $$;
create function public.cancel_registration(p_event_id uuid) returns void language sql security invoker set search_path='' as $$ select private.cancel_registration(p_event_id); $$;
create function public.save_event(p_id uuid,p_title text,p_description text,p_location text,p_starts_at timestamptz,p_ends_at timestamptz,p_capacity integer,p_status text) returns uuid language sql security invoker set search_path='' as $$ select private.save_event(p_id,p_title,p_description,p_location,p_starts_at,p_ends_at,p_capacity,p_status); $$;
revoke all on function private.register_for_event(uuid),private.cancel_registration(uuid),private.save_event(uuid,text,text,text,timestamptz,timestamptz,integer,text),public.register_for_event(uuid),public.cancel_registration(uuid),public.save_event(uuid,text,text,text,timestamptz,timestamptz,integer,text) from public,anon,authenticated;
grant execute on function private.register_for_event(uuid),private.cancel_registration(uuid),private.save_event(uuid,text,text,text,timestamptz,timestamptz,integer,text),public.register_for_event(uuid),public.cancel_registration(uuid),public.save_event(uuid,text,text,text,timestamptz,timestamptz,integer,text) to authenticated;
commit;
