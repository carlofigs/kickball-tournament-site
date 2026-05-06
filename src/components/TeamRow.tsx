import { Swatch } from '@/components/Swatch'
import type { TeamName } from '@/lib/schemas'
import { cn } from '@/lib/utils'

interface TeamRowProps {
  team: TeamName | null
  /** Human label — either the resolved team name or "Winner of Game 5". */
  label: string
  /**
   * Visual state:
   *  - "tbd"     — placeholder (not yet resolved)
   *  - "winner"  — game is decided, this team won
   *  - "loser"   — game is decided, this team lost
   *  - undefined — known team, game not yet decided
   */
  state?: 'tbd' | 'winner' | 'loser'
}

export function TeamRow({ team, label, state }: TeamRowProps) {
  return (
    <div className="flex items-center gap-2 py-1 [&+&]:border-t [&+&]:border-dashed [&+&]:border-border">
      <Swatch team={team} />
      <span
        className={cn(
          'flex-1 truncate font-semibold',
          state === 'tbd' && 'text-muted-foreground italic font-medium',
          state === 'winner' && 'text-emerald-700',
          state === 'loser' && 'text-muted-foreground line-through',
        )}
      >
        {label}
        {state === 'winner' && <span aria-hidden> ✓</span>}
      </span>
    </div>
  )
}
