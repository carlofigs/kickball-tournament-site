import { useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import { useTournamentStore, exportTournamentState } from '@/store/tournament'
import { Button } from '@/components/ui/button'
import { AccountState } from '@/components/AccountState'

export function Account() {
  const role = useAuthStore((s) => s.role)

  return (
    <section>
      <h2 className="text-xl font-extrabold mb-3">Account</h2>
      <AccountState />
      {role === 'organiser' && <AdminTools />}
    </section>
  )
}

/**
 * Organiser-only admin tools. Export/import bundle scores + ref
 * assignments together — share between phones to sync. Auth state is
 * NOT exported (lives in a separate localStorage key).
 *
 * In Phase 3 these will be replaced by realtime sync; for now the
 * manual export/import keeps multiple devices loosely in step.
 */
function AdminTools() {
  const importState = useTournamentStore((s) => s.importState)
  const resetAll = useTournamentStore((s) => s.resetAll)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = exportTournamentState()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eckb-tournament-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => fileRef.current?.click()

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(String(ev.target?.result ?? ''))
        const incoming = obj.state ?? obj
        if (!incoming.games) throw new Error('Missing games key')
        importState({ games: incoming.games, gameRefs: incoming.gameRefs ?? {} })
        alert('Imported.')
      } catch (err) {
        alert('Import failed: ' + (err instanceof Error ? err.message : String(err)))
      } finally {
        if (fileRef.current) fileRef.current.value = ''
      }
    }
    reader.readAsText(f)
  }

  const handleReset = () => {
    if (!window.confirm('Reset all scores and ref assignments? This cannot be undone.')) return
    resetAll()
  }

  return (
    <div className="bg-card border rounded-lg p-4">
      <h3 className="font-extrabold text-base mb-1">Organiser tools</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Scores and ref assignments save to this device. To share state across
        phones, export the JSON, send it to another organiser, and import on
        their device. Realtime sync arrives in Phase 3.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleExport}>Export JSON</Button>
        <Button variant="outline" onClick={handleImportClick}>
          Import JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleImportFile}
        />
        <Button variant="destructive" onClick={handleReset}>
          Reset all
        </Button>
      </div>
    </div>
  )
}
