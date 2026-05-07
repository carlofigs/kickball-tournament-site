import { describe, it, expect } from 'vitest'
import {
  canEditScore,
  getRefRoleInGame,
  refsAtSameSlot,
  refsBusyAsPlayers,
  refsTakenForSlot,
  teamsPlayingAtSlot,
} from '@/lib/refs'
import { TEST_TOURNAMENT } from '@/lib/__fixtures__/tournament'
import type {
  AuthState,
  GameId,
  GameRefAssignment,
  Ref,
} from '@/lib/schemas'

const REFS_MAP: Record<string, Ref> = {}
for (const r of TEST_TOURNAMENT.refs) REFS_MAP[r.id] = r

const EMPTY_ASSIGNMENT: GameRefAssignment = { head: null, lines: [null, null] }

describe('getRefRoleInGame', () => {
  it('reports head, line 1, line 2, or null', () => {
    const a: GameRefAssignment = {
      head: 'r1',
      lines: [{ ref: 'r2' }, { team: 'T3' }],
    }
    expect(getRefRoleInGame(a, 'r1')).toBe('Head')
    expect(getRefRoleInGame(a, 'r2')).toBe('Line 1')
    expect(getRefRoleInGame(a, 'r3')).toBeNull()
    expect(getRefRoleInGame(undefined, 'r1')).toBeNull()
  })

  it('finds line 2 when only line 1 is unset', () => {
    const a: GameRefAssignment = { head: null, lines: [null, { ref: 'r4' }] }
    expect(getRefRoleInGame(a, 'r4')).toBe('Line 2')
  })
})

describe('refsAtSameSlot', () => {
  it('excludes the current game and only counts concurrent ones', () => {
    // Game 1 (1:00 pm) — own assignment shouldn't appear in conflicts
    // Game 2 (1:00 pm, concurrent) has r1 + r4 assigned
    // Game 5 (1:45 pm, different time) has r2 — shouldn't conflict
    const gameRefs: Record<GameId, GameRefAssignment> = {
      1: { head: 'r5', lines: [null, null] },
      2: { head: 'r1', lines: [{ ref: 'r4' }, null] },
      5: { head: 'r2', lines: [null, null] },
    }
    const conflicts = refsAtSameSlot(TEST_TOURNAMENT, gameRefs, 1)
    expect(conflicts.has('r1')).toBe(true)
    expect(conflicts.has('r4')).toBe(true)
    expect(conflicts.has('r5')).toBe(false) // own game
    expect(conflicts.has('r2')).toBe(false) // different time slot
  })
})

describe('refsTakenForSlot', () => {
  it('also excludes the current game OTHER slots when filtering one slot', () => {
    // Game 1: head=r1, line1=r2, line2=null
    // Filtering for "head" → includes r2 (the line ref) as taken
    // Filtering for "line 1" → includes r1 (head) as taken; excludes r2 (the slot itself)
    const gameRefs: Record<GameId, GameRefAssignment> = {
      1: { head: 'r1', lines: [{ ref: 'r2' }, null] },
    }
    const forHead = refsTakenForSlot(TEST_TOURNAMENT, gameRefs, 1, 'head')
    expect(forHead.has('r2')).toBe(true) // line ref shouldn't appear in head dropdown
    expect(forHead.has('r1')).toBe(false) // current head, excluded by "except"

    const forLine0 = refsTakenForSlot(TEST_TOURNAMENT, gameRefs, 1, { line: 0 })
    expect(forLine0.has('r1')).toBe(true) // head is taken
    expect(forLine0.has('r2')).toBe(false) // current slot, excluded by "except"
  })
})

describe('teamsPlayingAtSlot', () => {
  it('collects every team across concurrent games', () => {
    // Games 1-4 are at 1:00 pm; teams T1..T8 are playing
    const teams = teamsPlayingAtSlot(TEST_TOURNAMENT, {}, 1)
    expect(teams.has('T1')).toBe(true)
    expect(teams.has('T8')).toBe(true)
    expect(teams.has('T9')).toBe(false) // T9 is in 1:45 pm
  })
})

describe('refsBusyAsPlayers', () => {
  it('filters refs whose team is on the field at this time slot', () => {
    // r3 is on team T1; T1 plays in game 1 at 1:00 pm.
    // Therefore r3 is busy when filtering ANY 1:00 pm game.
    const busy = refsBusyAsPlayers(TEST_TOURNAMENT, REFS_MAP, {}, 1)
    expect(busy.has('r3')).toBe(true)
    expect(busy.has('r5')).toBe(true) // T5 also plays at 1:00 pm (game 3)
    expect(busy.has('r1')).toBe(false) // r1 has no team — never filtered
  })

  it('does not filter refs without a team affiliation', () => {
    const busy = refsBusyAsPlayers(TEST_TOURNAMENT, REFS_MAP, {}, 1)
    expect(busy.has('r1')).toBe(false)
    expect(busy.has('r2')).toBe(false)
    expect(busy.has('r4')).toBe(false)
  })
})

describe('canEditScore', () => {
  const gameRefs: Record<GameId, GameRefAssignment> = {
    1: { head: 'r1', lines: [{ ref: 'r2' }, null] },
    2: EMPTY_ASSIGNMENT,
  }

  it('organiser can edit any game', () => {
    const auth: AuthState = { role: 'organiser', refId: null }
    expect(canEditScore(auth, gameRefs, 1)).toBe(true)
    expect(canEditScore(auth, gameRefs, 2)).toBe(true)
  })

  it('ref can edit only their assigned games', () => {
    const auth: AuthState = { role: 'ref', refId: 'r1' }
    expect(canEditScore(auth, gameRefs, 1)).toBe(true) // head
    expect(canEditScore(auth, gameRefs, 2)).toBe(false) // not assigned
  })

  it('player can never edit', () => {
    const auth: AuthState = { role: 'player', refId: null }
    expect(canEditScore(auth, gameRefs, 1)).toBe(false)
  })

  it('volunteer-team line slot does NOT grant edit access', () => {
    // line slot is { team: 'T3' }, not a ref slot; r3 (assigned to T3
    // as a player) shouldn't be auto-given edit rights.
    const refs: Record<GameId, GameRefAssignment> = {
      1: { head: null, lines: [{ team: 'T3' }, null] },
    }
    const auth: AuthState = { role: 'ref', refId: 'r3' }
    expect(canEditScore(auth, refs, 1)).toBe(false)
  })
})
