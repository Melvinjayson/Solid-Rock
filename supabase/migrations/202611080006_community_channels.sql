-- Community v1: no public guest posting, anonymous user enumeration, direct messages or minor accounts.
-- Review with church safeguarding/data-protection owner and test RLS before applying to staging.
create table public.community_channels (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z0-9-]{3,50}$'),
 title text not null check(length(title) between 3 and 80),
 description text not null default '',
 kind text not null check(kind in ('announcements','discussion','prayer','study')),
 is_listed boolean not null default true,
 is_locked boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.community_memberships (
 channel_id uuid not null references public.community_channels(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(channel_id,user_id)
);
create table public.community_messages (
 id uuid primary key default gen_random_uuid(),
 channel_id uuid not null references public.community_channels(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(length(btrim(body)) between 1 and 2000),
 created_at timestamptz not null default now(),
 hidden_at timestamptz,
 hidden_by uuid references auth.users(id) on delete set null,
 hidden_reason text
);
create index community_messages_channel_time on public.community_messages(channel_id,created_at desc,id);
create table public.community_reports (
 id uuid primary key default gen_random_uuid(),
 message_id uuid not null references public.community_messages(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check(reason in ('harassment','spam','privacy','safeguarding','other')),
 context text not null default '' check(length(context)<=500),
 created_at timestamptz not null default now(),
 unique(message_id,reporter_id)
);
create table public.community_mutes (
 user_id uuid not null references auth.users(id) on delete cascade,
 channel_id uuid not null references public.community_channels(id) on delete cascade,
 muted_until timestamptz not null,
 reason text,
 primary key(user_id,channel_id)
);
create table public.community_blocks (
 blocker_id uuid not null references auth.users(id) on delete cascade,
 blocked_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(blocker_id,blocked_id),
 check(blocker_id<>blocked_id)
);
alter table public.community_channels enable row level security;
alter table public.community_memberships enable row level security;
alter table public.community_messages enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_mutes enable row level security;
alter table public.community_blocks enable row level security;

create or replace function public.community_is_member(p_channel uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.community_memberships
 where channel_id=p_channel and user_id=auth.uid()); $$;
create or replace function public.community_can_moderate()
returns boolean language sql stable security definer set search_path=''
as $$ select public.has_role(array['pastor','super_admin']::public.member_role[]); $$;

create policy "listed community channels discoverable" on public.community_channels
 for select to anon,authenticated using(is_listed or public.community_is_member(id) or public.community_can_moderate());
create policy "own memberships" on public.community_memberships
 for select to authenticated using(user_id=auth.uid());
create policy "messages only for participants" on public.community_messages
 for select to authenticated using(
 (public.community_is_member(channel_id) or public.community_can_moderate())
 and (hidden_at is null or author_id=auth.uid() or public.community_can_moderate())
 and not exists(
   select 1 from public.community_blocks b
   where (b.blocker_id=auth.uid() and b.blocked_id=author_id)
      or (b.blocker_id=author_id and b.blocked_id=auth.uid())
 )
);
create policy "own reports only" on public.community_reports
 for select to authenticated using(reporter_id=auth.uid() or public.community_can_moderate());
create policy "own mutes visible" on public.community_mutes
 for select to authenticated using(user_id=auth.uid() or public.community_can_moderate());
create policy "own blocks visible" on public.community_blocks
 for select to authenticated using(blocker_id=auth.uid());

-- Only RPCs can add members, publish or moderate; direct client table inserts are prohibited.
create or replace function public.community_join(p_channel uuid)
returns void language plpgsql security definer set search_path=''
as $$
declare v public.community_channels%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into v from public.community_channels where id=p_channel and is_listed for update;
 if not found or v.is_locked then raise exception 'Channel not accepting members'; end if;
 insert into public.community_memberships(channel_id,user_id)
 values(p_channel,auth.uid()) on conflict do nothing;
end; $$;

create or replace function public.community_leave(p_channel uuid)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 delete from public.community_memberships where channel_id=p_channel and user_id=auth.uid();
end; $$;

create or replace function public.community_post(p_channel uuid,p_body text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v public.community_channels%rowtype; result uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if length(btrim(coalesce(p_body,''))) not between 1 and 2000 then
   raise exception 'Message must contain 1 to 2000 characters'; end if;
 select * into v from public.community_channels where id=p_channel for update;
 if not found or v.is_locked or not public.community_is_member(p_channel) then
   raise exception 'Channel access denied'; end if;
 if v.kind='announcements' and not public.has_role(array['pastor','content_admin','super_admin']::public.member_role[]) then
   raise exception 'Announcement channel is read-only'; end if;
 if exists(select 1 from public.community_mutes where channel_id=p_channel and user_id=auth.uid()
   and muted_until>now()) then raise exception 'Messaging temporarily unavailable'; end if;
 if exists(select 1 from public.community_messages where channel_id=p_channel and author_id=auth.uid()
   and created_at>now()-interval '20 seconds') then
   raise exception 'Please allow 20 seconds between messages'; end if;
 insert into public.community_messages(channel_id,author_id,body)
 values(p_channel,auth.uid(),btrim(p_body)) returning id into result;
 return result;
end; $$;

create or replace function public.community_report(p_message uuid,p_reason text,p_context text default '')
returns void language plpgsql security definer set search_path=''
as $$
declare v public.community_messages%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_reason not in ('harassment','spam','privacy','safeguarding','other')
   or length(coalesce(p_context,''))>500 then raise exception 'Invalid report'; end if;
 select * into v from public.community_messages where id=p_message;
 if not found or not public.community_is_member(v.channel_id) then
   raise exception 'Not permitted to report this message'; end if;
 insert into public.community_reports(message_id,reporter_id,reason,context)
 values(p_message,auth.uid(),p_reason,coalesce(p_context,''))
 on conflict(message_id,reporter_id) do nothing;
end; $$;

create or replace function public.community_hide(p_message uuid,p_reason text)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if not public.community_can_moderate() then raise exception 'Moderator role required'; end if;
 if length(btrim(coalesce(p_reason,'')))<3 then raise exception 'Provide a moderation reason'; end if;
 update public.community_messages set hidden_at=now(),hidden_by=auth.uid(),
 hidden_reason=left(p_reason,500) where id=p_message;
end; $$;

create or replace function public.community_block(p_user uuid)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null or p_user is null or p_user=auth.uid() then
   raise exception 'Invalid block request'; end if;
 insert into public.community_blocks(blocker_id,blocked_id)
 values(auth.uid(),p_user) on conflict do nothing;
end; $$;

revoke all on function public.community_is_member(uuid) from public,anon;
revoke all on function public.community_can_moderate() from public,anon;
revoke all on function public.community_join(uuid) from public,anon;
revoke all on function public.community_leave(uuid) from public,anon;
revoke all on function public.community_post(uuid,text) from public,anon;
revoke all on function public.community_report(uuid,text,text) from public,anon;
revoke all on function public.community_hide(uuid,text) from public,anon;
revoke all on function public.community_block(uuid) from public,anon;
grant execute on function public.community_is_member(uuid) to authenticated;
grant execute on function public.community_can_moderate() to authenticated;
grant execute on function public.community_join(uuid) to authenticated;
grant execute on function public.community_leave(uuid) to authenticated;
grant execute on function public.community_post(uuid,text) to authenticated;
grant execute on function public.community_report(uuid,text,text) to authenticated;
grant execute on function public.community_hide(uuid,text) to authenticated;
grant execute on function public.community_block(uuid) to authenticated;

-- Channel catalogue names are product IA proposals, not claims of current church groups.
insert into public.community_channels(slug,title,description,kind)
values
 ('church-updates','Church updates','Announcements from the pastoral and church team','announcements'),
 ('prayer-circle','Prayer circle','Share prayer intentions respectfully and encourage one another','prayer'),
 ('faith-and-life','Faith & life','Discuss faith, daily life and the Sunday message','discussion'),
 ('scripture-together','Scripture together','Read, reflect and grow in the Word','study'),
 ('serve-together','Serve together','Connect around ministry and volunteer opportunities','discussion')
on conflict(slug) do nothing;
