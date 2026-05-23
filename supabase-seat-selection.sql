-- Seat selection support for AI Builder Room.
-- Run this once in Supabase SQL Editor after the base schema.
-- This lets a user keep an exact seat position instead of being auto-sorted into A1.

alter table public.room_members
  add column if not exists seat_id text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'room_members_seat_id_allowed') then
    alter table public.room_members
      add constraint room_members_seat_id_allowed
      check (
        seat_id is null
        or seat_id in ('A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4')
      ) not valid;
  end if;
end $$;

alter table public.room_members validate constraint room_members_seat_id_allowed;

create unique index if not exists room_members_unique_room_seat
  on public.room_members (room_id, seat_id)
  where seat_id is not null;
