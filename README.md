<div align="center">

# ECKB Tournament Site

*Single-day tournament tracker for Emerald City Kickball — schedule, bracket, standings, ref assignments. Phones-at-the-fields friendly.*

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
| Realtime DB  | Supabase *(Phase 3)*             |

## Status

Currently in **Phase 1**: scaffolding done, placeholder pages render, Tailwind theme tokens live. Phases 2 and 3 (UI port + Supabase realtime sync) come next.

The original POC HTML is preserved at [`legacy/kickball-2026.html`](legacy/kickball-2026.html) — a single-file vanilla-JS version with the same features, kept as reference and a working artefact you can open from disk if anything breaks during the migration.

## Develop

```bash
npm install
npm run dev      # Vite dev server at http://localhost:5173/eckb-tournament-site/
npm run build    # tsc -b && vite build → dist/
npm run lint     # tsc --noEmit (type-check only)
npm run preview  # Serve the built dist/ locally
```

## Deploy

Builds to `dist/` and is published to GitHub Pages via Actions (Phase 4). Vite `base` is `/eckb-tournament-site/` to match the project Pages URL.

## Layout

```
src/
  pages/                # Route components (Home, Schedule, …)
  components/           # Reusable UI + layout (AppShell, PrideStripe, …)
  lib/
    schemas.ts          # TS shape contracts — single source of truth
    tournament.ts       # Active tournament export
    tournaments/        # One TS file per tournament committed before each event
    utils.ts            # cn() helper for shadcn
```

## Tournament config

Each tournament is a TS file in `src/lib/tournaments/` matching the `Tournament` shape from `lib/schemas.ts`. Switch the active one by changing `src/lib/tournament.ts`. Players don't browse past seasons in-app — the executive team keeps that record separately.
