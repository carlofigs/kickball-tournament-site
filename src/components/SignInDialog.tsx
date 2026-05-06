import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/store/auth'
import { TOURNAMENT } from '@/lib/tournament'

interface SignInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'pin' | 'ref-name'

/**
 * Two-step sign-in:
 *  1. PIN entry. Organiser PIN signs in directly. Ref PIN advances to
 *     step 2.
 *  2. Pick which ref you are from the roster (only shown after ref PIN
 *     was correct in step 1).
 *
 * Auth state is stored per-device by `useAuthStore` so refs only do
 * this once on each phone they bring to the fields.
 */
export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const signInOrganiser = useAuthStore((s) => s.signInOrganiser)
  const isRefPin = useAuthStore((s) => s.isRefPin)
  const signInRef = useAuthStore((s) => s.signInRef)

  const [step, setStep] = useState<Step>('pin')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [chosenRef, setChosenRef] = useState<string>(TOURNAMENT.refs[0]?.id ?? '')

  // Reset when dialog reopens.
  useEffect(() => {
    if (open) {
      setStep('pin')
      setPin('')
      setError(null)
      setChosenRef(TOURNAMENT.refs[0]?.id ?? '')
    }
  }, [open])

  const handleConfirm = () => {
    if (step === 'pin') {
      if (signInOrganiser(pin)) {
        onOpenChange(false)
        return
      }
      if (isRefPin(pin)) {
        setStep('ref-name')
        setError(null)
        return
      }
      setError('Wrong PIN.')
      return
    }
    // step === 'ref-name'
    if (!chosenRef) return
    signInRef(chosenRef)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {step === 'pin' ? 'Sign in' : 'Who are you?'}
          </DialogTitle>
          <DialogDescription>
            {step === 'pin'
              ? 'Enter your PIN to unlock score editing.'
              : 'Pick your name from the roster.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'pin' ? (
          <div className="space-y-2">
            <Label htmlFor="auth-pin" className="sr-only">
              PIN
            </Label>
            <Input
              id="auth-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={8}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm()
              }}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive font-semibold">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="auth-ref">Ref</Label>
            <Select value={chosenRef} onValueChange={setChosenRef}>
              <SelectTrigger id="auth-ref">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOURNAMENT.refs.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                    {r.headEligible ? ' (head-eligible)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            {step === 'pin' ? 'Continue' : 'Sign in'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
