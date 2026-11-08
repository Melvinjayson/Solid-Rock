\set ON_ERROR_STOP on
-- Run after all project migrations. Assertions execute with RLS, not service_role.
grant select,insert,update,delete on all tables in schema public to authenticated;
grant usage,select on all sequences in schema public to authenticated;

-- Actor A joins the prayer room; joining a channel is not automatic.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000101';
do $$
declare prayer uuid; announcement uuid; mid uuid; denied boolean;
begin
 select id into prayer from public.community_channels where slug='prayer-circle';
 select id into announcement from public.community_channels where slug='church-updates';
 if prayer is null or announcement is null then raise exception 'Channel seeds absent';end if;
 denied:=false;
 begin
   perform public.community_post(prayer,'An unauthorised message');
 exception when others then denied:=true; end;
 if not denied then raise exception 'Non-member posted successfully';end if;
 perform public.community_join(prayer);
 mid:=public.community_post(prayer,'Please pray for our community');
 if mid is null then raise exception 'Member message not saved';end if;
 if (select count(*) from public.community_messages where channel_id=prayer)<>1 then
  raise exception 'Member cannot read their own message';end if;
 denied:=false;
 begin
  perform public.community_post(prayer,'Spam immediately after first message');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Message rate limit bypass';end if;
 denied:=false;
 begin
  perform public.community_post(announcement,'Pretend to be church staff');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Announcer permission bypass';end if;
 denied:=false;
 begin
  insert into public.community_messages(channel_id,author_id,body)
  values(prayer,auth.uid(),'Direct table insertion bypass');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Direct insert bypassed RPC';end if;
end $$;

-- Actor B is not a prayer room member, so their query cannot see actor A's post.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000102';
do $$
declare prayer uuid; target uuid; denied boolean;
begin
 select id into prayer from public.community_channels where slug='prayer-circle';
 if (select count(*) from public.community_messages where channel_id=prayer)<>0 then
   raise exception 'Message leaked to a non-member'; end if;
 denied:=false;
 begin
  select id into target from public.community_messages where channel_id=prayer;
  perform public.community_post(prayer,'Joining should be required');
 exception when others then denied:=true;end;
 if not denied then raise exception 'Outsider posted without joining';end if;
 perform public.community_join(prayer);
 perform public.community_post(prayer,'I will pray with you.');
 if (select count(*) from public.community_messages where channel_id=prayer)<>2 then
  raise exception 'Joined member cannot read the conversation';end if;
end $$;

-- Actor A blocks actor B; both sides should no longer see the other's posts.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000101';
select public.community_block('00000000-0000-4000-8000-000000000102');
do $$
declare prayer uuid;
begin
 select id into prayer from public.community_channels where slug='prayer-circle';
 if (select count(*) from public.community_messages where channel_id=prayer)<>1 then
  raise exception 'Blocked member message remains visible';end if;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000102';
do $$
declare prayer uuid;
begin
 select id into prayer from public.community_channels where slug='prayer-circle';
 if (select count(*) from public.community_messages where channel_id=prayer)<>1 then
  raise exception 'Block directionality leaked member post';end if;
end $$;

-- Moderator has not joined, but their special role can see report queue.
reset role;
insert into public.staff_roles(user_id,role) values
 ('00000000-0000-4000-8000-000000000103','pastor');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000103';
do $$
declare prayer uuid; mid uuid;
begin
 select id into prayer from public.community_channels where slug='prayer-circle';
 if (select count(*) from public.community_messages where channel_id=prayer)<>2 then
  raise exception 'Moderator cannot access needed posts';end if;
 select id into mid from public.community_messages where author_id='00000000-0000-4000-8000-000000000102' limit 1;
 perform public.community_hide(mid,'Removed for test safeguarding review');
 perform public.community_set_lock(prayer,true);
 if not (select is_locked from public.community_channels where id=prayer) then
  raise exception 'Moderator lock failed';end if;
end $$;

-- A blocked ordinary member cannot hide or unlock posts.
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000102';
do $$
declare prayer uuid; denied boolean;
begin
 select id into prayer from public.community_channels where slug='prayer-circle';
 denied:=false;
 begin perform public.community_set_lock(prayer,false);
 exception when others then denied:=true;end;
 if not denied then raise exception 'Ordinary member unlocked a channel';end if;
end $$;
reset role;
select 'Community auth, isolation, posting, blocks and moderation: PASS' as result;

-- Re-enable the prayer room and test real reply/acknowledgement operations.
reset role;
update public.community_messages set created_at=now()-interval '2 minutes'
where channel_id=(select id from public.community_channels where slug='prayer-circle');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000103';
select public.community_set_lock(id,false) from public.community_channels where slug='prayer-circle';
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000101';
do $$
declare cid uuid; mid uuid; rid uuid; counts bigint; active boolean;
begin
 select id into cid from public.community_channels where slug='prayer-circle';
 select id into mid from public.community_messages where author_id=auth.uid() and channel_id=cid limit 1;
 rid:=public.community_reply(cid,mid,'Thank you for praying together.');
 if rid is null then raise exception 'Thread reply failed';end if;
 active:=public.community_toggle_prayer(mid);
 if active is distinct from true then raise exception 'Prayer support was not added';end if;
 select support_count into counts from public.community_prayer_counts(cid) where message_id=mid;
 if counts<>1 then raise exception 'Prayer acknowledgement count incorrect';end if;
 active:=public.community_toggle_prayer(mid);
 if active is distinct from false then raise exception 'Prayer support was not removed';end if;
end $$;
reset role;
select 'Threaded replies and privacy-preserving prayer count: PASS' as result;
