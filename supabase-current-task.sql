-- Current task: builders can share a one-line "now working on" status that
-- updates more frequently than the daily goal.
alter table profiles add column if not exists current_task text default '';
