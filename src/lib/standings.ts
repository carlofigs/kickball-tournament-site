import type {
  Game,
  GameId,
  GameScore,
  RoundCode,
  TeamName,
  Tournament,
} from '@/lib/schemas'
import { getWinner, isComplete, resolveTeam } from '@/lib/games'

/**
 * Each team's current position in the tournament. Drives the
 * Standings page's live "Current standings" table.
 *
 *  - "1st" / "2nd"          Final has been decided
 *  - "3rd" / "QF" / "R1"    Eliminated at that round
 *  - "active" + round       Still alive — currently in the named
 *                           round (either waiting to play or in the
 *                           middle of it). The Star team's R1 loss
 *                           still leaves them "active" via Game 12.
 */
export type TeamStatus =
  | { kind: '1st' }
  | { kind: '2nd' }
  | { kind: '3rd' }
  | { kind: 'qfOut' }
  | { kind: 'r1Out' }
  | { kind: 'active'; round: RoundCode }

export function getTeamStatus(
  tournament: Tournament,
  scores: Record<GameId, GameScore>,
  team: TeamName,
  getStar: () => TeamName | null,
): TeamStatus {
  // Walk games in order — the highest-id game where this team
  // appears (after winnerOf / star refs resolve) is their current
  // depth. A R1 loser stops appearing in later games unless they're
  // the Star, in which case they reappear in Game 12 once R1 finishes.
  let latest: Game | null = null
  for (const game of tournament.games) {
    const a = resolveTeam(tournament, scores, game.teamA, getStar)
    const b = resolveTeam(tournament, scores, game.teamB, getStar)
    if (team === a || team === b) latest = game
  }
  if (!latest) return { kind: 'active', round: 'R1' }

  const score = scores[latest.id]
  if (!isComplete(score)) {
    return { kind: 'active', round: latest.round }
  }

  const winner = getWinner(tournament, scores, latest.id, getStar)
  const won = winner === team

  if (latest.round === 'F') return won ? { kind: '1st' } : { kind: '2nd' }
  if (won) {
    // Won a non-Final; the next-round game's resolveTeam should have
    // pulled them in as `latest` instead. If we get here it's a
    // config glitch — degrade to "still active in this round".
    return { kind: 'active', round: latest.round }
  }
  if (latest.round === 'SF') return { kind: '3rd' }
  if (latest.round === 'QF') return { kind: 'qfOut' }
  return { kind: 'r1Out' }
}

/** Sort key for current standings — lower comes first (top of the
 *  table). Within a tied key, callers sort alphabetically. */
export function statusSortKey(s: TeamStatus): number {
  switch (s.kind) {
    case '1st': return 0
    case '2nd': return 1
    case 'active': {
      // Active teams sit between the eliminated bands they're "above".
      // E.g. "still in F" sits between 2nd and 3rd; once F decides,
      // those teams flip to 1st/2nd and the slot empties.
      switch (s.round) {
        case 'F':  return 2
        case 'SF': return 4
        case 'QF': return 6
        case 'R1': return 8
      }
      return 99
    }
    case '3rd':   return 3
    case 'qfOut': return 5
    case 'r1Out': return 7
  }
}

/** Single-column display label. Alive states use "Still in …" so
 *  there's no risk of misreading "QF" as either eliminated or active. */
export function statusLabel(s: TeamStatus): string {
  switch (s.kind) {
    case '1st':   return '1st'
    case '2nd':   return '2nd'
    case '3rd':   return '3rd'
    case 'qfOut': return 'QF'
    case 'r1Out': return 'R1'
    case 'active':
      switch (s.round) {
        case 'F':  return 'Still in Final'
        case 'SF': return 'Still in SFs'
        case 'QF': return 'Still in QFs'
        case 'R1': return 'Still in R1'
      }
  }
  return '?'
}

export function statusIsActive(s: TeamStatus): boolean {
  return s.kind === 'active'
}
