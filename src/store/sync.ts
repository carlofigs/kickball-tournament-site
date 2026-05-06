import { create } from 'zustand'
import { isSupabaseConfigured } from '@/lib/supabase'

/**
 * Connection status with Supabase. Drives the sticky-bar status dot
 * and the "Last sync" line on Account.
 *
 *   - "offline":      no Supabase configured (env vars missing) —
 *                     pure localStorage mode, dot stays grey
 *   - "connecting":   initial fetch in progress
 *   - "connected":    realtime channel SUBSCRIBED + last fetch ok
 *   - "reconnecting": channel TIMED_OUT or transient error
 *   - "error":        channel CHANNEL_ERROR / CLOSED unexpectedly
 *
 * `lastSyncAt` is bumped on every successful read or write so the
 * Account page can show how recent things are.
 */
export type SyncStatus =
  | 'offline'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

interface SyncStore {
  status: SyncStatus
  lastSyncAt: number | null
  errorMessage: string | null
  setStatus: (status: SyncStatus, errorMessage?: string | null) => void
  markSync: () => void
}

export const useSyncStore = create<SyncStore>()((set) => ({
  status: isSupabaseConfigured() ? 'connecting' : 'offline',
  lastSyncAt: null,
  errorMessage: null,
  setStatus: (status, errorMessage = null) =>
    set(() => ({ status, errorMessage })),
  markSync: () => set(() => ({ lastSyncAt: Date.now() })),
}))
