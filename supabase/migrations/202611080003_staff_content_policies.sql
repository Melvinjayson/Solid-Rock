-- Staff operations. Roles can only be assigned out-of-band by trusted administrators.
-- All browser writes remain enforced by RLS. No service-role secret in Next.js client.
create policy "content admins create announcements" on public.announcements
 for insert to authenticated with check (public.has_role(array['content_admin','super_admin']::public.member_role[]));
create policy "content admins update announcements" on public.announcements
 for update to authenticated using (public.has_role(array['content_admin','super_admin']::public.member_role[]))
 with check(public.has_role(array['content_admin','super_admin']::public.member_role[]));

create policy "content admins create sermons" on public.sermons
 for insert to authenticated with check (public.has_role(array['content_admin','super_admin']::public.member_role[]));
create policy "content admins update sermons" on public.sermons
 for update to authenticated using(public.has_role(array['content_admin','super_admin']::public.member_role[]))
 with check(public.has_role(array['content_admin','super_admin']::public.member_role[]));

create policy "content admins create events" on public.events
 for insert to authenticated with check (public.has_role(array['content_admin','super_admin']::public.member_role[]));
create policy "content admins update events" on public.events
 for update to authenticated using(public.has_role(array['content_admin','super_admin']::public.member_role[]))
 with check(public.has_role(array['content_admin','super_admin']::public.member_role[]));

create policy "group admins create groups" on public.groups
 for insert to authenticated with check(public.has_role(array['group_leader','super_admin']::public.member_role[]));
create policy "group admins update groups" on public.groups
 for update to authenticated using(public.has_role(array['group_leader','super_admin']::public.member_role[]))
 with check(public.has_role(array['group_leader','super_admin']::public.member_role[]));

create policy "ministry admins create opportunities" on public.volunteer_opportunities
 for insert to authenticated with check(public.has_role(array['ministry_leader','super_admin']::public.member_role[]));
create policy "ministry admins update opportunities" on public.volunteer_opportunities
 for update to authenticated using(public.has_role(array['ministry_leader','super_admin']::public.member_role[]))
 with check(public.has_role(array['ministry_leader','super_admin']::public.member_role[]));

create policy "pastors create availability" on public.pastoral_slots
 for insert to authenticated with check(
 pastor_id=auth.uid() and public.has_role(array['pastor','super_admin']::public.member_role[])
 );
create policy "pastors modify own availability" on public.pastoral_slots
 for update to authenticated using(
 pastor_id=auth.uid() and public.has_role(array['pastor','super_admin']::public.member_role[])
 ) with check(pastor_id=auth.uid());

-- No UPDATE or DELETE rights are granted on giving_ledger, audit_events or prayer_requests.
-- Prayer status changes must occur via a separately reviewed care-team RPC.
-- Content publishing remains a church authorisation decision, not automatic model output.
