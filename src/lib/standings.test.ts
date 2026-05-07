import { describe, it, expect } from 'vitest'
import { getTeamStatus, statusLabel, statusSortKey } from '@/lib/standings'
import { computeStarTeam } from '@/lib/star'
import { TEST_TOURNAMENT } from '@/lib/__fixtures__/tournament'
import type { GameId, GameScore } from '@/lib/schemas'

function scoresFrom(map: Record<GameId, [number, number]>): Record<GameId, GameScore> {
  const out: Record<GameId, GameScore> = {}
  for (const [id, [a, b]] of Object.entries(map)) {
    out[Number(id)] = { scoreA: a, scoreB: b }
  }
  return out
}

const star = (scores: Record<GameId, GameScore>) => () =>
  computeStarTeam(TEST_TOURNAMENT, scores)

describe('getTeamStatus', () => {
  it('every team starts active in Round 1', () => {
    for (const t of TEST_TOURNAMENT.teams) {
      const status = getTeamStatus(TEST_TOURNAMENT, {}, t.name, star({}))
      expect(status).toEqual({ kind: 'active', round: 'R1' })
    }
  })

  it('R1 winner is "active in QF"; R1 loser stays "R1" until Star is decided', () => {
    // Game 1: T1 beats T2. R1 not yet complete (other games pending).
    const scores = scoresFrom({ 1: [5, 3] })
    expect(getTeamStatus(TEST_TOURNAMENT, scores, 'T1', star(scores))).toEqual({
      kind: 'active',
      round: 'QF',
    })
    expect(getTeamStatus(TEST_TOURNAMENT, scores, 'T2', star(scores))).toEqual({
      kind: 'r1Out',
    })
  })

  it('Star team flips from "R1" to "active in QF" when R1 completes', () => {
    // R1: T2 loses 5-3 (worst). All other R1 losers have worse run diff so
    // T2 is the Star.
    const scores = scoresFrom({
      1: [5, 3], 2: [9, 0], 3: [9, 0], 4: [9, 0],
      5: [9, 0], 6: [9, 0], 7: [9, 0],
    })
    // Verify our fixture: T2 (loser of game 1) should be the Star
    expect(computeStarTeam(TEST_TOURNAMENT, scores)).toBe('T2')

    expect(getTeamStatus(TEST_TOURNAMENT, scores, 'T2', star(scores))).toEqual({
      kind: 'active',
      round: 'QF',
    })
    // A non-Star R1 loser (e.g. T4) is locked at R1 once Star decided
    expect(getTeamStatus(TEST_TOURNAMENT, scores, 'T4', star(scores))).toEqual({
      kind: 'r1Out',
    })
  })

  it('QF loser → "qfOut"; QF winner → "active in SF"', () => {
    // Setup: complete R1 (T2 will be Star), then complete game 9 (QF1).
    // Game 9: winnerOf(1)=T1 vs winnerOf(2)=T3. T1 wins 7-2.
    const scores = scoresFrom({
      1: [5, 3], 2: [9, 0], 3: [9, 0], 4: [9, 0],
      5: [9, 0], 6: [9, 0], 7: [9, 0],
      9: [7, 2],
    })
    expect(getTeamStatus(TEST_TOURNAMENT, scores, 'T1', star(scores))).toEqual({
      kind: 'active',
      round: 'SF',
    })
    expect(getTeamStatus(TEST_TOURNAMENT, scores, 'T3', star(scores))).toEqual({
      kind: 'qfOut',
    })
  })

  it('SF loser → "3rd"; Final winner/loser → "1st"/"2nd"', () => {
    // Complete entire bracket where T1 wins everything.
    const scores = scoresFrom({
      // R1: T1, T3, T5, T7, T9, T11, T13 win; T2 is Star (lost narrowest)
      1: [5, 3], 2: [9, 0], 3: [9, 0], 4: [9, 0],
      5: [9, 0], 6: [9, 0], 7: [9, 0],
      // QF: 9 (T1 v T3), 10 (T5 v T7), 11 (T9 v T11), 12 (T13 v Star=T2)
      9: [7, 2],   // T1 wins
      10: [6, 4],  // T5 wins
      11: [3, 1],  // T9 wins
      12: [5, 4],  // T13 wins (T2 the Star is out)
      // SF: 13 (winnerOf 10 v winnerOf 9) = T5 v T1; 14 (winnerOf 11 v winnerOf 12) = T9 v T13
      13: [4, 8],  // T1 wins
      14: [9, 6],  // T9 wins
      // Final: 15 (winnerOf 13 v winnerOf 14) = T1 v T9
      15: [8, 5],  // T1 wins
    })
    expect(getTeamStatus(TEST_TOURNAMENT, scores, 'T1', star(scores))).toEqual({
      kind: '1st',
    })
    expect(getTeamStatus(TEST_TOURNAMENT, scores, 'T9', star(scores))).toEqual({
      kind: '2nd',
    })
    // SF losers: T5 lost SF13, T13 lost SF14
    expect(getTeamStatus(TEST_TOURNAMENT, scores, 'T5', star(scores))).toEqual({
      kind: '3rd',
    })
    expect(getTeamStatus(TEST_TOURNAMENT, scores, 'T13', star(scores))).toEqual({
      kind: '3rd',
    })
    // QF loser: T3, T7, T11, plus Star T2 (lost QF12)
    expect(getTeamStatus(TEST_TOURNAMENT, scores, 'T2', star(scores))).toEqual({
      kind: 'qfOut',
    })
    // R1 loser non-star: T4, T6, T8, T10, T12, T14
    expect(getTeamStatus(TEST_TOURNAMENT, scores, 'T4', star(scores))).toEqual({
      kind: 'r1Out',
    })
  })
})

describe('statusSortKey + statusLabel', () => {
  it('orders eliminated bands with active states slotted in between', () => {
    expect(statusSortKey({ kind: '1st' })).toBeLessThan(statusSortKey({ kind: '2nd' }))
    expect(statusSortKey({ kind: '2nd' })).toBeLessThan(
      statusSortKey({ kind: 'active', round: 'F' }),
    )
    expect(statusSortKey({ kind: 'active', round: 'F' })).toBeLessThan(
      statusSortKey({ kind: '3rd' }),
    )
    expect(statusSortKey({ kind: '3rd' })).toBeLessThan(
      statusSortKey({ kind: 'active', round: 'SF' }),
    )
    expect(statusSortKey({ kind: 'active', round: 'SF' })).toBeLessThan(
      statusSortKey({ kind: 'qfOut' }),
    )
    expect(statusSortKey({ kind: 'r1Out' })).toBeLessThan(
      statusSortKey({ kind: 'active', round: 'R1' }),
    )
  })

  it('produces user-facing labels', () => {
    expect(statusLabel({ kind: '1st' })).toBe('1st')
    expect(statusLabel({ kind: 'qfOut' })).toBe('QF')
    expect(statusLabel({ kind: 'active', round: 'F' })).toBe('Still in Final')
    expect(statusLabel({ kind: 'active', round: 'R1' })).toBe('Still in R1')
  })
})
