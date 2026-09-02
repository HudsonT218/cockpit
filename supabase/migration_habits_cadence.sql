-- ============================================================
-- Migration: habit cadence weekly / monthly
--   Drops 3x-per-week, adds monthly.
-- Existing x_per_week rows become custom (weekday list is kept).
-- Safe to re-run.
-- ============================================================

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'habits'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%cadence%'
  loop
    execute format('alter table public.habits drop constraint if exists %I', r.conname);
  end loop;
end $$;

update public.habits
  set cadence = 'custom'
  where cadence = 'x_per_week';

alter table public.habits drop constraint if exists habits_cadence_check;
alter table public.habits
  add constraint habits_cadence_check
  check (cadence in ('daily','weekdays','weekly','monthly','custom'));
