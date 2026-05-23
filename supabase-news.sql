-- News items aggregated from external RSS sources every 2 hours via GitHub Actions.
create table if not exists news_items (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  title text not null,
  url text not null unique,
  summary text,
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);

create index if not exists news_items_published_idx on news_items (published_at desc nulls last);
create index if not exists news_items_source_idx on news_items (source);

alter table news_items enable row level security;

drop policy if exists "news_read" on news_items;
create policy "news_read" on news_items for select using (auth.uid() is not null);

-- No INSERT/UPDATE/DELETE policies — only service_role (bypasses RLS) can write.

alter publication supabase_realtime add table news_items;
