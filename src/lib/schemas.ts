/**
 * Shared TS shapes — the single contract between tournament config,
 * persisted state, and UI components.
 *
 * If you change a shape, expect a typecheck error somewhere; that's the
 * desired behaviour. New tournaments slot in by writing a `Tournament`
 * value (see lib/config.ts) — all other code reads from it generically.
 */

export type TeamName = string
export type RefId = string
export type GameId = number
export type Field = string
export type RoundCode = 'R1' | 'QF' | 'SF' | 'F'

/* ── Team ──────────────────────────────────────────────────────────── */
export interface Team {
  name: TeamName
  /** Hex colour, e.g. "#89CFF0" */
  colour: string
}

/* ── Game ──────────────────────────────────────────────────────────── */
/** Reference to a team that resolves at render time. */
export type TeamRef =
  | TeamName // literal team (Round 1)
  | { winnerOf: GameId } // advances winner from an earlier game
  | { star: true } // the Star team (best R1 loser)

export interface Game {
  id: GameId
  round: RoundCode
  /** Display string, e.g. "1:00 pm" — must match a `TimeSlot.time` */
  time: string
  field: Field
  teamA: TeamRef
  teamB: TeamRef
  /** Optional pack-up note shown on the card. */
  packUp?: string
}

/* ── Time slot ─────────────────────────────────────────────────────── */
export interface TimeSlotInfo {
  /** Free-text label for non-game slots (Set-up, Huddle, etc). */
  label: string
}
export interface TimeSlot {
  time: string
  /** Present for set-up / huddle / similar non-game items. */
  info?: TimeSlotInfo
}

/* ── Refs ──────────────────────────────────────────────────────────── */
export interface Ref {
  id: RefId
  name: string
  /** Only head-eligible refs appear in Head dropdowns. */
  headEligible: boolean
}

/** A single line-ref slot; null means unassigned. */
export type LineSlot =
  | null
  | { ref: RefId }
  | { team: TeamName }

export interface GameRefAssignment {
  head: RefId | null
  lines: LineSlot[]
}

/* ── Tournament config ─────────────────────────────────────────────── */
export interface Tournament {
  /**
   * Stable id used as the `tournament_id` foreign key in Supabase
   * (e.g. "summer-2026"). Must be unique across tournaments and
   * never change once data has been written.
   */
  id: string
  title: string
  /** Display string, e.g. "Sunday · 10 May 2026" */
  dateLabel: string
  teams: Team[]
  rounds: Record<RoundCode, string>
  timeSlots: TimeSlot[]
  games: Game[]
  refs: Ref[]
  /** Number of line refs each game has. */
  linesPerGame: number
  /**
   * Soft-auth PINs. NOT real security — anyone reading the source sees
   * them. Edit per-tournament.
   */
  pins: { ref: string; organiser: string }
}

/* ── Persisted state ──────────────────────────────────────────────── */
export interface GameScore {
  scoreA: number | null
  scoreB: number | null
}
export interface TournamentState {
  games: Record<GameId, GameScore>
  gameRefs: Record<GameId, GameRefAssignment>
}

/* ── Auth ──────────────────────────────────────────────────────────── */
export type Role = 'player' | 'ref' | 'organiser'
export interface AuthState {
  role: Role
  refId: RefId | null
}

/* ── Star-team standings row ──────────────────────────────────────── */
export interface LoserRow {
  team: TeamName
  runs: number
  allowed: number
  runDiff: number
  gameId: GameId
}
