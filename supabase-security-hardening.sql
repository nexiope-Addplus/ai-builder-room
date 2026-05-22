-- Security hardening patch for AI Builder Room.
-- Run this once in Supabase SQL Editor after supabase-schema.sql.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_text_bounds') then
    alter table public.profiles
      add constraint profiles_text_bounds
      check (
        char_length(btrim(nickname)) between 1 and 40
        and char_length(btrim(goal)) between 1 and 160
        and char_length(btrim(category)) between 1 and 40
        and char_length(btrim(status)) between 1 and 40
        and char_length(coalesce(tools, '')) <= 240
      ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_allowed_values') then
    alter table public.profiles
      add constraint profiles_allowed_values
      check (
        category in ('Vibe Coding', 'App Building', 'Design', 'Automation', 'Prompt / Workflow', 'Showcase')
        and status in ('집중 중', '질문 가능', '도움 필요', '커피챗 가능', '쉬는 중', '데모 준비 중')
      ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'rooms_text_bounds') then
    alter table public.rooms
      add constraint rooms_text_bounds
      check (
        char_length(btrim(name)) between 1 and 80
        and category in ('Vibe Coding', 'App Building', 'Design', 'Automation', 'Prompt / Workflow', 'Showcase')
      ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'help_requests_text_bounds') then
    alter table public.help_requests
      add constraint help_requests_text_bounds
      check (
        char_length(btrim(title)) between 1 and 120
        and char_length(btrim(body)) between 1 and 2000
        and char_length(coalesce(tools, '')) <= 240
        and category in ('Vibe Coding', 'App Building', 'Design', 'Automation', 'Prompt / Workflow', 'Showcase')
        and help_type in ('디버깅', '프롬프트 개선', '구조 설계', '디자인 피드백', '자동화 로직', '배포/연동')
      ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'questions_text_bounds') then
    alter table public.questions
      add constraint questions_text_bounds
      check (
        char_length(btrim(title)) between 1 and 120
        and char_length(btrim(body)) between 1 and 2000
        and char_length(coalesce(tools, '')) <= 240
        and category in ('Vibe Coding', 'App Building', 'Design', 'Automation', 'Prompt / Workflow', 'Showcase')
      ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'showcases_text_bounds') then
    alter table public.showcases
      add constraint showcases_text_bounds
      check (
        char_length(btrim(title)) between 1 and 120
        and char_length(btrim(body)) between 1 and 2000
        and char_length(coalesce(tools, '')) <= 240
        and char_length(coalesce(url, '')) <= 500
        and (url is null or url = '' or url ~* '^https?://[^[:space:]]+$')
        and category in ('Vibe Coding', 'App Building', 'Design', 'Automation', 'Prompt / Workflow', 'Showcase')
      ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'chats_body_bounds') then
    alter table public.chats
      add constraint chats_body_bounds
      check (char_length(btrim(body)) between 1 and 240) not valid;
  end if;
end $$;

create or replace function public.enforce_room_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  room_capacity integer;
  occupant_count integer;
begin
  select capacity
    into room_capacity
    from public.rooms
    where id = new.room_id
    for update;

  if room_capacity is null then
    raise exception 'room does not exist' using errcode = '23503';
  end if;

  select count(*)
    into occupant_count
    from public.room_members
    where room_id = new.room_id
      and user_id <> new.user_id;

  if occupant_count >= room_capacity then
    raise exception 'room is full' using errcode = '23514';
  end if;

  new.updated_at = now();
  return new;
end $$;

drop trigger if exists enforce_room_capacity_on_room_members on public.room_members;
create trigger enforce_room_capacity_on_room_members
  before insert or update of room_id on public.room_members
  for each row
  execute function public.enforce_room_capacity();

drop policy if exists "signed-in users create rooms" on public.rooms;
create policy "signed-in users create rooms"
  on public.rooms for insert
  to authenticated
  with check (auth.uid() = created_by);

create or replace function public.enforce_room_creation_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  created_count integer;
begin
  if new.created_by is null then
    return new;
  end if;

  select count(*)
    into created_count
    from public.rooms
    where created_by = new.created_by;

  if created_count >= 3 then
    raise exception 'room creation limit reached' using errcode = '23514';
  end if;

  return new;
end $$;

drop trigger if exists enforce_room_creation_limit_on_rooms on public.rooms;
create trigger enforce_room_creation_limit_on_rooms
  before insert on public.rooms
  for each row
  execute function public.enforce_room_creation_limit();
