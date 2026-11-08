-- Community reply threads and privacy-preserving prayer encouragement.
-- Messages are still authenticated and limited to joined channels.
alter table public.community_messages
 add column reply_to_id uuid references public.community_messages(id) on delete set null;
create index community_messages_reply_idx on public.community_messages(reply_to_id);

create table public.community_prayer_support (
 message_id uuid not null references public.community_messages(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(message_id,user_id)
);
alter table public.community_prayer_support enable row level security;
-- No direct client SELECT policy: supporting members' identities remain confidential.

create or replace function public.community_reply(p_channel uuid,p_parent uuid,p_body text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare channel public.community_channels%rowtype;parent public.community_messages%rowtype;result uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if length(btrim(coalesce(p_body,''))) not between 1 and 2000 then raise exception 'Invalid reply length';end if;
 select * into channel from public.community_channels where id=p_channel for update;
 if not found or channel.is_locked or not public.community_is_member(p_channel)
   or channel.kind='announcements' then raise exception 'Replies not permitted';end if;
 select * into parent from public.community_messages where id=p_parent and channel_id=p_channel;
 if not found or parent.hidden_at is not null then raise exception 'Original message unavailable';end if;
 if public.community_is_blocked(parent.author_id) then raise exception 'Cannot reply to blocked member';end if;
 if exists(select 1 from public.community_mutes where channel_id=p_channel and user_id=auth.uid()
   and muted_until>now()) then raise exception 'Messaging temporarily unavailable';end if;
 if exists(select 1 from public.community_messages where channel_id=p_channel and author_id=auth.uid()
   and created_at>now()-interval '20 seconds') then raise exception 'Please allow 20 seconds between messages';end if;
 insert into public.community_messages(channel_id,author_id,body,reply_to_id)
 values(p_channel,auth.uid(),btrim(p_body),p_parent) returning id into result;
 return result;
end; $$;
revoke all on function public.community_reply(uuid,uuid,text) from public,anon;
grant execute on function public.community_reply(uuid,uuid,text) to authenticated;

create or replace function public.community_toggle_prayer(p_message uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare m public.community_messages%rowtype;removed integer;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 select * into m from public.community_messages where id=p_message;
 if not found or m.hidden_at is not null or not public.community_is_member(m.channel_id)
   or not exists(select 1 from public.community_channels where id=m.channel_id and kind='prayer')
 then raise exception 'Prayer acknowledgement unavailable';end if;
 delete from public.community_prayer_support where message_id=p_message and user_id=auth.uid();
 get diagnostics removed=row_count;
 if removed>0 then return false;end if;
 insert into public.community_prayer_support(message_id,user_id) values(p_message,auth.uid());
 return true;
end; $$;
revoke all on function public.community_toggle_prayer(uuid) from public,anon;
grant execute on function public.community_toggle_prayer(uuid) to authenticated;

create or replace function public.community_prayer_counts(p_channel uuid)
returns table(message_id uuid,support_count bigint) language plpgsql stable security definer set search_path=''
as $$
begin
 if auth.uid() is null or not public.community_is_member(p_channel) then
 raise exception 'Channel membership required';end if;
 return query
 select p.message_id,count(*)::bigint from public.community_prayer_support p
 join public.community_messages m on m.id=p.message_id
 where m.channel_id=p_channel and m.hidden_at is null
 group by p.message_id;
end; $$;
revoke all on function public.community_prayer_counts(uuid) from public,anon;
grant execute on function public.community_prayer_counts(uuid) to authenticated;
