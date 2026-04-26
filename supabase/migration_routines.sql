-- ============================================================
-- Migration: routines (recurring time blocks)
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  label text not null,
  start_time time not null,
  end_time time not null,
  days_of_week int[] not null default '{}', -- 0=Sun..6=Sat
  energy_tag energy_tag,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists routines_user_id_idx on public.routines(user_id);

alter table public.routines enable row level security;

drop policy if exists "owner crud routines" on public.routines;
create policy "owner crud routines" on public.routines
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists routines_updated_at on public.routines;
create trigger routines_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();
