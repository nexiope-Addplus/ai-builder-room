-- Canonical 3 rooms per floor. Idempotent — safe to re-run.
-- B1 (Prompt / Workflow): 12-seat help desks
-- 1F (Design), 2F (Vibe Coding), 3F (Automation), 4F (Showcase): 8-seat rooms

insert into rooms (name, category, capacity)
select * from (values
  ('B101호', 'Prompt / Workflow', 12),
  ('B102호', 'Prompt / Workflow', 12),
  ('B103호', 'Prompt / Workflow', 12),
  ('101호',  'Design',            8),
  ('102호',  'Design',            8),
  ('103호',  'Design',            8),
  ('201호',  'Vibe Coding',       8),
  ('202호',  'Vibe Coding',       8),
  ('203호',  'Vibe Coding',       8),
  ('301호',  'Automation',        8),
  ('302호',  'Automation',        8),
  ('303호',  'Automation',        8),
  ('401호',  'Showcase',          8),
  ('402호',  'Showcase',          8),
  ('403호',  'Showcase',          8)
) as seed(name, category, capacity)
where not exists (
  select 1 from rooms r
  where r.category = seed.category and r.name = seed.name
);

-- Optional cleanup: keep only the canonical 3 per category by oldest created_at
delete from rooms
where id in (
  select id from (
    select id, row_number() over (partition by category order by created_at) as rn
    from rooms
  ) t
  where rn > 3
);
delete from room_members where room_id not in (select id from rooms);
