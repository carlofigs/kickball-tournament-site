import { TOURNAMENT } from '@/lib/tournament'
import { useTournamentStore } from '@/store/tournament'
import { isComplete } from '@/lib/games'
import { NextSlotCard } from '@/components/NextSlotCard'

export function Home() {
  const games = useTournamentStore((s) => s.games)
  const total = TOURNAMENT.games.length
  const played = TOURNAMENT.games.filter((g) => isComplete(games[g.id])).length
  const remaining = total - played

  return (
    <div>
      <Hero />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat num={total} label="Games" />
        <Stat num={played} label="Played" />
        <Stat num={remaining} label="Remaining" />
      </div>

      <NextSlotCard />
    </div>
  )
}

function Hero() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#008026] to-[#016934] text-white p-6 mb-4 relative overflow-hidden">
      <div className="text-xs uppercase tracking-wider opacity-80">
        {TOURNAMENT.dateLabel}
      </div>
      <h1 className="text-2xl font-extrabold mt-1">{TOURNAMENT.title}</h1>
      <div className="text-sm opacity-90 mt-1">
        {TOURNAMENT.teams.length} teams · 4 fields · one big day
      </div>
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1.5 bg-pride-stripe"
      />
    </div>
  )
}

function Stat({ num, label }: { num: number; label: string }) {
  return (
    <div className="text-center bg-card border rounded-xl py-2 px-1">
      <div className="text-2xl font-extrabold text-primary leading-none">{num}</div>
      <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-bold mt-1">
        {label}
      </div>
    </div>
  )
}
