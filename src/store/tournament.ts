import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {
  GameId,
  GameRefAssignment,
  GameScore,
  LineSlot,
  RefId,
  TeamName,
  TournamentState,
} from '@/lib/schemas'
import { TOURNAMENT } from '@/lib/tournament'
import { pushRefs, pushReset, pushScoreDebounced } from '@/lib/sync'

/**
 * Tournament state — scores + ref assignments. Persisted to
 * localStorage; will be replaced (or fronted) by Supabase realtime in
 * Phase 3.
 */
const STORAGE_KEY = 'kickball-tournament-2026-v1'

function emptyAssignment(): GameRefAssignment {
  return {
    head: null,
    lines: Array(TOURNAMENT.linesPerGame).fill(null) as LineSlot[],
  }
}

function initialState(): TournamentState {
  const games: Record<GameId, GameScore> = {}
  const gameRefs: Record<GameId, GameRefAssignment> = {}
  for (const g of TOURNAMENT.games) {
    games[g.id] = { scoreA: null, scoreB: null }
    gameRefs[g.id] = emptyAssignment()
  }
  return { games, gameRefs }
}

interface TournamentStore extends TournamentState {
  /** User-driven mutations: optimistic local update + push to Supabase. */
  setScore: (id: GameId, side: 'A' | 'B', value: number | null) => void
  setHead: (id: GameId, refId: RefId | null) => void
  setLine: (id: GameId, idx: number, slot: LineSlot) => void
  resetAll: () => void
  importState: (incoming: TournamentState) => void
  /**
   * Realtime-only writers — applied when Supabase pushes a change
   * from another device. They MUST NOT push back, otherwise we'd
   * loop. Use these from `useRealtimeSync` only; never from UI.
   */
  applyRemoteScore: (id: GameId, score: GameScore) => void
  applyRemoteRefs: (id: GameId, refs: GameRefAssignment) => void
}

export const useTournamentStore = create<TournamentStore>()(
  persist(
    immer((set) => ({
      ...initialState(),

      setScore: (id, side, value) => {
        set((s) => {
          if (!s.games[id]) s.games[id] = { scoreA: null, scoreB: null }
          if (side === 'A') s.games[id].scoreA = value
          else s.games[id].scoreB = value
        })
        // Push the post-mutation value (debounced so rapid typing
        // produces one upsert with the final value).
        const score = useTournamentStore.getState().games[id]
        if (score) pushScoreDebounced(id, score)
      },

      setHead: (id, refId) => {
        set((s) => {
          if (!s.gameRefs[id]) s.gameRefs[id] = emptyAssignment()
          s.gameRefs[id].head = refId
        })
        const refs = useTournamentStore.getState().gameRefs[id]
        if (refs) void pushRefs(id, refs)
      },

      setLine: (id, idx, slot) => {
        set((s) => {
          if (!s.gameRefs[id]) s.gameRefs[id] = emptyAssignment()
          s.gameRefs[id].lines[idx] = slot
        })
        const refs = useTournamentStore.getState().gameRefs[id]
        if (refs) void pushRefs(id, refs)
      },

      resetAll: () => {
        set(() => initialState())
        void pushReset()
      },

      applyRemoteScore: (id, score) =>
        set((s) => {
          s.games[id] = score
        }),

      applyRemoteRefs: (id, refs) =>
        set((s) => {
          s.gameRefs[id] = refs
        }),

      importState: (incoming) =>
        set((s) => {
          // Merge into a clean baseline so unknown game ids are dropped
          // (defends against stale exports targeting a different
          // tournament).
          const base = initialState()
          for (const id of Object.keys(incoming.games || {})) {
            const numId = Number(id)
            if (base.games[numId]) base.games[numId] = incoming.games[numId]
          }
          for (const id of Object.keys(incoming.gameRefs || {})) {
            const numId = Number(id)
            if (base.gameRefs[numId]) {
              const inc = incoming.gameRefs[numId]
              base.gameRefs[numId] = {
                head: inc.head ?? null,
                lines: Array.from(
                  { length: TOURNAMENT.linesPerGame },
                  (_, i) => (inc.lines && inc.lines[i]) || null,
                ) as LineSlot[],
              }
            }
          }
          s.games = base.games
          s.gameRefs = base.gameRefs
        }),
    })),
    {
      name: STORAGE_KEY,
      // On rehydrate, ensure shape matches the active tournament:
      // unknown game ids are dropped, missing ones get defaulted.
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const base = initialState()
        for (const id of Object.keys(base.games)) {
          const numId = Number(id)
          if (!state.games[numId]) state.games[numId] = base.games[numId]
        }
        for (const id of Object.keys(state.games)) {
          const numId = Number(id)
          if (!base.games[numId]) delete state.games[numId]
        }
        for (const id of Object.keys(base.gameRefs)) {
          const numId = Number(id)
          if (!state.gameRefs[numId]) state.gameRefs[numId] = base.gameRefs[numId]
          else {
            const inc = state.gameRefs[numId]
            state.gameRefs[numId] = {
              head: inc.head ?? null,
              lines: Array.from(
                { length: TOURNAMENT.linesPerGame },
                (_, i) => (inc.lines && inc.lines[i]) || null,
              ) as LineSlot[],
            }
          }
        }
        for (const id of Object.keys(state.gameRefs)) {
          const numId = Number(id)
          if (!base.gameRefs[numId]) delete state.gameRefs[numId]
        }
      },
    },
  ),
)

/** Convenience: serialised export of just the persisted state. */
export function exportTournamentState(): string {
  const s = useTournamentStore.getState()
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), state: { games: s.games, gameRefs: s.gameRefs } },
    null,
    2,
  )
}

// Type-only exports kept in case future code needs the local helpers.
export type { TeamName }
