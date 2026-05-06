-- =============================================================================
-- ECKB Tournament — initial schema
-- =============================================================================
-- Two tables, both keyed on (tournament_id, game_id) so multiple
-- tournaments can share one database without a foreign key to a
-- tournaments table (the config stays in code; only mutable state
-- lives here).
--
-- Soft-auth model: RLS policies allow anon read+write. Anyone with
-- the publishable key (i.e. anyone who loads the site) can read and
-- write the tables. Same trust level as today's PIN gating; tighten
-- via Supabase Auth + role-aware policies when privacy matters.
--
-- HOW TO RUN: paste this whole file into Supabase Studio → SQL
-- Editor → New query → Run. Idempotent, so re-running is safe.
-- =============================================================================

-- ── Tables ──────────────────────────────────────────────────────────────────
create table if not exists public.game_scores (
  tournament_id text    not null,
  game_id       integer not null,
  score_a       integer,
  score_b       integer,
  updated_at    timestamptz not null default now(),
  primary key (tournament_id, game_id)
);

create table if not exists public.game_refs (
  tournament_id text    not null,
  game_id       integer not null,
  head          text,            -- ref id (matches Tournament.refs[*].id), nullable
  lines         jsonb   not null default '[]'::jsonb,  -- array of LineSlot: {ref}|{team}|null
  updated_at    timestamptz not null default now(),
  primary key (tournament_id, game_id)
);

-- Auto-bump updated_at on every UPDATE so subscribers can order events.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists touch_game_scores on public.game_scores;
create trigger touch_game_scores
  before update on public.game_scores
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_game_refs on public.game_refs;
create trigger touch_game_refs
  before update on public.game_refs
  for each row execute function public.touch_updated_at();

-- ── Row-level security (soft-auth) ──────────────────────────────────────────
alter table public.game_scores enable row level security;
alter table public.game_refs   enable row level security;

drop policy if exists "anon read game_scores"  on public.game_scores;
drop policy if exists "anon write game_scores" on public.game_scores;
drop policy if exists "anon read game_refs"    on public.game_refs;
drop policy if exists "anon write game_refs"   on public.game_refs;

create policy "anon read game_scores"
  on public.game_scores for select using (true);

create policy "anon write game_scores"
  on public.game_scores for all
  using (true) with check (true);

create policy "anon read game_refs"
  on public.game_refs for select using (true);

create policy "anon write game_refs"
  on public.game_refs for all
  using (true) with check (true);

-- ── Realtime publication ────────────────────────────────────────────────────
-- Add both tables to the supabase_realtime publication so clients can
-- subscribe to row changes. Wrapped in a DO block so re-running this
-- file doesn't error if they're already added.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_scores'
  ) then
    alter publication supabase_realtime add table public.game_scores;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_refs'
  ) then
    alter publication supabase_realtime add table public.game_refs;
  end if;
end $$;
