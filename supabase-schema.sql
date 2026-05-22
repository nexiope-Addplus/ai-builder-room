create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  goal text not null default '오늘의 목표 미정',
  category text not null default 'Vibe Coding',
  status text not null default '질문 가능',
  tools text not null default '도구 미지정',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  capacity integer not null default 8 check (capacity > 0 and capacity <= 50),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  updated_at timestamptz not null default now()
);

create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  help_type text not null,
  tools text,
  body text not null,
  solved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  tools text,
  body text not null,
  solved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.showcases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  tools text,
  url text,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.help_requests enable row level security;
alter table public.questions enable row level security;
alter table public.showcases enable row level security;
alter table public.chats enable row level security;

drop policy if exists "profiles are visible to signed-in users" on public.profiles;
create policy "profiles are visible to signed-in users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "users create their own profile" on public.profiles;
create policy "users create their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "rooms are visible to signed-in users" on public.rooms;
create policy "rooms are visible to signed-in users"
  on public.rooms for select
  to authenticated
  using (true);

drop policy if exists "signed-in users create rooms" on public.rooms;
create policy "signed-in users create rooms"
  on public.rooms for insert
  to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "room creators update rooms" on public.rooms;
create policy "room creators update rooms"
  on public.rooms for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists "room members are visible to signed-in users" on public.room_members;
create policy "room members are visible to signed-in users"
  on public.room_members for select
  to authenticated
  using (true);

drop policy if exists "users join rooms as themselves" on public.room_members;
create policy "users join rooms as themselves"
  on public.room_members for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users move their own room seat" on public.room_members;
create policy "users move their own room seat"
  on public.room_members for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users leave their own room" on public.room_members;
create policy "users leave their own room"
  on public.room_members for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "help requests are visible to signed-in users" on public.help_requests;
create policy "help requests are visible to signed-in users"
  on public.help_requests for select
  to authenticated
  using (true);

drop policy if exists "signed-in users create help requests" on public.help_requests;
create policy "signed-in users create help requests"
  on public.help_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "owners update their help requests" on public.help_requests;
create policy "owners update their help requests"
  on public.help_requests for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "questions are visible to signed-in users" on public.questions;
create policy "questions are visible to signed-in users"
  on public.questions for select
  to authenticated
  using (true);

drop policy if exists "signed-in users create questions" on public.questions;
create policy "signed-in users create questions"
  on public.questions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "owners update their questions" on public.questions;
create policy "owners update their questions"
  on public.questions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "showcases are visible to signed-in users" on public.showcases;
create policy "showcases are visible to signed-in users"
  on public.showcases for select
  to authenticated
  using (true);

drop policy if exists "signed-in users create showcases" on public.showcases;
create policy "signed-in users create showcases"
  on public.showcases for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "owners update their showcases" on public.showcases;
create policy "owners update their showcases"
  on public.showcases for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "chats are visible to signed-in users" on public.chats;
create policy "chats are visible to signed-in users"
  on public.chats for select
  to authenticated
  using (true);

drop policy if exists "signed-in users create chats" on public.chats;
create policy "signed-in users create chats"
  on public.chats for insert
  to authenticated
  with check (auth.uid() = user_id);

insert into public.rooms (name, category, capacity)
values
  ('B101호', 'Prompt / Workflow', 12),
  ('B102호', 'Prompt / Workflow', 12),
  ('B103호', 'Prompt / Workflow', 12),
  ('101호', 'Design', 8),
  ('102호', 'Design', 8),
  ('103호', 'Design', 8),
  ('201호', 'Vibe Coding', 8),
  ('202호', 'Vibe Coding', 8),
  ('203호', 'Vibe Coding', 8),
  ('301호', 'Automation', 8),
  ('302호', 'Automation', 8),
  ('303호', 'Automation', 8)
on conflict do nothing;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'rooms', 'room_members', 'help_requests', 'questions', 'showcases', 'chats']
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
