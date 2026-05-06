import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { TOURNAMENT } from '@/lib/tournament'
import { useSyncStore } from '@/store/sync'
import type { GameId, GameRefAssignment, GameScore } from '@/lib/schemas'

/**
 * Write helpers — fire-and-forget upserts/deletes against Supabase.
 *
 * No rollback on failure: the local store keeps the user's intended
 * value (so the UI stays responsive) and a toast surfaces the sync
 * error. The next successful push reconciles the row. For tournament
 * day this trades a brief possible divergence for a calm UX; CRDTs
 * would be the upgrade if we ever needed strict cross-device merging.
 *
 * No-ops when Supabase isn't configured (env vars missing) — the app
 * keeps running from localStorage only in that case.
 */

export async function pushScore(gameId: GameId, score: GameScore): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('game_scores')
    .upsert(
      {
        tournament_id: TOURNAMENT.id,
        game_id: gameId,
        score_a: score.scoreA,
        score_b: score.scoreB,
      },
      { onConflict: 'tournament_id,game_id' },
    )
  if (error) {
    console.warn('pushScore failed:', error.message)
    toast.error('Failed to sync score: ' + error.message)
    return
  }
  useSyncStore.getState().markSync()
}

export async function pushRefs(
  gameId: GameId,
  refs: GameRefAssignment,
): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('game_refs')
    .upsert(
      {
        tournament_id: TOURNAMENT.id,
        game_id: gameId,
        head: refs.head,
        lines: refs.lines,
      },
      { onConflict: 'tournament_id,game_id' },
    )
  if (error) {
    console.warn('pushRefs failed:', error.message)
    toast.error('Failed to sync ref assignment: ' + error.message)
    return
  }
  useSyncStore.getState().markSync()
}

export async function pushReset(): Promise<void> {
  if (!supabase) return
  const [scores, refs] = await Promise.all([
    supabase.from('game_scores').delete().eq('tournament_id', TOURNAMENT.id),
    supabase.from('game_refs').delete().eq('tournament_id', TOURNAMENT.id),
  ])
  const err = scores.error?.message ?? refs.error?.message
  if (err) {
    console.warn('pushReset failed:', err)
    toast.error('Failed to sync reset: ' + err)
    return
  }
  useSyncStore.getState().markSync()
}

/**
 * Score pushes are debounced per-game so the user typing "1" → "12" →
 * "123" produces one upsert with the final value, not three. Ref
 * dropdown changes push immediately because they're discrete events.
 */
const scoreTimers = new Map<GameId, ReturnType<typeof setTimeout>>()
const SCORE_DEBOUNCE_MS = 300

export function pushScoreDebounced(gameId: GameId, score: GameScore): void {
  const existing = scoreTimers.get(gameId)
  if (existing) clearTimeout(existing)
  const timer = setTimeout(() => {
    scoreTimers.delete(gameId)
    void pushScore(gameId, score)
  }, SCORE_DEBOUNCE_MS)
  scoreTimers.set(gameId, timer)
}
