import { TOURNAMENT } from '@/lib/tournament'

/**
 * Phase 1 placeholder — wires up the team grid as a sanity check
 * that config + Tailwind theming both work end-to-end.
 */
export function Teams() {
  return (
    <div>
      <h2 className="text-xl font-extrabold mb-3">Teams</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {TOURNAMENT.teams.map((t) => (
          <div
            key={t.name}
            className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg font-bold"
          >
            <span
              aria-hidden
              className="w-7 h-7 rounded-md border border-black/15"
              style={{ backgroundColor: t.colour }}
            />
            <span>{t.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
