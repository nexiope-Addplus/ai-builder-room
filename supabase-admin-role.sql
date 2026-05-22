-- Admin role support for AI Builder Room.
-- Adds profiles.role and admin-can-delete RLS policies for user-generated content.
-- Run this once in Supabase SQL Editor after supabase-schema.sql and supabase-security-hardening.sql.
-- After running, promote the first admin manually:
--   update public.profiles set role = 'admin' where id = '<auth.users.id of the admin account>';
-- To find the id: select id, email from auth.users where email = 'nexiope@gmail.com';

alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_allowed') then
    alter table public.profiles
      add constraint profiles_role_allowed
      check (role in ('user', 'admin')) not valid;
  end if;
end $$;

-- Validate the role check against existing data so the constraint applies to all rows,
-- not just new writes. Will only succeed if every existing row has role in ('user','admin').
alter table public.profiles validate constraint profiles_role_allowed;

-- Block client-side privilege escalation at INSERT time. Without this, a freshly
-- signed-in user could craft an upsert payload with role='admin' on first profile
-- creation since the INSERT RLS only verified auth.uid() = id.
drop policy if exists "users create their own profile" on public.profiles;
create policy "users create their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id and role = 'user');

-- Block self-elevation: users can update their own profile fields but not the role.
drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

-- Admins may update any profile (including role changes).
drop policy if exists "admins update any profile" on public.profiles;
create policy "admins update any profile"
  on public.profiles for update
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Admin delete policies for moderation. Owner-delete is already implicit via on-cascade
-- when their auth.users row is deleted; for soft-moderation we let admins delete any row.
drop policy if exists "admins delete any chat" on public.chats;
create policy "admins delete any chat"
  on public.chats for delete
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

drop policy if exists "admins delete any help request" on public.help_requests;
create policy "admins delete any help request"
  on public.help_requests for delete
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

drop policy if exists "admins delete any question" on public.questions;
create policy "admins delete any question"
  on public.questions for delete
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

drop policy if exists "admins delete any showcase" on public.showcases;
create policy "admins delete any showcase"
  on public.showcases for delete
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');
