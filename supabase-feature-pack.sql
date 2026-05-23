-- Feature pack: attendance streak, Q&A answers, news user state.

-- 1) Streak columns on profiles
alter table profiles add column if not exists streak_days integer not null default 0;
alter table profiles add column if not exists last_visit_date date;

-- 2) Q&A answers
create table if not exists question_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) > 0 and char_length(body) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists qa_question_idx on question_answers(question_id, created_at);

alter table question_answers enable row level security;
drop policy if exists "qa_select" on question_answers;
create policy "qa_select" on question_answers for select using (auth.uid() is not null);
drop policy if exists "qa_insert" on question_answers;
create policy "qa_insert" on question_answers for insert with check (auth.uid() = user_id);
drop policy if exists "qa_delete_own" on question_answers;
create policy "qa_delete_own" on question_answers for delete using (auth.uid() = user_id);
alter publication supabase_realtime add table question_answers;

-- 3) News user state (bookmark + read)
create table if not exists news_user_state (
  user_id uuid references auth.users(id) on delete cascade,
  news_id uuid references news_items(id) on delete cascade,
  bookmarked boolean not null default false,
  read_at timestamptz,
  primary key (user_id, news_id)
);

alter table news_user_state enable row level security;
drop policy if exists "nus_select_own" on news_user_state;
create policy "nus_select_own" on news_user_state for select using (auth.uid() = user_id);
drop policy if exists "nus_modify_own" on news_user_state;
create policy "nus_modify_own" on news_user_state for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter publication supabase_realtime add table news_user_state;
