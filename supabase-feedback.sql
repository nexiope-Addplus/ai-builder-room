-- Feedback: anyone authenticated can submit. Only admins can read/update/delete.
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) > 0 and char_length(body) <= 1000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','wontfix')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table feedback enable row level security;

drop policy if exists "feedback_insert" on feedback;
create policy "feedback_insert" on feedback for insert
  with check (auth.uid() is not null and (user_id is null or user_id = auth.uid()));

drop policy if exists "feedback_select_admin" on feedback;
create policy "feedback_select_admin" on feedback for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "feedback_update_admin" on feedback;
create policy "feedback_update_admin" on feedback for update
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "feedback_delete_admin" on feedback;
create policy "feedback_delete_admin" on feedback for delete
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

alter publication supabase_realtime add table feedback;
