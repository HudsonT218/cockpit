-- ============================================================
-- Migration: google_event_id on time_blocks
-- Links a Cockpit time block to its mirrored Google Calendar
-- event so updates and deletes can sync. Nullable because
-- pre-existing blocks won't have one until they're edited.
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================

alter table public.time_blocks
  add column if not exists google_event_id text;
