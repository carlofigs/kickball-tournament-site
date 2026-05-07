import { describe, it, expect } from 'vitest'
import { computeStarTeam, r1Losers, rankLosers } from '@/lib/star'
import { TEST_TOURNAMENT } from '@/lib/__fixtures__/tournament'
import type { GameId, GameScore } from '@/lib/schemas'

/** All 7 R1 games complete with the supplied scores. */
function r1Complete(scores: Record<GameId, [number, number]>): Record<GameId, GameScore> {
  const out: Record<GameId, GameScore> = {}
  for (const [id, [a, b]] of Object.entries(scores)) {
    out[Number(id)] = { scoreA: a, scoreB: b }
  }
  return out
}

describe('r1Losers', () => {
  it('returns null until all 7 R1 games are complete', () => {
    expect(r1Losers(TEST_TOURNAMENT, {})).toBeNull()
    expect(
      r1Losers(TEST_TOURNAMENT, { 1: { scoreA: 5, scoreB: 3 } }),
    ).toBeNull()
  })

  it('returns null if any R1 game is a tie', () => {
    const scores = r1Complete({
      1: [3, 3], 2: [5, 4], 3: [7, 2], 4: [6, 1],
      5: [8, 0], 6: [4, 3], 7: [9, 5],
    })
    expect(r1Losers(TEST_TOURNAMENT, scores)).toBeNull()
  })

  it('returns one row per loser with correct stats', () => {
    // T1 beats T2 5-3 → T2 is loser with runs=3, allowed=5, diff=-2
    const scores = r1Complete({
      1: [5, 3], 2: [4, 7], 3: [9, 1], 4: [2, 6],
      5: [3, 5], 6: [10, 8], 7: [4, 4],  // intentional tie to test below
    })
    expect(r1Losers(TEST_TOURNAMENT, scores)).toBeNull() // tie in #7

    const clean = r1Complete({
      1: [5, 3], 2: [4, 7], 3: [9, 1], 4: [2, 6],
      5: [3, 5], 6: [10, 8], 7: [4, 6],
    })
    const losers = r1Losers(TEST_TOURNAMENT, clean)
    expect(losers).toHaveLength(7)
    const t2 = losers!.find((l) => l.team === 'T2')!
    expect(t2).toMatchObject({ runs: 3, allowed: 5, runDiff: -2, gameId: 1 })
  })
})

describe('rankLosers + computeStarTeam', () => {
  it('orders by run differential first (higher is better)', () => {
    // T2 loses 1-0 (diff -1); T4 loses 0-9 (diff -9); T2 should rank ahead
    const scores = r1Complete({
      1: [1, 0],   // T2 loses, diff -1
      2: [9, 0],   // T4 loses, diff -9
      3: [2, 1], 4: [3, 2], 5: [4, 3], 6: [5, 4], 7: [6, 5],
    })
    const losers = r1Losers(TEST_TOURNAMENT, scores)!
    const ranked = rankLosers(losers).map((l) => l.team)
    expect(ranked.indexOf('T2')).toBeLessThan(ranked.indexOf('T4'))
    expect(computeStarTeam(TEST_TOURNAMENT, scores)).toBe('T2')
  })

  it('breaks run-diff ties by lowest combined game total (5-4 beats 9-8)', () => {
    // T2 loses 4-5 (diff -1, total 9); T4 loses 8-9 (diff -1, total 17).
    // T2 has the LOWER total so they should rank ahead.
    const scores = r1Complete({
      1: [5, 4],   // T2 loses, diff -1, total 9
      2: [9, 8],   // T4 loses, diff -1, total 17
      3: [3, 0], 4: [3, 0], 5: [3, 0], 6: [3, 0], 7: [3, 0],
    })
    const losers = r1Losers(TEST_TOURNAMENT, scores)!
    const ranked = rankLosers(losers).map((l) => l.team)
    expect(ranked.indexOf('T2')).toBeLessThan(ranked.indexOf('T4'))
    expect(computeStarTeam(TEST_TOURNAMENT, scores)).toBe('T2')
  })

  it('falls back to game id ascending when run-diff and total both tie', () => {
    // T2 (game 1) and T4 (game 2) both lose 5-4. Same diff, same total.
    // Game id breaks the tie → T2 (game 1) ranks ahead.
    const scores = r1Complete({
      1: [5, 4], 2: [5, 4],
      3: [3, 0], 4: [3, 0], 5: [3, 0], 6: [3, 0], 7: [3, 0],
    })
    const losers = r1Losers(TEST_TOURNAMENT, scores)!
    const ranked = rankLosers(losers).map((l) => l.team)
    expect(ranked.indexOf('T2')).toBeLessThan(ranked.indexOf('T4'))
  })

  it('computeStarTeam returns null when R1 is incomplete', () => {
    expect(computeStarTeam(TEST_TOURNAMENT, {})).toBeNull()
  })
})
