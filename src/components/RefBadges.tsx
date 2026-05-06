import type { GameRefAssignment } from '@/lib/schemas'
import { useTournamentStore } from '@/store/tournament'
import { Swatch } from '@/components/Swatch'
import { cn } from '@/lib/utils'

interface RefBadgesProps {
  assignment: GameRefAssignment | undefined
  /**
   * When `compact`, badges shrink — used inside bracket cards where
   * vertical space is tight.
   */
  compact?: boolean
}

/**
 * Inline summary of the refs assigned to a game. Read-only — used on
 * Schedule, Up Next, and Bracket. The Refs management page renders
 * editable cells separately.
 */
export function RefBadges({ assignment, compact }: RefBadgesProps) {
  const refs = useTournamentStore((s) => s.refs)
  if (!assignment) return null
  const head = assignment.head ? refs[assignment.head] : null
  // Track if the assignment references a refId that's been deleted —
  // we still surface it (with a warning style) so an organiser can
  // see which game is mis-wired.
  const headOrphan = assignment.head && !head
  const lineNodes = assignment.lines
    .map((slot, i) => {
      if (!slot) return null
      if ('ref' in slot) {
        const r = refs[slot.ref]
        if (!r) {
          return (
            <Badge key={i} variant="missing" compact={compact}>
              ⚠ Unknown ref
            </Badge>
          )
        }
        return (
          <Badge key={i} compact={compact}>
            {r.name}
          </Badge>
        )
      }
      // Volunteer team — show coloured swatch + team name
      return (
        <Badge key={i} variant="volunteer" compact={compact}>
          <Swatch team={slot.team} size="sm" />
          <span>{slot.team}</span>
        </Badge>
      )
    })
    .filter(Boolean)

  if (!head && !headOrphan && lineNodes.length === 0) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 text-xs',
        compact ? 'mt-1.5' : 'mt-2',
      )}
    >
      <span className="text-[0.65rem] uppercase tracking-wider font-extrabold text-muted-foreground mr-0.5">
        Refs
      </span>
      {head && (
        <Badge variant="head" compact={compact}>
          ★ {head.name}
        </Badge>
      )}
      {headOrphan && (
        <Badge variant="missing" compact={compact}>
          ⚠ Unknown head ref
        </Badge>
      )}
      {lineNodes}
    </div>
  )
}

interface BadgeProps {
  variant?: 'default' | 'head' | 'volunteer' | 'missing'
  compact?: boolean
  children: React.ReactNode
}

function Badge({ variant = 'default', compact, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-semibold leading-tight',
        compact ? 'px-1.5 py-0.5 text-[0.7rem]' : 'px-1.5 py-0.5',
        variant === 'default' && 'bg-secondary text-foreground',
        variant === 'head' && 'bg-pride-mint-deep text-pride-mint',
        variant === 'volunteer' && 'bg-amber-100 text-amber-900 italic',
        variant === 'missing' && 'bg-red-100 text-red-800 italic',
      )}
    >
      {children}
    </span>
  )
}
