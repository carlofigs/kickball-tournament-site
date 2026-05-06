import type { Tournament } from '@/lib/schemas'

/**
 * Summer 2026 tournament — committed config.
 *
 * Edit before the day. The shape is enforced by `Tournament`; if you
 * add fields, update `lib/schemas.ts` first so every consumer keeps
 * compiling.
 *
 * GAME NUMBERING: Game 8 is intentionally skipped — the schedule
 * template was originally built for 16 teams (Game 8 was a R1
 * matchup). With 14 teams the Star team takes the slot that would
 * have been Game 8's winner, in Game 12. Numbering stays 1–7, 9–15
 * for continuity with the ref group chat schedule.
 */
export const summer2026: Tournament = {
  id: 'summer-2026',
  title: 'Summer 2026 Kickball Tournament',
  dateLabel: 'Sunday · 10 May 2026',

  teams: [
    { name: 'Baby Blue', colour: '#89CFF0' },
    { name: 'Pink',      colour: '#EC4899' },
    { name: 'Lilac',     colour: '#C8A2C8' },
    { name: 'Green',     colour: '#16A34A' },
    { name: 'Red',       colour: '#B91C1C' },
    { name: 'Hay',       colour: '#DAA520' },
    { name: 'Black',     colour: '#1F2937' },
    { name: 'Apple',     colour: '#84CC16' },
    { name: 'Yellow',    colour: '#FACC15' },
    { name: 'Chocolate', colour: '#78350F' },
    { name: 'Purple',    colour: '#9333EA' },
    { name: 'Blue',      colour: '#1E40AF' },
    { name: 'Orange',    colour: '#F97316' },
    { name: 'Teal',      colour: '#0D9488' },
  ],

  rounds: {
    R1: 'Round 1',
    QF: 'Quarter Finals',
    SF: 'Semi Finals',
    F:  'Final',
  },

  timeSlots: [
    { time: '12:00 pm', info: { label: 'Fields set-up' } },
    { time: '12:45 pm', info: { label: 'Huddle' } },
    { time: '1:00 pm' },
    { time: '1:45 pm' },
    { time: '2:30 pm' },
    { time: '3:15 pm' },
    { time: '4:00 pm' },
  ],

  games: [
    { id: 1,  round: 'R1', time: '1:00 pm',  field: 'Middle Field', teamA: 'Baby Blue', teamB: 'Pink' },
    { id: 2,  round: 'R1', time: '1:00 pm',  field: 'Kiosk Field',  teamA: 'Lilac',     teamB: 'Green' },
    { id: 3,  round: 'R1', time: '1:00 pm',  field: 'Road Field',   teamA: 'Red',       teamB: 'Hay' },
    { id: 4,  round: 'R1', time: '1:00 pm',  field: 'Water Field',  teamA: 'Black',     teamB: 'Apple' },
    { id: 5,  round: 'R1', time: '1:45 pm',  field: 'Middle Field', teamA: 'Yellow',    teamB: 'Chocolate' },
    { id: 6,  round: 'R1', time: '1:45 pm',  field: 'Kiosk Field',  teamA: 'Purple',    teamB: 'Blue' },
    { id: 7,  round: 'R1', time: '1:45 pm',  field: 'Road Field',   teamA: 'Orange',    teamB: 'Teal' },
    // Game 8 intentionally omitted — see header comment.
    { id: 9,  round: 'QF', time: '2:30 pm',  field: 'Middle Field', teamA: { winnerOf: 1 },  teamB: { winnerOf: 2 } },
    { id: 10, round: 'QF', time: '2:30 pm',  field: 'Kiosk Field',  teamA: { winnerOf: 3 },  teamB: { winnerOf: 4 } },
    { id: 11, round: 'QF', time: '2:30 pm',  field: 'Road Field',   teamA: { winnerOf: 5 },  teamB: { winnerOf: 6 }, packUp: 'Loser packs up Road Field' },
    { id: 12, round: 'QF', time: '2:30 pm',  field: 'Water Field',  teamA: { winnerOf: 7 },  teamB: { star: true },  packUp: 'Loser packs up Water Field' },
    { id: 13, round: 'SF', time: '3:15 pm',  field: 'Middle Field', teamA: { winnerOf: 10 }, teamB: { winnerOf: 9 } },
    { id: 14, round: 'SF', time: '3:15 pm',  field: 'Kiosk Field',  teamA: { winnerOf: 11 }, teamB: { winnerOf: 12 }, packUp: 'Loser packs up Kiosk Field' },
    { id: 15, round: 'F',  time: '4:00 pm',  field: 'Middle Field', teamA: { winnerOf: 13 }, teamB: { winnerOf: 14 }, packUp: 'Loser packs up Middle Field' },
  ],

  refs: [
    { id: 'r1', name: 'Alex',   headEligible: true  },
    { id: 'r2', name: 'Sam',    headEligible: true  },
    { id: 'r3', name: 'Pat',    headEligible: true  },
    { id: 'r4', name: 'Jamie',  headEligible: false },
    { id: 'r5', name: 'Robin',  headEligible: false },
    { id: 'r6', name: 'Casey',  headEligible: false },
    { id: 'r7', name: 'Morgan', headEligible: false },
  ],

  linesPerGame: 2,

  // Edit before tournament day. The Ref PIN unlocks scoring on a ref's
  // assigned games only; the Organiser PIN unlocks everything + the
  // Refs management tab + admin tools.
  pins: {
    ref: '0000',
    organiser: '1111',
  },
}
