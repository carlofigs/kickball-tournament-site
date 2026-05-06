import { useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TOURNAMENT } from '@/lib/tournament'
import { useTournamentStore } from '@/store/tournament'
import { useSyncStore } from '@/store/sync'
import { pushRef } from '@/lib/sync'
import type {
  GameId,
  GameRefAssignment,
  GameScore,
  LineSlot,
  Ref,
  RefId,
} from '@/lib/schemas'

/**
 * Mount-time fetch from Supabase + visibility-resume re-fetch.
 *
 * Strategy:
 *  - Once on mount, fetch every row for this tournament and merge
 *    into the local store. localStorage stays the bootstrap (instant
 *    first paint), then Supabase wins.
 *  - When the tab regains focus after being hidden, re-run the same
 *    fetch. Browser tab sleep can starve realtime subscriptions, and
 *    a one-shot re-fetch is the cheapest way to catch up.
 *
 * Silent on the status indicator: the realtime channel
 * (`useRealtimeSync`) is the single source of truth for the status
 * dot. Touching status here would lie on visibility-resume re-fetches
 * (the channel is usually still SUBSCRIBED, so nothing would event-
 * back to flip status away from "connecting"). All this hook does is
 * refresh data and bump `lastSyncAt` on success.
 *
 * No-ops when Supabase isn't configured.
 */
export function useInitialSync() {
  const importState = useTournamentStore((s) => s.importState)
  const markSync = useSyncStore((s) => s.markSync)

  const fetchAll = useCallback(async () => {
    if (!supabase) return
    const [scoresResult, gameRefsResult, rosterResult] = await Promise.all([
      supabase
        .from('game_scores')
        .select('game_id, score_a, score_b')
        .eq('tournament_id', TOURNAMENT.id),
      supabase
        .from('game_refs')
        .select('game_id, head, lines')
        .eq('tournament_id', TOURNAMENT.id),
      supabase
        .from('refs')
        .select('ref_id, name, head_eligible')
        .eq('tournament_id', TOURNAMENT.id),
    ])

    // Handle each result independently so a missing optional table
    // (e.g. `refs` before its migration is applied) doesn't break the
    // others. Status is left to the realtime channel.
    if (scoresResult.error) {
      console.warn('Supabase scores fetch failed:', scoresResult.error.message)
    }
    if (gameRefsResult.error) {
      console.warn('Supabase game_refs fetch failed:', gameRefsResult.error.message)
    }
    if (rosterResult.error) {
      console.warn('Supabase refs fetch failed:', rosterResult.error.message)
    }

    const games: Record<GameId, GameScore> = {}
    for (const row of scoresResult.data ?? []) {
      games[row.game_id] = { scoreA: row.score_a, scoreB: row.score_b }
    }

    const gameRefs: Record<GameId, GameRefAssignment> = {}
    for (const row of gameRefsResult.data ?? []) {
      gameRefs[row.game_id] = {
        head: row.head,
        lines: ((row.lines as LineSlot[] | null) ?? []) as LineSlot[],
      }
    }

    // Roster: if the refs query came back successful AND empty, seed
    // from CONFIG so the organiser has a starting list. After seeding,
    // DB is the source of truth — config is never re-applied. Race-
    // safe across devices since each upsert is keyed on
    // (tournament_id, ref_id).
    //
    // If the roster query errored (e.g. table doesn't exist yet), we
    // skip the refs portion of the import — the existing local refs
    // (from earlier runs or this session) are preserved.
    const refs: Record<RefId, Ref> | undefined = rosterResult.error
      ? undefined
      : (() => {
          const out: Record<RefId, Ref> = {}
          if ((rosterResult.data ?? []).length === 0 && TOURNAMENT.refs.length > 0) {
            for (const r of TOURNAMENT.refs) {
              out[r.id] = { ...r }
              void pushRef(r)
            }
          } else {
            for (const row of rosterResult.data ?? []) {
              out[row.ref_id] = {
                id: row.ref_id,
                name: row.name,
                headEligible: row.head_eligible,
              }
            }
          }
          return out
        })()

    importState({ games, gameRefs, refs })
    markSync()
  }, [importState, markSync])

  useEffect(() => {
    if (!supabase) return

    void fetchAll().catch((err) => {
      console.warn('Initial sync threw:', err)
    })

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void fetchAll()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchAll])
}
