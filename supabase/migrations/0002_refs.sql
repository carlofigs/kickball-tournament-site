-- =============================================================================
-- ECKB Tournament — refs roster table
-- =============================================================================
-- Adds a `refs` table so the organiser can edit the ref roster from
-- inside the app (same trust + soft-auth model as the existing tables).
--
-- ID strategy: ref_id is a free-form text PK. CONFIG-seeded refs keep
-- the literal ids ('r1', 'r2', ...) so existing game_refs rows stay
-- linked. Refs added in-app use crypto.randomUUID() — collision-safe
-- for concurrent multi-device adds.
--
-- HOW TO RUN: paste into Supabase Studio → SQL Editor → New query →
-- Run. Idempotent.
-- =============================================================================

create table if not exists public.refs (
  tournament_id text    not null,
  ref_id        text    not null,
  name          text    not null,
  head_eligible boolean not null default false,
  updated_at    timestamptz not null default now(),
  primary key (tournament_id, ref_id)
);

drop trigger if exists touch_refs on public.refs;
create trigger touch_refs
  before update on public.refs
  for each row execute function public.touch_updated_at();

alter table public.refs enable row level security;

drop policy if exists "anon read refs"  on public.refs;
drop policy if exists "anon write refs" on public.refs;

create policy "anon read refs"
  on public.refs for select using (true);

create policy "anon write refs"
  on public.refs for all
  using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'refs'
  ) then
    alter publication supabase_realtime add table public.refs;
  end if;
end $$;
