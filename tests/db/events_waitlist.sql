\set ON_ERROR_STOP on
-- Run in the same isolated CI database AFTER community_rls.sql, with fixture users.
reset role;
insert into public.events(id,title,description,starts_at,ends_at,capacity,registration_enabled,published)
values('22222222-2222-4222-8222-222222222222','CI adult study gathering','Synthetic test only',
 now()+interval '1 hour',now()+interval '3 hours',1,true,true)
on conflict do nothing;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000101';
do $$
declare x public.registration_status;
begin
 x:=public.register_or_waitlist('22222222-2222-4222-8222-222222222222',false);
 if x<>'registered' then raise exception 'First seat not issued';end if;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000102';
do $$
declare x public.registration_status;denied boolean:=false;
begin
 begin perform public.register_or_waitlist('22222222-2222-4222-8222-222222222222',false);
 exception when others then denied:=true;end;
 if not denied then raise exception 'Full event admitted ordinary registration';end if;
 x:=public.register_or_waitlist('22222222-2222-4222-8222-222222222222',true);
 if x<>'waitlisted' then raise exception 'Explicit waitlist not respected';end if;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000101';
select public.cancel_event_registration(id) from public.event_registrations
where event_id='22222222-2222-4222-8222-222222222222'
and user_id=auth.uid();
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000102';
do $$
declare rid uuid; denied boolean:=false;
begin
 select id into rid from public.event_registrations where
 event_id='22222222-2222-4222-8222-222222222222' and user_id=auth.uid()
 and status='registered';
 if rid is null then raise exception 'Waitlist was not promoted after cancellation';end if;
 begin perform public.checkin_event_registration(rid);
 exception when others then denied:=true;end;
 if not denied then raise exception 'Ordinary attendee can perform staff check-in';end if;
end $$;
reset role;
insert into public.event_staff_assignments(event_id,user_id)
values('22222222-2222-4222-8222-222222222222','00000000-0000-4000-8000-000000000103');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000103';
do $$
declare rid uuid;a timestamptz;b timestamptz;
begin
 select id into rid from public.event_registrations where
 event_id='22222222-2222-4222-8222-222222222222' and status='registered';
 a:=public.checkin_event_registration(rid);
 b:=public.checkin_event_registration(rid);
 if a is null or a is distinct from b then raise exception 'Staff check-in not idempotent';end if;
 if (select count(*) from public.event_checkins where event_id='22222222-2222-4222-8222-222222222222')<>1 then
 raise exception 'Duplicate attendance recorded';end if;
end $$;
reset role;
select 'Event waitlist/cancellation/staff check-in: PASS' as result;
