import { describe, it, expect } from 'vitest'
import {
  getLoser,
  getWinner,
  isComplete,
  nextSlot,
  resolveTeam,
  teamLabel,
} from '@/lib/games'
import { TEST_TOURNAMENT } from '@/lib/__fixtures__/tournament'

describe('isComplete', () => {
  it('true only when both scores set and not equal', () => {
    expect(isComplete({ scoreA: 5, scoreB: 3 })).toBe(true)
    expect(isComplete({ scoreA: null, scoreB: 3 })).toBe(false)
    expect(isComplete({ scoreA: 5, scoreB: null })).toBe(false)
    expect(isComplete({ scoreA: 4, scoreB: 4 })).toBe(false)
    expect(isComplete(undefined)).toBe(false)
  })
})

describe('resolveTeam + getWinner / getLoser', () => {
  const noStar = () => null

  it('resolves a literal team', () => {
    expect(resolveTeam(TEST_TOURNAMENT, {}, 'T1', noStar)).toBe('T1')
  })

  it('resolves winnerOf chain when game decided', () => {
    const scores = { 1: { scoreA: 5, scoreB: 3 } } // T1 beats T2
    expect(
      resolveTeam(TEST_TOURNAMENT, scores, { winnerOf: 1 }, noStar),
    ).toBe('T1')
  })

  it('returns null for unresolved winnerOf chains', () => {
    expect(
      resolveTeam(TEST_TOURNAMENT, {}, { winnerOf: 1 }, noStar),
    ).toBeNull()
  })

  it('uses getStar callback for star refs', () => {
    expect(resolveTeam(TEST_TOURNAMENT, {}, { star: true }, () => 'T7')).toBe(
      'T7',
    )
    expect(resolveTeam(TEST_TOURNAMENT, {}, { star: true }, noStar)).toBeNull()
  })

  it('getWinner / getLoser for completed games', () => {
    const scores = { 1: { scoreA: 5, scoreB: 3 } }
    expect(getWinner(TEST_TOURNAMENT, scores, 1, noStar)).toBe('T1')
    expect(getLoser(TEST_TOURNAMENT, scores, 1, noStar)).toBe('T2')
  })

  it('getWinner returns null on tie / incomplete', () => {
    expect(getWinner(TEST_TOURNAMENT, {}, 1, noStar)).toBeNull()
    expect(
      getWinner(
        TEST_TOURNAMENT,
        { 1: { scoreA: 4, scoreB: 4 } },
        1,
        noStar,
      ),
    ).toBeNull()
  })
})

describe('teamLabel', () => {
  it('formats placeholder strings for unresolved refs', () => {
    expect(teamLabel('T1')).toBe('T1')
    expect(teamLabel({ winnerOf: 9 })).toBe('Winner of Game 9')
    expect(teamLabel({ star: true })).toBe('Star team')
  })
})

describe('nextSlot', () => {
  const slots = TEST_TOURNAMENT.timeSlots
  const games = TEST_TOURNAMENT.games

  it('returns the earliest slot that has incomplete games', () => {
    // Mark all 1:00 pm games complete; next slot should be 1:45 pm
    const scores = {
      1: { scoreA: 5, scoreB: 3 },
      2: { scoreA: 5, scoreB: 3 },
      3: { scoreA: 5, scoreB: 3 },
      4: { scoreA: 5, scoreB: 3 },
    }
    const next = nextSlot(games, scores, slots)
    expect(next?.time).toBe('1:45 pm')
    expect(next?.games.map((g) => g.id)).toEqual([5, 6, 7])
  })

  it('returns null when all games are complete', () => {
    const scores: Record<number, { scoreA: number; scoreB: number }> = {}
    for (const g of games) scores[g.id] = { scoreA: 5, scoreB: 3 }
    expect(nextSlot(games, scores, slots)).toBeNull()
  })

  it('bundles concurrent games at the earliest slot together', () => {
    const next = nextSlot(games, {}, slots)
    expect(next?.time).toBe('1:00 pm')
    expect(next?.games.map((g) => g.id).sort()).toEqual([1, 2, 3, 4])
  })
})
