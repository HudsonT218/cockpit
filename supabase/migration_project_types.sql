-- ============================================================
-- Migration: custom project types
-- ============================================================
-- Frees projects.type from the project_type enum so user-defined
-- type slugs are allowed, and adds a per-user project_types table
-- for custom types. Built-in types (code/business/life) stay
-- code-side constants and are NOT stored here.
--
-- Safe to re-run.
-- ============================================================

-- 1. Convert projects.type from the enum to free text.
alter table public.projects
  alter column type type text using type::text;
alter table public.projects
  alter column type set default 'code';
-- (the project_type enum is left defined-but-unused; dropping is optional)

-- 2. Custom types table.
create table if not exists public.project_types (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  slug        text not null,
  order_index int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists project_types_user_idx on public.project_types(user_id);

alter table public.project_types enable row level security;

drop policy if exists "owner crud project_types" on public.project_types;
create policy "owner crud project_types" on public.project_types
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
