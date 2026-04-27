-- ============================================================
-- Migration: google_refresh_token on profiles
-- Stores the long-lived Google refresh token so the access
-- token can be refreshed via /api/refresh-google-token without
-- forcing a re-sign-in every hour.
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================

alter table public.profiles
  add column if not exists google_refresh_token text;
