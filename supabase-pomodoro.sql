-- Room-synced pomodoro: one active timer per room, shared across all members.
create table if not exists room_pomodoros (
  room_id uuid primary key references rooms(id) on delete cascade,
  mode text not null check (mode in ('focus','break','idle')) default 'idle',
  started_at timestamptz,
  duration_seconds integer not null default 1500,
  started_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table room_pomodoros enable row level security;

drop policy if exists "pomo_select" on room_pomodoros;
create policy "pomo_select" on room_pomodoros for select using (true);

drop policy if exists "pomo_insert" on room_pomodoros;
create policy "pomo_insert" on room_pomodoros for insert
  with check (auth.uid() is not null);

drop policy if exists "pomo_update" on room_pomodoros;
create policy "pomo_update" on room_pomodoros for update
  using (auth.uid() is not null);

drop policy if exists "pomo_delete" on room_pomodoros;
create policy "pomo_delete" on room_pomodoros for delete
  using (auth.uid() is not null);

-- Realtime publication
alter publication supabase_realtime add table room_pomodoros;
