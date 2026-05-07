import { create } from 'zustand'
import { isSupabaseConfigured } from '@/lib/supabase'

/**
 * Connection status with Supabase. Drives the sticky-bar status dot
 * and the "Last sync" line on Account.
 *
 * The realtime channel is the single source of truth for status —
 * fetches don't touch it (they'd lie on visibility-resume re-fetches
 * where the channel is still happily SUBSCRIBED).
 *
 *   - "offline":      no Supabase configured (env vars missing) —
 *                     pure localStorage mode, dot stays grey
 *   - "connecting":   bootstrap until channel SUBSCRIBED fires
 *   - "connected":    realtime channel SUBSCRIBED
 *   - "reconnecting": channel TIMED_OUT / CLOSED, retrying
 *   - "error":        channel CHANNEL_ERROR
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
