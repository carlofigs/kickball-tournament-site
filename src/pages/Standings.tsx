import { TOURNAMENT } from '@/lib/tournament'
import { useTournamentStore } from '@/store/tournament'
import { r1Losers, rankLosers } from '@/lib/star'
import { isComplete } from '@/lib/games'
import { Swatch } from '@/components/Swatch'
import { cn } from '@/lib/utils'

export function Standings() {
  const games = useTournamentStore((s) => s.games)
  const losers = r1Losers(TOURNAMENT, games)

  return (
    <section>
      <h2 className="text-xl font-extrabold mb-3">
        Round 1 Standings (Star contention)
      </h2>
      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-sm mb-3">
        <strong>Star team rules:</strong> the best-performing R1 loser advances
        to Game 12 as the 8th QF team. Sorted by run differential, then runs
        scored, then head-to-head (see <code>STAR_TIEBREAKERS</code> in{' '}
        <code>src/lib/star.ts</code> for the configurable order).
      </div>

      {losers === null ? <PendingNotice /> : <LoserTable losers={losers} />}
    </section>
  )
}

function PendingNotice() {
  const games = useTournamentStore((s) => s.games)
  const r1 = TOURNAMENT.games.filter((g) => g.round === 'R1')
  const done = r1.filter((g) => isComplete(games[g.id])).length
  return (
    <div className="bg-card border rounded-lg p-4 text-sm">
      <p>
        <strong>Waiting for Round 1.</strong> {done} of {r1.length} games
        complete. The Star team will populate here once all 7 R1 games have
        winners.
      </p>
    </div>
  )
}

function LoserTable({ losers }: { losers: ReturnType<typeof r1Losers> }) {
  if (!losers) return null
  const ranked = rankLosers(losers)
  const star = ranked[0]
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary text-[0.7rem] uppercase tracking-wider text-muted-foreground">
            <th className="px-2 py-2 font-extrabold">#</th>
            <th className="px-2 py-2 font-extrabold text-left">Team</th>
            <th className="px-2 py-2 font-extrabold">R1 Game</th>
            <th className="px-2 py-2 font-extrabold">Run Diff</th>
            <th className="px-2 py-2 font-extrabold">RS</th>
            <th className="px-2 py-2 font-extrabold">RA</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((l, i) => {
            const isStar = l.team === star.team
            return (
              <tr
                key={l.team}
                className={cn(
                  'border-t text-center',
                  isStar && 'bg-gradient-to-r from-yellow-100 to-amber-100',
                )}
              >
                <td className="px-2 py-2 font-bold">
                  {isStar && <span aria-hidden className="text-amber-600">★ </span>}
                  {i + 1}
                </td>
                <td className="px-2 py-2 font-bold text-left">
                  <span className="inline-flex items-center gap-2">
                    <Swatch team={l.team} />
                    {l.team}
                  </span>
                </td>
                <td className="px-2 py-2">G{l.gameId}</td>
                <td className="px-2 py-2">
                  {l.runDiff > 0 ? '+' : ''}
                  {l.runDiff}
                </td>
                <td className="px-2 py-2">{l.runs}</td>
                <td className="px-2 py-2">{l.allowed}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
