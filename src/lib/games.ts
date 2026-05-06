import type {
  Game,
  GameId,
  GameScore,
  TeamName,
  TeamRef,
  TimeSlot,
  Tournament,
} from '@/lib/schemas'

/**
 * Pure functions for resolving game/team relationships. State (scores)
 * is passed in; the tournament config (games, time slots) is read off
 * the active tournament. Keeping these pure makes them trivial to use
 * inside selectors and components.
 */

/** Look up a game definition by id. */
export function gameDef(t: Tournament, id: GameId): Game | undefined {
  return t.games.find((g) => g.id === id)
}

/** Both scores entered and not a tie. Empty/partial = not complete. */
export function isComplete(s: GameScore | undefined): s is { scoreA: number; scoreB: number } {
  if (!s) return false
  if (s.scoreA == null || s.scoreB == null) return false
  return s.scoreA !== s.scoreB
}

/**
 * Resolve a TeamRef to a literal team name, recursively (winnerOf
 * chains, star). Returns null if dependencies aren't yet decided.
 *
 * `getStar` is supplied by the caller so this module doesn't need to
 * know about R1 losers / tiebreakers.
 */
export function resolveTeam(
  t: Tournament,
  scores: Record<GameId, GameScore>,
  ref: TeamRef,
  getStar: () => TeamName | null,
): TeamName | null {
  if (typeof ref === 'string') return ref
  if ('winnerOf' in ref) return getWinner(t, scores, ref.winnerOf, getStar)
  if ('star' in ref) return getStar()
  return null
}

/** Human placeholder for an unresolved TeamRef ("Winner of Game 5"). */
export function teamLabel(ref: TeamRef): string {
  if (typeof ref === 'string') return ref
  if ('winnerOf' in ref) return `Winner of Game ${ref.winnerOf}`
  if ('star' in ref) return 'Star team'
  return 'TBD'
}

export function getWinner(
  t: Tournament,
  scores: Record<GameId, GameScore>,
  id: GameId,
  getStar: () => TeamName | null,
): TeamName | null {
  const def = gameDef(t, id)
  if (!def) return null
  const s = scores[id]
  if (!isComplete(s)) return null
  const a = resolveTeam(t, scores, def.teamA, getStar)
  const b = resolveTeam(t, scores, def.teamB, getStar)
  return s.scoreA > s.scoreB ? a : b
}

export function getLoser(
  t: Tournament,
  scores: Record<GameId, GameScore>,
  id: GameId,
  getStar: () => TeamName | null,
): TeamName | null {
  const def = gameDef(t, id)
  if (!def) return null
  const s = scores[id]
  if (!isComplete(s)) return null
  const a = resolveTeam(t, scores, def.teamA, getStar)
  const b = resolveTeam(t, scores, def.teamB, getStar)
  return s.scoreA > s.scoreB ? b : a
}

/**
 * The earliest time slot still containing at least one incomplete
 * game, plus all the games at that slot. Concurrent games are bundled
 * so the UI reflects "4 fields running at once".
 */
export interface NextSlotResult {
  time: string
  games: Game[]
}
export function nextSlot(
  games: Game[],
  scores: Record<GameId, GameScore>,
  timeSlots: TimeSlot[],
): NextSlotResult | null {
  const incomplete = games.filter((g) => !isComplete(scores[g.id]))
  if (incomplete.length === 0) return null
  const order = timeSlots.map((s) => s.time)
  let earliest = Infinity
  for (const g of incomplete) {
    const idx = order.indexOf(g.time)
    if (idx >= 0 && idx < earliest) earliest = idx
  }
  if (earliest === Infinity) return null
  const time = order[earliest]
  return {
    time,
    games: incomplete.filter((g) => g.time === time).sort((a, b) => a.id - b.id),
  }
}
