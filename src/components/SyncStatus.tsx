import { useSyncStore, type SyncStatus as SyncStatusValue } from '@/store/sync'
import { cn } from '@/lib/utils'

const COLOR: Record<SyncStatusValue, string> = {
  offline:      'bg-neutral-400',
  connecting:   'bg-amber-400 animate-pulse',
  connected:    'bg-emerald-400',
  reconnecting: 'bg-amber-400 animate-pulse',
  error:        'bg-red-500 animate-pulse',
}

const LABEL: Record<SyncStatusValue, string> = {
  offline:      'Offline only — Supabase not configured',
  connecting:   'Connecting…',
  connected:    'Live',
  reconnecting: 'Reconnecting…',
  error:        'Sync error',
}

/**
 * Tiny status dot for the sticky banner. Tooltip via the native
 * `title` attribute so long-press also works on mobile. Hidden when
 * Supabase isn't configured (purely localStorage mode) — there's no
 * sync to indicate.
 */
export function SyncStatus() {
  const status = useSyncStore((s) => s.status)
  const errorMessage = useSyncStore((s) => s.errorMessage)
  if (status === 'offline') return null

  const tooltip = errorMessage ? `${LABEL[status]} — ${errorMessage}` : LABEL[status]

  return (
    <div
      className="flex items-center gap-1.5 px-2 text-[0.7rem] text-neutral-300"
      title={tooltip}
      aria-label={tooltip}
    >
      <span className={cn('w-2 h-2 rounded-full', COLOR[status])} aria-hidden />
      <span className="hidden sm:inline">{LABEL[status]}</span>
    </div>
  )
}
