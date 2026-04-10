import { useState, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'acc-open-demo-auth'

function readUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Demo gate: client-side only; not a substitute for real authentication. */
export function AppPasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(readUnlocked)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const ACCESS_PASSWORD = 'Avantos2026'

  const submit = () => {
    const next = value.trim()
    if (next === ACCESS_PASSWORD) {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* ignore */
      }
      setError(false)
      setUnlocked(true)
      setValue('')
      return
    }
    setError(true)
  }

  if (unlocked) {
    return <>{children}</>
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-6">
      <div
        className={cn(
          'w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm',
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Password required</h1>
          <p className="text-sm text-muted-foreground">
            Enter the access password to use this application.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="app-access-password">Password</Label>
            <Input
              id="app-access-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError(false)
              }}
              className={cn(error && 'border-destructive focus-visible:ring-destructive/30')}
              placeholder="Password"
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive" role="alert">
                Incorrect password. Try again.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  )
}
