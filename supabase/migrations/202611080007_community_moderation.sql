-- Community moderation operations. Do not execute until reviewed on isolated staging.
-- Approved moderators: church pastor or super administrator roles only.
create or replace function public.community_is_blocked(p_author uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from public.community_blocks b
   where (b.blocker_id=auth.uid() and b.blocked_id=p_author)
      or (b.blocker_id=p_author and b.blocked_id=auth.uid()));
$$;
revoke all on function public.community_is_blocked(uuid) from public,anon;
grant execute on function public.community_is_blocked(uuid) to authenticated;
drop policy if exists "messages only for participants" on public.community_messages;
create policy "messages only for participants" on public.community_messages
 for select to authenticated using(
  (public.community_is_member(channel_id) or public.community_can_moderate())
  and (hidden_at is null or author_id=auth.uid() or public.community_can_moderate())
  and not public.community_is_blocked(author_id)
);

create or replace function public.community_mute(p_channel uuid,p_user uuid,p_minutes integer,p_reason text)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if not public.community_can_moderate() then raise exception 'Moderator role required'; end if;
 if p_user is null or p_minutes not between 1 and 10080
   or length(btrim(coalesce(p_reason,''))) < 3 then raise exception 'Invalid mute request'; end if;
 if not exists(select 1 from public.community_memberships where channel_id=p_channel and user_id=p_user)
 then raise exception 'Member is not in this channel'; end if;
 insert into public.community_mutes(user_id,channel_id,muted_until,reason)
 values(p_user,p_channel,now()+make_interval(mins=>p_minutes),left(p_reason,500))
 on conflict(user_id,channel_id) do update
 set muted_until=excluded.muted_until,reason=excluded.reason;
end; $$;

create or replace function public.community_set_lock(p_channel uuid,p_locked boolean)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if not public.community_can_moderate() then raise exception 'Moderator role required'; end if;
 update public.community_channels set is_locked=p_locked where id=p_channel;
end; $$;
revoke all on function public.community_mute(uuid,uuid,integer,text) from public,anon;
revoke all on function public.community_set_lock(uuid,boolean) from public,anon;
grant execute on function public.community_mute(uuid,uuid,integer,text) to authenticated;
grant execute on function public.community_set_lock(uuid,boolean) to authenticated;

-- Realtime Postgres Changes requires this table in the Supabase publication.
-- It remains RLS-authorized per member. Existing publications are not modified twice.
do $$
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime')
   and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
      and schemaname='public' and tablename='community_messages') then
   execute 'alter publication supabase_realtime add table public.community_messages';
 end if;
end; $$;

-- No client access is granted to messages of private channels unless joined.
-- Moderation log is the hidden_at/hidden_by/hidden_reason metadata on original posts.
-- Retention, appeals, response SLAs and trusted staff role provisioning remain operational gates.
