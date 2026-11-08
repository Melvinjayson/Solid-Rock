-- Solid Rock v1 database foundation (Supabase PostgreSQL).
-- Run only in an isolated Solid Rock project after review; never in Liberty production.
-- Existing ChMeetings identities MUST be migrated by a controlled, audited process.
create extension if not exists pgcrypto;

create type public.member_role as enum ('member','group_leader','ministry_leader','pastor','finance','content_admin','super_admin');
create type public.registration_status as enum ('registered','waitlisted','cancelled');
create type public.request_status as enum ('new','acknowledged','closed');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 email text,
 phone text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.staff_roles (
 user_id uuid not null references auth.users(id) on delete cascade,
 role public.member_role not null,
 granted_at timestamptz not null default now(),
 primary key(user_id, role)
);
create table public.public_settings (
 key text primary key,
 value jsonb not null,
 updated_at timestamptz not null default now()
);
create table public.announcements (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 body text not null,
 published boolean not null default false,
 published_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.sermons (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 description text not null default '',
 speaker text,
 series text,
 passage text,
 media_url text,
 thumbnail_url text,
 captions_url text,
 published_at timestamptz,
 is_public boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.events (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 description text not null default '',
 starts_at timestamptz not null,
 ends_at timestamptz,
 venue text,
 capacity integer check (capacity is null or capacity >= 0),
 registration_enabled boolean not null default false,
 published boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.event_registrations (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.events(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status public.registration_status not null default 'registered',
 created_at timestamptz not null default now(),
 unique(event_id,user_id)
);
create table public.groups (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 description text not null default '',
 location_label text,
 is_public boolean not null default true
);
create table public.group_memberships (
 group_id uuid not null references public.groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(group_id,user_id)
);
create table public.volunteer_opportunities (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 description text not null default '',
 published boolean not null default false
);
create table public.volunteer_interests (
 opportunity_id uuid not null references public.volunteer_opportunities(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(opportunity_id,user_id)
);
create table public.prayer_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 body text not null check (length(body) between 1 and 3000),
 status public.request_status not null default 'new',
 created_at timestamptz not null default now()
);
create table public.pastoral_slots (
 id uuid primary key default gen_random_uuid(),
 pastor_id uuid not null references auth.users(id),
 starts_at timestamptz not null unique,
 ends_at timestamptz not null,
 available boolean not null default true,
 constraint valid_slot check(ends_at > starts_at)
);
create table public.pastoral_bookings (
 id uuid primary key default gen_random_uuid(),
 slot_id uuid not null unique references public.pastoral_slots(id),
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 cancelled_at timestamptz
);
create unique index pastoral_bookings_active_slot on public.pastoral_bookings(slot_id) where cancelled_at is null;
create table public.bookmarks (
 user_id uuid not null references auth.users(id) on delete cascade,
 item_type text not null check (item_type in ('sermon','scripture','devotional')),
 item_id text not null,
 created_at timestamptz not null default now(),
 primary key(user_id,item_type,item_id)
);
create table public.reading_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 plan_key text not null,
 completed_days integer[] not null default '{}',
 updated_at timestamptz not null default now(),
 primary key(user_id,plan_key)
);
-- Giving records are backend-generated only. Never accept amounts or confirmation as client authority.
create table public.giving_ledger (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete set null,
 external_provider text not null,
 external_payment_id text not null unique,
 fund_code text not null,
 amount_minor bigint not null check(amount_minor > 0),
 currency char(3) not null default 'EUR',
 verified_at timestamptz not null,
 created_at timestamptz not null default now()
);
create table public.audit_events (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id) on delete set null,
 action text not null,
 object_type text not null,
 object_id text,
 details jsonb not null default '{}',
 created_at timestamptz not null default now()
);

create or replace function public.has_role(allowed public.member_role[])
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.staff_roles where user_id=auth.uid() and role = any(allowed)); $$;

alter table public.profiles enable row level security;
alter table public.staff_roles enable row level security;
alter table public.public_settings enable row level security;
alter table public.announcements enable row level security;
alter table public.sermons enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.volunteer_opportunities enable row level security;
alter table public.volunteer_interests enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.pastoral_slots enable row level security;
alter table public.pastoral_bookings enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reading_progress enable row level security;
alter table public.giving_ledger enable row level security;
alter table public.audit_events enable row level security;

create policy "owner reads profile" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(array['super_admin']::public.member_role[]));
create policy "owner inserts profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "owner updates profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "staff see own roles" on public.staff_roles for select to authenticated using (user_id = auth.uid() or public.has_role(array['super_admin']::public.member_role[]));
create policy "settings public" on public.public_settings for select to anon,authenticated using (true);
create policy "announcements public" on public.announcements for select to anon,authenticated using (published or public.has_role(array['content_admin','super_admin']::public.member_role[]));
create policy "sermons public" on public.sermons for select to anon,authenticated using (is_public or public.has_role(array['content_admin','super_admin']::public.member_role[]));
create policy "events public" on public.events for select to anon,authenticated using (published or public.has_role(array['content_admin','super_admin']::public.member_role[]));
create policy "groups public" on public.groups for select to anon,authenticated using (is_public or public.has_role(array['group_leader','super_admin']::public.member_role[]));
create policy "volunteer opportunities public" on public.volunteer_opportunities for select to anon,authenticated using (published or public.has_role(array['ministry_leader','super_admin']::public.member_role[]));
create policy "registrations own read" on public.event_registrations for select to authenticated using(user_id=auth.uid() or public.has_role(array['super_admin']::public.member_role[]));
create policy "registrations own insert" on public.event_registrations for insert to authenticated with check (
 user_id=auth.uid() and status='registered' and exists(
 select 1 from public.events e where e.id=event_id and e.published and e.registration_enabled and e.capacity is null
 )
);
-- Capped event registration must use a transactional privileged RPC; direct inserts are deliberately rejected for capped events.
create policy "registrations own cancel" on public.event_registrations for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and status='cancelled');
create policy "group memberships own" on public.group_memberships for select to authenticated using(user_id=auth.uid() or public.has_role(array['group_leader','super_admin']::public.member_role[]));
create policy "group membership join" on public.group_memberships for insert to authenticated with check (user_id=auth.uid() and exists(select 1 from public.groups where id=group_id and is_public));
create policy "group membership leave" on public.group_memberships for delete to authenticated using (user_id=auth.uid());
create policy "volunteer interests own read" on public.volunteer_interests for select to authenticated using(user_id=auth.uid() or public.has_role(array['ministry_leader','super_admin']::public.member_role[]));
create policy "volunteer interests create" on public.volunteer_interests for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.volunteer_opportunities where id=opportunity_id and published));
create policy "volunteer interests remove" on public.volunteer_interests for delete to authenticated using(user_id=auth.uid());
create policy "prayer private read" on public.prayer_requests for select to authenticated using (user_id=auth.uid() or public.has_role(array['pastor','super_admin']::public.member_role[]));
create policy "prayer private submit" on public.prayer_requests for insert to authenticated with check(user_id=auth.uid() and status='new');
create policy "pastoral available slots" on public.pastoral_slots for select to authenticated using (available or pastor_id=auth.uid() or public.has_role(array['pastor','super_admin']::public.member_role[]));
create policy "bookings owner read" on public.pastoral_bookings for select to authenticated using (user_id=auth.uid() or exists(select 1 from public.pastoral_slots s where s.id=slot_id and s.pastor_id=auth.uid()));
create policy "bookmarks own read" on public.bookmarks for select to authenticated using(user_id=auth.uid());
create policy "bookmarks own add" on public.bookmarks for insert to authenticated with check(user_id=auth.uid());
create policy "bookmarks own remove" on public.bookmarks for delete to authenticated using(user_id=auth.uid());
create policy "reading own read" on public.reading_progress for select to authenticated using(user_id=auth.uid());
create policy "reading own insert" on public.reading_progress for insert to authenticated with check(user_id=auth.uid());
create policy "reading own update" on public.reading_progress for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "giving own read" on public.giving_ledger for select to authenticated using(user_id=auth.uid() or public.has_role(array['finance','super_admin']::public.member_role[]));
create policy "audit privileged read" on public.audit_events for select to authenticated using(public.has_role(array['super_admin']::public.member_role[]));

-- No client insert policies for financial ledger, audit events, staff roles, slots, or published content.
-- Write them through authenticated administrative functions with separate, validated service credentials.
-- Do not expose the Supabase service_role key to React Native.
