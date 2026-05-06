import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { AuthState, RefId, Role } from '@/lib/schemas'
import { TOURNAMENT } from '@/lib/tournament'

/**
 * Auth lives in its own localStorage key (NOT in tournament state) so
 * it doesn't ride along when scores are exported between devices.
 *
 * "Soft auth" only — the PINs and roster are visible to anyone who
 * reads the source. Acceptable for tournament-day trust between
 * organisers/refs/players who know each other.
 */
const STORAGE_KEY = 'kickball-tournament-2026-auth-v1'

interface AuthStore extends AuthState {
  /** Returns true on success; false on wrong PIN. */
  signInOrganiser: (pin: string) => boolean
  /** Step 1 of ref sign-in: returns true if PIN is correct. */
  isRefPin: (pin: string) => boolean
  /** Step 2 of ref sign-in: commits the chosen ref identity. */
  signInRef: (refId: RefId) => void
  signOut: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set) => ({
      role: 'player' as Role,
      refId: null,

      signInOrganiser: (pin) => {
        if (pin !== TOURNAMENT.pins.organiser) return false
        set((s) => {
          s.role = 'organiser'
          s.refId = null
        })
        return true
      },

      isRefPin: (pin) => pin === TOURNAMENT.pins.ref,

      signInRef: (refId) => {
        // No static validation — the SignInDialog populates the
        // picker from the live roster, and refs are dynamic now.
        set((s) => {
          s.role = 'ref'
          s.refId = refId
        })
      },

      signOut: () =>
        set((s) => {
          s.role = 'player'
          s.refId = null
        }),
    })),
    {
      name: STORAGE_KEY,
      // No rehydrate-time roster validation: refs are dynamic now,
      // and the live roster isn't loaded until after Supabase syncs.
      // Stale refIds (ref deleted by another organiser) surface as
      // "Unknown" in the UI rather than auto-signing the user out.
    },
  ),
)
