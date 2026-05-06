import { cn } from '@/lib/utils'

interface ScoreCellProps {
  value: number | null
  editable: boolean
  /** Required when editable; ignored when read-only. */
  onChange?: (value: number | null) => void
  ariaLabel: string
  /** When true, render an empty cell (used for unresolved teams). */
  disabled?: boolean
}

/**
 * Score input on the schedule. Renders an `<input>` for refs/organisers
 * with edit permission on this game; renders a read-only span for
 * everyone else (players, refs viewing other refs' games).
 */
export function ScoreCell({
  value,
  editable,
  onChange,
  ariaLabel,
  disabled,
}: ScoreCellProps) {
  const baseClasses =
    'w-12 h-9 flex items-center justify-center text-center text-base font-extrabold rounded-md border-2'

  if (!editable) {
    return (
      <div
        className={cn(
          baseClasses,
          'bg-secondary border-border',
          value == null && 'text-muted-foreground font-semibold',
        )}
        aria-label={ariaLabel}
      >
        {value == null ? '—' : value}
      </div>
    )
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      pattern="[0-9]*"
      disabled={disabled}
      value={value == null ? '' : value}
      onChange={(e) => {
        const raw = e.currentTarget.value.trim()
        const parsed = raw === '' ? null : Math.max(0, parseInt(raw, 10) || 0)
        onChange?.(parsed)
      }}
      aria-label={ariaLabel}
      className={cn(
        baseClasses,
        'bg-secondary border-border text-foreground',
        'focus:outline-none focus:border-primary focus:bg-card',
        'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
        '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
      )}
    />
  )
}
