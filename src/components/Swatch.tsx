import { TOURNAMENT } from '@/lib/tournament'
import type { TeamName } from '@/lib/schemas'
import { cn } from '@/lib/utils'

interface SwatchProps {
  team?: TeamName | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<SwatchProps['size']>, string> = {
  sm: 'w-3 h-3 rounded-sm',
  md: 'w-[18px] h-[18px] rounded',
  lg: 'w-7 h-7 rounded-md',
}

/**
 * Coloured square mapped to a team's brand colour. Renders a hatched
 * placeholder when the team is unknown / not yet resolved (e.g. a
 * "Winner of Game 5" slot that hasn't been decided).
 */
export function Swatch({ team, size = 'md', className }: SwatchProps) {
  const teamObj = team ? TOURNAMENT.teams.find((t) => t.name === team) : undefined
  return (
    <span
      aria-hidden
      className={cn('shrink-0 border border-black/15', SIZE_CLASSES[size], className)}
      style={
        teamObj
          ? { backgroundColor: teamObj.colour }
          : {
              backgroundImage:
                'repeating-linear-gradient(45deg, #e2e8f0 0 4px, #cbd5e1 4px 8px)',
            }
      }
    />
  )
}
