import { TOURNAMENT } from '@/lib/tournament'
import { useAuthStore } from '@/store/auth'
import { RefAssignmentRow } from '@/components/RefAssignmentRow'

/**
 * Organiser-only management page. The tab itself is hidden for
 * non-organisers in AppShell, but this gate handles deep-link visits
 * (e.g. someone hits /refs directly) so the page never leaks the
 * editable controls.
 */
export function Refs() {
  const role = useAuthStore((s) => s.role)

  if (role !== 'organiser') {
    return (
      <section>
        <h2 className="text-xl font-extrabold mb-3">Ref assignments</h2>
        <div className="bg-card border rounded-lg p-4 text-sm text-muted-foreground">
          Sign in as an organiser to manage refs.
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-xl font-extrabold mb-1">Ref assignments</h2>
      <p className="text-sm text-muted-foreground mb-3">
        Pick the head ref (head-eligible only) and {TOURNAMENT.linesPerGame} line
        refs for each game. If no line ref is free at that time, set the slot
        to <em>Volunteer team</em> and a team's player will fill in. Refs
        already assigned to another concurrent game are filtered out
        automatically. Empty slots are highlighted in red.
      </p>

      <div className="space-y-2">
        {TOURNAMENT.games.map((g) => (
          <RefAssignmentRow key={g.id} game={g} />
        ))}
      </div>
    </section>
  )
}
