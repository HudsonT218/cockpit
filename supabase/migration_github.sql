-- ============================================================
-- Migration: add github_token column to profiles
-- Run this in Supabase SQL Editor. Safe to re-run.
-- ============================================================

alter table public.profiles
  add column if not exists github_token text;

-- RLS is already on profiles with owner-only policy,
-- so the token is automatically locked to its user.
