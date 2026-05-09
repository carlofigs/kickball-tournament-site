-- =============================================================================
-- Per-head-ref PIN
-- =============================================================================
-- Replaces the single shared "ref" PIN with one PIN per head-eligible
-- ref. The organiser edits PINs in the Roster table on the Refs page.
--
-- 4-digit numeric to match the organiser + line-ref PINs. Stored as
-- text (Postgres has no fixed-width PIN type) with a leading-zero-
-- preserving lpad on the seed so "0042" stays "0042".
--
-- Auto-seeds a random 4-digit PIN for any head-eligible ref that
-- doesn't already have one, so the live site is sign-in-ready right
-- after this migration runs. Organiser can edit any PIN to something
-- more memorable from the Refs page.
--
-- HOW TO RUN: paste into Supabase Studio → SQL Editor → Run.
-- Idempotent — re-running is safe.
--
-- IF YOU RAN AN EARLIER 6-CHAR-HEX VERSION: this seed only fills
-- empty PINs (`where pin is null`), so it WON'T rewrite the hex
-- PINs you got. Either edit them in the Refs roster table, or run:
--    update public.refs set pin = null where head_eligible = true;
-- and then re-run this file to reseed as 4-digit numeric.
-- =============================================================================

alter table public.refs
  add column if not exists pin text;

update public.refs
set pin = lpad(floor(random() * 10000)::text, 4, '0')
where tournament_id = 'summer-2026'
  and head_eligible = true
  and pin is null;
