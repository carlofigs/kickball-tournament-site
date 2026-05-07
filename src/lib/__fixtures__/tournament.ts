import type { Tournament } from '@/lib/schemas'

/**
 * Minimal-but-realistic tournament fixture for unit tests. Mirrors
 * the production summer-2026 layout (7 R1 games, 4 QFs, 2 SFs, 1
 * Final) so the same logic applies, but with simpler team names
 * (T1-T14) so test assertions read cleanly.
 *
 * Tests pass this in explicitly; nothing reads the active tournament
 * config (lib/tournament.ts), keeping tests independent of any
 * config changes there.
 */
export const TEST_TOURNAMENT: Tournament = {
  id: 'test',
  title: 'Test Tournament',
  dateLabel: 'Test',
  teams: Array.from({ length: 14 }, (_, i) => ({
    name: `T${i + 1}`,
    colour: '#000000',
  })),
  rounds: { R1: 'Round 1', QF: 'Quarter Finals', SF: 'Semi Finals', F: 'Final' },
  timeSlots: [
    { time: '12:00 pm', info: { label: 'Set-up' } },
    { time: '1:00 pm' },
    { time: '1:45 pm' },
    { time: '2:30 pm' },
    { time: '3:15 pm' },
    { time: '4:00 pm' },
  ],
  games: [
    { id: 1,  round: 'R1', time: '1:00 pm',  field: 'A', teamA: 'T1',  teamB: 'T2' },
    { id: 2,  round: 'R1', time: '1:00 pm',  field: 'B', teamA: 'T3',  teamB: 'T4' },
    { id: 3,  round: 'R1', time: '1:00 pm',  field: 'C', teamA: 'T5',  teamB: 'T6' },
    { id: 4,  round: 'R1', time: '1:00 pm',  field: 'D', teamA: 'T7',  teamB: 'T8' },
    { id: 5,  round: 'R1', time: '1:45 pm',  field: 'A', teamA: 'T9',  teamB: 'T10' },
    { id: 6,  round: 'R1', time: '1:45 pm',  field: 'B', teamA: 'T11', teamB: 'T12' },
    { id: 7,  round: 'R1', time: '1:45 pm',  field: 'C', teamA: 'T13', teamB: 'T14' },
    { id: 9,  round: 'QF', time: '2:30 pm',  field: 'A', teamA: { winnerOf: 1 }, teamB: { winnerOf: 2 } },
    { id: 10, round: 'QF', time: '2:30 pm',  field: 'B', teamA: { winnerOf: 3 }, teamB: { winnerOf: 4 } },
    { id: 11, round: 'QF', time: '2:30 pm',  field: 'C', teamA: { winnerOf: 5 }, teamB: { winnerOf: 6 } },
    { id: 12, round: 'QF', time: '2:30 pm',  field: 'D', teamA: { winnerOf: 7 }, teamB: { star: true } },
    { id: 13, round: 'SF', time: '3:15 pm',  field: 'A', teamA: { winnerOf: 10 }, teamB: { winnerOf: 9 } },
    { id: 14, round: 'SF', time: '3:15 pm',  field: 'B', teamA: { winnerOf: 11 }, teamB: { winnerOf: 12 } },
    { id: 15, round: 'F',  time: '4:00 pm',  field: 'A', teamA: { winnerOf: 13 }, teamB: { winnerOf: 14 } },
  ],
  refs: [
    { id: 'r1', name: 'Alex',   headEligible: true,  team: null },
    { id: 'r2', name: 'Sam',    headEligible: true,  team: null },
    { id: 'r3', name: 'Pat',    headEligible: true,  team: 'T1' },
    { id: 'r4', name: 'Jamie',  headEligible: false, team: null },
    { id: 'r5', name: 'Robin',  headEligible: false, team: 'T5' },
  ],
  linesPerGame: 2,
  pins: { ref: '0000', organiser: '1111' },
}
