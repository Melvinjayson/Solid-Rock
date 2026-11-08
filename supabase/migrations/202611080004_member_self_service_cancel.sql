-- Member self-service cancellation. Row locks prevent concurrent double booking.
create or replace function public.cancel_event_registration(p_registration_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
 v_user uuid := auth.uid();
 v_registration public.event_registrations%rowtype;
begin
 if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
 select * into v_registration from public.event_registrations where id=p_registration_id for update;
 if not found or v_registration.user_id<>v_user then raise exception 'Registration not found'; end if;
 if v_registration.status='cancelled' then return; end if;
 update public.event_registrations set status='cancelled' where id=p_registration_id;
end; $$;

create or replace function public.cancel_pastoral_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
 v_user uuid := auth.uid();
 v_booking public.pastoral_bookings%rowtype;
 v_start timestamptz;
begin
 if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
 select * into v_booking from public.pastoral_bookings where id=p_booking_id for update;
 if not found or v_booking.user_id<>v_user then raise exception 'Booking not found'; end if;
 if v_booking.cancelled_at is not null then return; end if;
 select starts_at into v_start from public.pastoral_slots where id=v_booking.slot_id for update;
 if v_start <= now() then raise exception 'Past appointments cannot be cancelled through the app'; end if;
 update public.pastoral_bookings set cancelled_at=now() where id=p_booking_id;
 update public.pastoral_slots set available=true where id=v_booking.slot_id;
end; $$;

revoke all on function public.cancel_event_registration(uuid) from public, anon;
revoke all on function public.cancel_pastoral_booking(uuid) from public, anon;
grant execute on function public.cancel_event_registration(uuid) to authenticated;
grant execute on function public.cancel_pastoral_booking(uuid) to authenticated;
