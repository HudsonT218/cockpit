-- ============================================================
-- Migration: add description to tasks
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================

alter table public.tasks
  add column if not exists description text;
