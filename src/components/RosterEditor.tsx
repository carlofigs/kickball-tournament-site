import { useMemo, useState } from 'react'
import { Trash2, UserPlus } from 'lucide-react'
import { useTournamentStore } from '@/store/tournament'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Organiser-only roster table. Add a ref, rename inline, toggle
 * head-eligibility, or delete. All edits push to Supabase and arrive
 * on other devices via realtime.
 *
 * Deletes leave existing assignments orphaned (showing "Unknown ref"
 * in badges + dropdowns) — the organiser sees what they broke and
 * fixes manually. Per the design call: silent cascade is the kind of
 * thing that bites you later.
 */
export function RosterEditor() {
  const refsMap = useTournamentStore((s) => s.refs)
  const addRef = useTournamentStore((s) => s.addRef)
  const updateRef = useTournamentStore((s) => s.updateRef)
  const deleteRef = useTournamentStore((s) => s.deleteRef)

  const sortedRefs = useMemo(
    () => Object.values(refsMap).sort((a, b) => a.name.localeCompare(b.name)),
    [refsMap],
  )

  const [newName, setNewName] = useState('')
  const [newHeadEligible, setNewHeadEligible] = useState(false)

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    addRef(name, newHeadEligible)
    setNewName('')
    setNewHeadEligible(false)
  }

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the roster?`)) return
    deleteRef(id)
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden mb-4">
      <div className="px-3 py-2 border-b bg-secondary text-sm font-extrabold">
        Roster ({sortedRefs.length})
      </div>

      {sortedRefs.length === 0 ? (
        <div className="px-3 py-4 text-sm text-muted-foreground italic">
          No refs yet — add one below.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
              <th className="text-left px-3 py-2 font-extrabold">Name</th>
              <th className="px-3 py-2 font-extrabold w-32 sm:w-40">Head-eligible</th>
              <th className="px-3 py-2 font-extrabold w-12" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {sortedRefs.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-1.5">
                  <Input
                    value={r.name}
                    onChange={(e) => updateRef(r.id, { name: e.target.value })}
                    className="h-8 text-sm"
                    aria-label={`Name for ref ${r.name}`}
                  />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={r.headEligible}
                    onChange={(e) =>
                      updateRef(r.id, { headEligible: e.target.checked })
                    }
                    className="h-4 w-4 accent-primary cursor-pointer"
                    aria-label={`${r.name} head-eligible`}
                  />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(r.id, r.name)}
                    aria-label={`Remove ${r.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add-ref row */}
      <div className="border-t bg-secondary/40 p-3 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
        <div>
          <Label htmlFor="roster-new-name" className="text-[0.7rem] uppercase tracking-wider font-extrabold text-muted-foreground">
            New ref
          </Label>
          <Input
            id="roster-new-name"
            value={newName}
            placeholder="Name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
            className="mt-1 h-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm pb-2 sm:pb-1 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={newHeadEligible}
            onChange={(e) => setNewHeadEligible(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Head-eligible
        </label>
        <Button onClick={handleAdd} disabled={!newName.trim()} className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  )
}
