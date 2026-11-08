-- Atomic member operations. Review with the church's DBA before deploying.
alter table public.pastoral_bookings drop constraint if exists pastoral_bookings_slot_id_key;

create or replace function public.register_for_event(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_event public.events%rowtype;
  v_count integer;
  v_id uuid;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select * into v_event from public.events where id=p_event_id for update;
  if not found or not v_event.published or not v_event.registration_enabled then
    raise exception 'Event is not available for registration';
  end if;
  if v_event.starts_at <= now() then raise exception 'Event has already begun'; end if;
  if exists(select 1 from public.event_registrations where event_id=p_event_id and user_id=v_user and status='registered') then
    raise exception 'Already registered';
  end if;
  select count(*) into v_count from public.event_registrations where event_id=p_event_id and status='registered';
  if v_event.capacity is not null and v_count >= v_event.capacity then
    raise exception 'Event is full';
  end if;
  insert into public.event_registrations(event_id,user_id,status)
  values(p_event_id,v_user,'registered')
  on conflict(event_id,user_id) do update set status='registered'
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.book_pastoral_slot(p_slot_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_slot public.pastoral_slots%rowtype;
  v_id uuid;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select * into v_slot from public.pastoral_slots where id=p_slot_id for update;
  if not found or not v_slot.available or v_slot.starts_at <= now() then
    raise exception 'Slot is not available';
  end if;
  if exists(select 1 from public.pastoral_bookings where slot_id=p_slot_id and cancelled_at is null) then
    raise exception 'Slot is already booked';
  end if;
  insert into public.pastoral_bookings(slot_id,user_id) values(p_slot_id,v_user) returning id into v_id;
  update public.pastoral_slots set available=false where id=p_slot_id;
  return v_id;
end; $$;

revoke all on function public.register_for_event(uuid) from public, anon;
revoke all on function public.book_pastoral_slot(uuid) from public, anon;
grant execute on function public.register_for_event(uuid) to authenticated;
grant execute on function public.book_pastoral_slot(uuid) to authenticated;

-- Limit profile data mutation: public email is a user-provided contact, not an auth credential.
-- A separate trusted server process must manage staff invitations, moderation, payments and migrations.
