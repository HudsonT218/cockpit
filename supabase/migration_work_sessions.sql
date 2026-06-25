-- ============================================================
-- Migration: per-project hour tracking
-- ============================================================
-- Adds an opt-in `track_hours` flag to projects and a work_sessions
-- table for clock-in / clock-out time logs (one row per session;
-- ended_at null = currently clocked in).
--
-- Safe to re-run.
-- ============================================================

-- 1. Opt-in flag on projects.
alter table public.projects
  add column if not exists track_hours boolean not null default false;

-- 2. Work sessions (clock-in / clock-out logs).
create table if not exists public.work_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  started_at  timestamptz not null,
  ended_at    timestamptz,           -- null = currently clocked in (open)
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists work_sessions_user_idx    on public.work_sessions(user_id);
create index if not exists work_sessions_project_idx on public.work_sessions(user_id, project_id);

alter table public.work_sessions enable row level security;

drop policy if exists "owner crud work_sessions" on public.work_sessions;
create policy "owner crud work_sessions" on public.work_sessions
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);
