import { createContext, useContext, useEffect, useState } from 'react'
import type { PGlite } from '@electric-sql/pglite'
import { getDb, onBootStatus, type BootStatus } from './client'

/**
 * React provider that gates rendering until the in-browser database is ready.
 *
 * Sits between AppPasswordGate and ConfigOverlayProvider in App.tsx — the
 * password gate runs first (no DB needed), then we boot the DB, then the
 * rest of the app renders.
 *
 * Boot takes a couple of seconds on a cold load (PGlite WASM + 31k lines of
 * DDL). The splash component below shows progress so the wait feels intentional.
 */

interface PGliteContextValue {
  pg: PGlite
}

const PGliteContext = createContext<PGliteContextValue | null>(null)

export function usePGlite(): PGlite {
  const ctx = useContext(PGliteContext)
  if (!ctx) throw new Error('usePGlite must be used inside PGliteProvider')
  return ctx.pg
}

export function PGliteProvider({ children }: { children: React.ReactNode }) {
  const [pg, setPg] = useState<PGlite | null>(null)
  const [status, setStatus] = useState<BootStatus>({
    phase: 'instantiate',
    message: 'Starting…',
    elapsedMs: 0,
  })

  useEffect(() => {
    const off = onBootStatus(setStatus)
    let cancelled = false
    getDb().then((instance) => {
      if (!cancelled) setPg(instance)
    })
    return () => {
      cancelled = true
      off()
    }
  }, [])

  if (!pg) return <BootSplash status={status} />

  // Expose for DevTools inspection.
  ;(globalThis as unknown as { __db: PGlite }).__db = pg

  return (
    <PGliteContext.Provider value={{ pg }}>{children}</PGliteContext.Provider>
  )
}

function BootSplash({ status }: { status: BootStatus }) {
  const isError = status.phase === 'error'
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="text-center max-w-sm px-6">
        <div className="mb-4 flex items-center justify-center">
          {!isError ? (
            <div className="h-10 w-10 rounded-full border-4 border-foreground/10 border-t-foreground animate-spin" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold">
              !
            </div>
          )}
        </div>
        <h2 className="text-sm font-semibold text-foreground mb-1">
          {isError ? 'Database failed to start' : 'Loading prototype data'}
        </h2>
        <p className="text-xs text-muted-foreground leading-snug">
          {status.message}
        </p>
        {!isError && status.elapsedMs > 0 && (
          <p className="mt-3 text-[10px] text-muted-foreground/60 tabular-nums">
            {(status.elapsedMs / 1000).toFixed(1)}s
          </p>
        )}
        {isError && (
          <p className="mt-4 text-[11px] text-muted-foreground">
            Open DevTools for details. Check{' '}
            <code className="px-1 py-0.5 rounded bg-muted text-foreground">
              globalThis.__dbSchemaFailures
            </code>{' '}
            for any per-migration failures.
          </p>
        )}
      </div>
    </div>
  )
}
