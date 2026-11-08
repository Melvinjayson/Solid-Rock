-- Security hardening for MVP release review.
-- All event registration mutations MUST use the transactional RPCs.
-- Earlier direct client policies allowed bypassing event capacity when resuming a cancelled record.
drop policy if exists "registrations own insert" on public.event_registrations;
drop policy if exists "registrations own cancel" on public.event_registrations;

-- Group leaders are scoped to groups they are actually assigned to, not every group.
create table if not exists public.group_leader_assignments (
 group_id uuid not null references public.groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 primary key (group_id,user_id)
);
alter table public.group_leader_assignments enable row level security;
create policy "group leader reads own assignment" on public.group_leader_assignments
 for select to authenticated using(user_id=auth.uid() or public.has_role(array['super_admin']::public.member_role[]));
drop policy if exists "group memberships own" on public.group_memberships;
create policy "member or assigned leader reads group memberships" on public.group_memberships
 for select to authenticated using (
   user_id=auth.uid()
   or public.has_role(array['super_admin']::public.member_role[])
   or exists(select 1 from public.group_leader_assignments a
              where a.group_id=group_memberships.group_id and a.user_id=auth.uid())
 );

-- Ministry leaders are scoped to their assigned opportunity only.
create table if not exists public.ministry_leader_assignments (
 opportunity_id uuid not null references public.volunteer_opportunities(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 primary key (opportunity_id,user_id)
);
alter table public.ministry_leader_assignments enable row level security;
create policy "ministry leader reads own assignment" on public.ministry_leader_assignments
 for select to authenticated using(user_id=auth.uid() or public.has_role(array['super_admin']::public.member_role[]));
drop policy if exists "volunteer interests own read" on public.volunteer_interests;
create policy "member or assigned ministry leader reads volunteer interests" on public.volunteer_interests
 for select to authenticated using (
   user_id=auth.uid()
   or public.has_role(array['super_admin']::public.member_role[])
   or exists(select 1 from public.ministry_leader_assignments a
              where a.opportunity_id=volunteer_interests.opportunity_id and a.user_id=auth.uid())
 );

-- Assignment writes must use a trusted service after verifying staff authority and church approval.
-- No insert/update/delete policies for clients on leader assignment tables.
