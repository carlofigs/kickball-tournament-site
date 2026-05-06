import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {
  GameId,
  GameRefAssignment,
  GameScore,
  LineSlot,
  Ref,
  RefId,
  TeamName,
  TournamentState,
} from '@/lib/schemas'
import { TOURNAMENT } from '@/lib/tournament'
import { pushDeleteRef, pushRef, pushRefs, pushReset, pushScoreDebounced } from '@/lib/sync'

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
  // refs starts empty — `useInitialSync` seeds from CONFIG.refs on
  // first run if the DB is empty, otherwise loads from the DB.
  return { games, gameRefs, refs: {} }
}

interface TournamentStore extends TournamentState {
  /** User-driven mutations: optimistic local update + push to Supabase. */
  setScore: (id: GameId, side: 'A' | 'B', value: number | null) => void
  setHead: (id: GameId, refId: RefId | null) => void
  setLine: (id: GameId, idx: number, slot: LineSlot) => void
  resetAll: () => void
  /**
   * Accepts a partial state — old export files predate the refs
   * roster, and the initial-sync hook also imports without touching
   * the roster. Missing keys are left as-is.
   */
  importState: (incoming: Partial<TournamentState>) => void
  addRef: (name: string, headEligible: boolean) => Ref
  updateRef: (id: RefId, patch: Partial<Omit<Ref, 'id'>>) => void
  deleteRef: (id: RefId) => void
  /**
   * Realtime-only writers — applied when Supabase pushes a change
   * from another device. They MUST NOT push back, otherwise we'd
   * loop. Use these from `useRealtimeSync` only; never from UI.
   */
  applyRemoteScore: (id: GameId, score: GameScore) => void
  applyRemoteRefs: (id: GameId, refs: GameRefAssignment) => void
  applyRemoteRef: (ref: Ref) => void
  applyRemoteDeleteRef: (id: RefId) => void
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
        // Preserve the roster on reset — we only clear scores +
        // assignments, not the people refereeing.
        const refs = useTournamentStore.getState().refs
        set(() => ({ ...initialState(), refs }))
        void pushReset()
      },

      addRef: (name, headEligible) => {
        const id =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `ref_${Date.now()}_${Math.random().toString(36).slice(2)}`
        const ref: Ref = { id, name, headEligible }
        set((s) => {
          s.refs[id] = ref
        })
        void pushRef(ref)
        return ref
      },

      updateRef: (id, patch) => {
        set((s) => {
          const existing = s.refs[id]
          if (!existing) return
          s.refs[id] = { ...existing, ...patch }
        })
        const updated = useTournamentStore.getState().refs[id]
        if (updated) void pushRef(updated)
      },

      deleteRef: (id) => {
        set((s) => {
          delete s.refs[id]
        })
        void pushDeleteRef(id)
      },

      applyRemoteScore: (id, score) =>
        set((s) => {
          s.games[id] = score
        }),

      applyRemoteRefs: (id, refs) =>
        set((s) => {
          s.gameRefs[id] = refs
        }),

      applyRemoteRef: (ref) =>
        set((s) => {
          s.refs[ref.id] = ref
        }),

      applyRemoteDeleteRef: (id) =>
        set((s) => {
          delete s.refs[id]
        }),

      importState: (incoming) =>
        set((s) => {
          // Merge into a clean baseline so unknown game ids are dropped
          // (defends against stale exports targeting a different
          // tournament).
          const base = initialState()
          const incomingGames = incoming.games ?? {}
          for (const id of Object.keys(incomingGames)) {
            const numId = Number(id)
            if (base.games[numId]) base.games[numId] = incomingGames[numId]
          }
          const incomingGameRefs = incoming.gameRefs ?? {}
          for (const id of Object.keys(incomingGameRefs)) {
            const numId = Number(id)
            if (base.gameRefs[numId]) {
              const inc = incomingGameRefs[numId]
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
          // Refs are passed through verbatim — they're free-form, no
          // tournament-specific shape to validate against.
          if (incoming.refs) s.refs = { ...incoming.refs }
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
