-- ============================================================
-- Migration: Learning module
--   learning_tracks → milestones / daily_habits → habit_completions
-- ============================================================
-- Paste into the Supabase SQL Editor and run once. Safe to re-run
-- (idempotent: create-if-not-exists + drop/create policies).
-- Mirrors the tasks/routines idiom: every table owns user_id + direct
-- owner-only RLS. Depends on public.set_updated_at() (already in schema.sql).
-- ============================================================

-- ------------------------------------------------------------
-- learning_tracks
-- ------------------------------------------------------------
create table if not exists public.learning_tracks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  description      text,
  color_accent     text not null default 'amber'
                     check (color_accent in ('amber','rose','emerald','sky','violet')),
  started_on       date not null default current_date,
  target_finish_on date,
  archived         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists learning_tracks_user_id_idx on public.learning_tracks(user_id);
create index if not exists learning_tracks_active_idx  on public.learning_tracks(user_id, archived);

drop trigger if exists learning_tracks_updated_at on public.learning_tracks;
create trigger learning_tracks_updated_at
  before update on public.learning_tracks
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- milestones
-- ------------------------------------------------------------
create table if not exists public.milestones (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  track_id     uuid not null references public.learning_tracks(id) on delete cascade,
  title        text not null,
  description  text,
  order_index  int  not null,
  target_date  date,
  completed_at timestamptz,
  sub_items    jsonb not null default '[]'::jsonb, -- array of {id, label, done}
  created_at   timestamptz not null default now()
);

create index if not exists milestones_user_id_idx on public.milestones(user_id);
create index if not exists milestones_track_idx   on public.milestones(track_id, order_index);

-- ------------------------------------------------------------
-- daily_habits
-- ------------------------------------------------------------
create table if not exists public.daily_habits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  track_id       uuid not null references public.learning_tracks(id) on delete cascade,
  name           text not null,
  description    text,
  cadence        text not null
                   check (cadence in ('daily','mon_thu','mon_wed','sat_sun','sun','custom')),
  days_of_week   int[] not null default '{}', -- 0=Sun..6=Sat; used only when cadence='custom'
  target_minutes int,
  order_index    int  not null,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists daily_habits_user_id_idx on public.daily_habits(user_id);
create index if not exists daily_habits_track_idx   on public.daily_habits(track_id, order_index);

-- ------------------------------------------------------------
-- habit_completions  (one row per habit per day)
-- ------------------------------------------------------------
create table if not exists public.habit_completions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  habit_id      uuid not null references public.daily_habits(id) on delete cascade,
  completed_on  date not null,
  minutes_spent int,
  note          text,
  created_at    timestamptz not null default now(),
  unique (habit_id, completed_on) -- also covers the streak/heatmap scan
);

create index if not exists habit_completions_user_id_idx on public.habit_completions(user_id);

-- ============================================================
-- Row Level Security (owner-only CRUD, mirrors tasks/routines)
-- ============================================================
alter table public.learning_tracks   enable row level security;
alter table public.milestones         enable row level security;
alter table public.daily_habits       enable row level security;
alter table public.habit_completions  enable row level security;

drop policy if exists "owner crud learning_tracks" on public.learning_tracks;
create policy "owner crud learning_tracks" on public.learning_tracks
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

drop policy if exists "owner crud milestones" on public.milestones;
create policy "owner crud milestones" on public.milestones
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

drop policy if exists "owner crud daily_habits" on public.daily_habits;
create policy "owner crud daily_habits" on public.daily_habits
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

drop policy if exists "owner crud habit_completions" on public.habit_completions;
create policy "owner crud habit_completions" on public.habit_completions
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

-- ============================================================
-- Done.
-- ============================================================
