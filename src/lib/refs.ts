import type {
  AuthState,
  GameId,
  GameRefAssignment,
  GameScore,
  RefId,
  TeamName,
  Tournament,
} from '@/lib/schemas'
import { gameDef, resolveTeam } from '@/lib/games'
import { computeStarTeam } from '@/lib/star'

/**
 * Role-aware editability check. Mirrors the legacy version:
 *   - organiser: every game
 *   - ref:       only games where they're the head ref or one of the
 *                line refs (i.e. assigned to that game)
 *   - player:    nothing
 */
export function canEditScore(
  auth: AuthState,
  gameRefs: Record<GameId, GameRefAssignment>,
  gameId: GameId,
): boolean {
  if (auth.role === 'organiser') return true
  if (auth.role === 'ref' && auth.refId) {
    const r = gameRefs[gameId]
    if (!r) return false
    if (r.head === auth.refId) return true
    return r.lines.some((slot) => slot && 'ref' in slot && slot.ref === auth.refId)
  }
  return false
}

/**
 * Refs assigned (head or line) to *other* games at the same time slot.
 * Used to filter the dropdowns so an organiser can't double-book a ref
 * across concurrent games.
 */
export function refsAtSameSlot(
  t: Tournament,
  gameRefs: Record<GameId, GameRefAssignment>,
  gameId: GameId,
): Set<RefId> {
  const def = gameDef(t, gameId)
  if (!def) return new Set()
  const conflicts = new Set<RefId>()
  for (const og of t.games) {
    if (og.id === gameId || og.time !== def.time) continue
    const r = gameRefs[og.id]
    if (!r) continue
    if (r.head) conflicts.add(r.head)
    for (const slot of r.lines) {
      if (slot && 'ref' in slot) conflicts.add(slot.ref)
    }
  }
  return conflicts
}

/**
 * All refs that are taken for the perspective of `exceptSlot` in
 * `gameId`. Combines two sources of conflict:
 *
 *   1. Concurrent games at the same time slot (`refsAtSameSlot`)
 *   2. Other slots of the SAME game — a ref can't be both head and
 *      line of one game, and the two line slots can't share a ref.
 *
 * The slot named in `exceptSlot` is excluded so the dropdown still
 * shows the ref currently selected for it.
 */
export type SlotKey = 'head' | { line: number }

export function refsTakenForSlot(
  t: Tournament,
  gameRefs: Record<GameId, GameRefAssignment>,
  gameId: GameId,
  exceptSlot: SlotKey,
): Set<RefId> {
  const taken = refsAtSameSlot(t, gameRefs, gameId)
  const own = gameRefs[gameId]
  if (!own) return taken
  // Other slots of the same game.
  if (exceptSlot !== 'head' && own.head) {
    taken.add(own.head)
  }
  own.lines.forEach((slot, idx) => {
    const isExcepted = typeof exceptSlot === 'object' && exceptSlot.line === idx
    if (!isExcepted && slot && 'ref' in slot) taken.add(slot.ref)
  })
  return taken
}

/**
 * Teams playing in any game at the same time slot as `gameId`,
 * including `gameId` itself. Used to filter the "Volunteer team"
 * options on a line slot — a team's player can't ref a game while
 * their team is playing in a concurrent game.
 *
 * Unresolved teams (winnerOf / star refs that haven't been decided
 * yet) are skipped, so for QF/SF/F slots before earlier rounds
 * complete, the filter is more permissive — that's the right call:
 * we'll re-filter once data fills in.
 */
export function teamsPlayingAtSlot(
  t: Tournament,
  scores: Record<GameId, GameScore>,
  gameId: GameId,
): Set<TeamName> {
  const def = gameDef(t, gameId)
  if (!def) return new Set()
  const teams = new Set<TeamName>()
  const getStar = () => computeStarTeam(t, scores)
  for (const og of t.games) {
    if (og.time !== def.time) continue
    const a = resolveTeam(t, scores, og.teamA, getStar)
    const b = resolveTeam(t, scores, og.teamB, getStar)
    if (a) teams.add(a)
    if (b) teams.add(b)
  }
  return teams
}
