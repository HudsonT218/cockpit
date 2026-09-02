-- ============================================================
-- Migration: Life Habits module
--   habit_categories → habits → habit_logs
-- ============================================================
-- Paste into the Supabase SQL Editor and run once. Safe to re-run
-- (idempotent: create-if-not-exists + drop/create policies).
-- Separate from Learning's daily_habits / habit_completions.
-- Depends on public.set_updated_at() (already in schema.sql).
-- ============================================================

-- ------------------------------------------------------------
-- habit_categories
-- ------------------------------------------------------------
create table if not exists public.habit_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  slug        text not null,
  accent      text not null default 'amber'
                check (accent in ('amber','rose','emerald','sky','violet')),
  order_index int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists habit_categories_user_idx on public.habit_categories(user_id);

-- ------------------------------------------------------------
-- habits  (standalone life habits; not learning daily_habits)
-- ------------------------------------------------------------
create table if not exists public.habits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  category_id    uuid references public.habit_categories(id) on delete set null,
  name           text not null,
  why            text,
  cadence        text not null default 'daily'
                   check (cadence in ('daily','weekdays','weekly','monthly','custom')),
  days_of_week   int[] not null default '{}', -- 0=Sun..6=Sat
  times_per_week int,
  reminder_at    time,
  started_on     date not null default current_date,
  archived       boolean not null default false,
  order_index    int  not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists habits_user_id_idx on public.habits(user_id);
create index if not exists habits_user_archived_idx on public.habits(user_id, archived);

drop trigger if exists habits_updated_at on public.habits;
create trigger habits_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- habit_logs  (one row per habit per day)
-- ------------------------------------------------------------
create table if not exists public.habit_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  habit_id     uuid not null references public.habits(id) on delete cascade,
  completed_on date not null,
  created_at   timestamptz not null default now(),
  unique (habit_id, completed_on)
);

create index if not exists habit_logs_user_id_idx on public.habit_logs(user_id);
create index if not exists habit_logs_habit_date_idx on public.habit_logs(habit_id, completed_on);

-- ============================================================
-- Row Level Security (owner-only CRUD)
-- ============================================================
alter table public.habit_categories enable row level security;
alter table public.habits           enable row level security;
alter table public.habit_logs       enable row level security;

drop policy if exists "owner crud habit_categories" on public.habit_categories;
create policy "owner crud habit_categories" on public.habit_categories
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

drop policy if exists "owner crud habits" on public.habits;
create policy "owner crud habits" on public.habits
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

drop policy if exists "owner crud habit_logs" on public.habit_logs;
create policy "owner crud habit_logs" on public.habit_logs
  for all using (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

-- ============================================================
-- Done.
-- ============================================================
