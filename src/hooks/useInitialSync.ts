import { useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TOURNAMENT } from '@/lib/tournament'
import { useTournamentStore } from '@/store/tournament'
import { useSyncStore } from '@/store/sync'
import type { GameId, GameRefAssignment, GameScore, LineSlot } from '@/lib/schemas'

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
    const [scoresResult, refsResult] = await Promise.all([
      supabase
        .from('game_scores')
        .select('game_id, score_a, score_b')
        .eq('tournament_id', TOURNAMENT.id),
      supabase
        .from('game_refs')
        .select('game_id, head, lines')
        .eq('tournament_id', TOURNAMENT.id),
    ])

    if (scoresResult.error || refsResult.error) {
      const msg = scoresResult.error?.message ?? refsResult.error?.message ?? 'unknown'
      console.warn('Supabase fetch failed:', msg)
      // Don't touch status — the realtime channel will reflect the
      // real connection state. Transient REST hiccups shouldn't move
      // the dot if the channel is still happily subscribed.
      return
    }

    const games: Record<GameId, GameScore> = {}
    for (const row of scoresResult.data ?? []) {
      games[row.game_id] = { scoreA: row.score_a, scoreB: row.score_b }
    }

    const gameRefs: Record<GameId, GameRefAssignment> = {}
    for (const row of refsResult.data ?? []) {
      gameRefs[row.game_id] = {
        head: row.head,
        lines: ((row.lines as LineSlot[] | null) ?? []) as LineSlot[],
      }
    }

    importState({ games, gameRefs })
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
