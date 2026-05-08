<div align="center">

# Tournament Site

*Single-day kickball tournament tracker — schedule, bracket, standings, ref assignments. Phones-at-the-fields friendly.*

</div>

---

## Stack

| Layer        | Library                          |
|--------------|----------------------------------|
| UI framework | React 19                         |
| Language     | TypeScript (strict)              |
| Build        | Vite 6                           |
| Styling      | Tailwind CSS v3 + shadcn/ui      |
| State        | Zustand 5 + immer                |
| Routing      | React Router v7                  |
| Realtime DB  | Supabase                         |

## Develop

```bash
npm install
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build → dist/
npm run lint     # tsc --noEmit (type-check only)
npm run test     # Vitest one-shot
npm run preview  # Serve the built dist/ locally
```

## Deploy

Builds to `dist/` and is published to GitHub Pages via Actions on every push to `main`. The Vite `base` path matches the deploy URL prefix.

## Layout

```
src/
  pages/                # Route components (Home, Schedule, …)
  components/           # Reusable UI + layout (AppShell, PrideStripe, …)
  hooks/                # useInitialSync, useRealtimeSync
  lib/
    schemas.ts          # TS shape contracts — single source of truth
    tournament.ts       # Active tournament export
    tournaments/        # One TS file per tournament committed before each event
    refs.ts             # Ref assignment + permission helpers
    star.ts             # Star team selection (configurable tiebreakers)
    standings.ts        # Per-team current-standings computation
    sync.ts             # Supabase push helpers + sonner error coalescing
    utils.ts            # cn() helper for shadcn
  store/
    tournament.ts       # Zustand slice for scores / gameRefs / refs roster
    auth.ts             # Per-device PIN-gated role
    sync.ts             # Connection status + last-sync indicator
supabase/migrations/    # SQL run manually in the Supabase SQL editor
```

## Tournament config

Each tournament is a TS file in `src/lib/tournaments/` matching the `Tournament` shape from `lib/schemas.ts`. Switch the active one by changing `src/lib/tournament.ts`. Players don't browse past seasons in-app — the executive team keeps that record separately.

## Realtime sync

Three Supabase tables (`game_scores`, `game_refs`, `refs`) are read on mount and subscribed to via the realtime channel. Writes from any device propagate to all others within ~1s. Auth is soft-PIN per device — the PINs and ref roster live in the source bundle and are visible to anyone who views the page; suitable for tournament-day trust between organisers / refs / players who know each other.

## Tests

`npm test` runs the Vitest suite — covers the Star tiebreaker, ref-conflict computation, current-standings derivation, and the head-only score-edit rule. Tests gate every deploy via the GitHub Actions workflow.
