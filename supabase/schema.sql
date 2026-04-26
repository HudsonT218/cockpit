-- ============================================================
-- Cockpit Dashboard — Supabase Schema
-- ============================================================
-- Paste this entire file into Supabase SQL Editor and run it once.
-- Safe to re-run: uses idempotent patterns throughout.
-- ============================================================

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
do $$ begin
  create type project_type as enum ('code', 'business', 'life');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_state as enum ('active', 'on_hold', 'waiting', 'shipped', 'idea');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('todo', 'doing', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type energy_tag as enum ('deep', 'thinky', 'grunt', 'social');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recurrence as enum ('none', 'daily', 'weekly');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- Helper: updated_at trigger
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- projects
-- ============================================================
create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  type            project_type  not null default 'code',
  state           project_state not null default 'active',
  one_liner       text not null default '',
  accent_color    text not null default '#f59e0b',
  next_action     text,
  repo_url        text,
  live_url        text,
  stack           text[] not null default '{}',
  client          text,
  due_date        date,
  resume_note     text,
  last_touched_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists projects_user_id_idx   on public.projects(user_id);
create index if not exists projects_state_idx     on public.projects(user_id, state);
create index if not exists projects_touched_idx   on public.projects(user_id, last_touched_at desc);

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ============================================================
-- tasks
-- ============================================================
create table if not exists public.tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  project_id     uuid references public.projects(id) on delete set null,
  title          text not null,
  description    text,
  status         task_status not null default 'todo',
  energy_tag     energy_tag,
  time_estimate  int, -- minutes
  scheduled_for  date,
  recurrence     recurrence not null default 'none',
  due_date       date,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Ensure description column exists on pre-existing schemas
alter table public.tasks
  add column if not exists description text;

create index if not exists tasks_user_id_idx       on public.tasks(user_id);
create index if not exists tasks_project_id_idx    on public.tasks(project_id);
create index if not exists tasks_scheduled_for_idx on public.tasks(user_id, scheduled_for);
create index if not exists tasks_status_idx        on public.tasks(user_id, status);

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ============================================================
-- decisions
-- ============================================================
create table if not exists public.decisions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  date       date not null,
  what       text not null,
  why        text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists decisions_project_id_idx on public.decisions(project_id);
create index if not exists decisions_user_id_idx    on public.decisions(user_id);

-- ============================================================
-- time_blocks
-- ============================================================
create table if not exists public.time_blocks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references public.projects(id) on delete set null,
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  label       text not null,
  energy_tag  energy_tag,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists time_blocks_user_id_idx on public.time_blocks(user_id);
create index if not exists time_blocks_date_idx    on public.time_blocks(user_id, date);

drop trigger if exists time_blocks_updated_at on public.time_blocks;
create trigger time_blocks_updated_at
  before update on public.time_blocks
  for each row execute function public.set_updated_at();

-- ============================================================
-- time_block_tasks  (join: a block can hold multiple tasks)
-- ============================================================
create table if not exists public.time_block_tasks (
  block_id uuid not null references public.time_blocks(id) on delete cascade,
  task_id  uuid not null references public.tasks(id)       on delete cascade,
  primary key (block_id, task_id)
);

create index if not exists tbt_task_id_idx on public.time_block_tasks(task_id);

-- ============================================================
-- routines (recurring time-blocks, e.g. "Workout Mon/Wed/Fri 7-8a")
-- ============================================================
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  label text not null,
  start_time time not null,
  end_time time not null,
  days_of_week int[] not null default '{}',
  energy_tag energy_tag,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists routines_user_id_idx on public.routines(user_id);

drop trigger if exists routines_updated_at on public.routines;
create trigger routines_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

-- ============================================================
-- calendar_events
--   Mix of manually-added events and cached Google Calendar pulls.
--   external_id is the Google event id (null if added manually).
-- ============================================================
create table if not exists public.calendar_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  external_id text,
  title       text not null,
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  location    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, external_id)
);

create index if not exists calendar_events_date_idx on public.calendar_events(user_id, date);

drop trigger if exists calendar_events_updated_at on public.calendar_events;
create trigger calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- ============================================================
-- reflections (one per day)
-- ============================================================
create table if not exists public.reflections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  text       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists reflections_date_idx on public.reflections(user_id, date);

drop trigger if exists reflections_updated_at on public.reflections;
create trigger reflections_updated_at
  before update on public.reflections
  for each row execute function public.set_updated_at();

-- ============================================================
-- profiles (per-user settings)
-- ============================================================
create table if not exists public.profiles (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  display_name     text,
  focus_project_id uuid references public.projects(id) on delete set null,
  timezone         text not null default 'America/New_York',
  week_start       int  not null default 1, -- 0=sun, 1=mon
  github_token     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Ensure the column exists even on pre-existing schemas
alter table public.profiles
  add column if not exists github_token text;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.projects          enable row level security;
alter table public.tasks             enable row level security;
alter table public.decisions         enable row level security;
alter table public.time_blocks       enable row level security;
alter table public.time_block_tasks  enable row level security;
alter table public.routines          enable row level security;
alter table public.calendar_events   enable row level security;
alter table public.reflections       enable row level security;
alter table public.profiles          enable row level security;

-- Drop existing policies (idempotent re-run)
drop policy if exists "owner crud projects"   on public.projects;
drop policy if exists "owner crud tasks"      on public.tasks;
drop policy if exists "owner crud decisions"  on public.decisions;
drop policy if exists "owner crud blocks"     on public.time_blocks;
drop policy if exists "owner via block tbt"   on public.time_block_tasks;
drop policy if exists "owner crud calendar"   on public.calendar_events;
drop policy if exists "owner crud reflect"    on public.reflections;
drop policy if exists "owner crud profile"    on public.profiles;

-- Owner-only CRUD
create policy "owner crud projects" on public.projects
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

create policy "owner crud tasks" on public.tasks
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

create policy "owner crud decisions" on public.decisions
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

create policy "owner crud blocks" on public.time_blocks
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

drop policy if exists "owner crud routines" on public.routines;
create policy "owner crud routines" on public.routines
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

-- time_block_tasks inherits ownership through its parent block
create policy "owner via block tbt" on public.time_block_tasks
  for all using (
    exists (select 1 from public.time_blocks b
             where b.id = time_block_tasks.block_id and b.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.time_blocks b
             where b.id = time_block_tasks.block_id and b.user_id = auth.uid())
  );

create policy "owner crud calendar" on public.calendar_events
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

create policy "owner crud reflect" on public.reflections
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

create policy "owner crud profile" on public.profiles
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

-- ============================================================
-- Optional: enable Realtime on the tables you want live-syncing
-- (Run in Supabase Dashboard → Database → Publications, or:)
-- ============================================================
-- alter publication supabase_realtime add table public.projects;
-- alter publication supabase_realtime add table public.tasks;
-- alter publication supabase_realtime add table public.time_blocks;
-- alter publication supabase_realtime add table public.reflections;

-- ============================================================
-- Done.
-- Next steps:
--   1. Supabase Dashboard → Authentication → Providers → enable Google
--   2. Add your email to the allow list (Auth → Policies) if you want to
--      restrict signups to just you.
--   3. Copy your Project URL + anon key into the React app (.env)
-- ============================================================
