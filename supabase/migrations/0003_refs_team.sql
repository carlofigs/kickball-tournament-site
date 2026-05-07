-- =============================================================================
-- ECKB Tournament — refs.team column
-- =============================================================================
-- Adds an optional team affiliation to each ref. When a ref has a team,
-- they're filtered out of assignment dropdowns at any time slot where
-- their team is playing — same constraint we already enforce on the
-- volunteer-team option, just applied to the named roster.
--
-- Nullable: refs without a team behave exactly as before.
--
-- HOW TO RUN: paste into Supabase Studio → SQL Editor → New query →
-- Run. Idempotent.
-- =============================================================================

alter table public.refs
  add column if not exists team text;
