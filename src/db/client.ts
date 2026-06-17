// PGlite singleton — Postgres in WebAssembly, in-memory.
//
// One database per browser tab. State resets on reload. This matches the
// "per-session isolated state" decision: no IndexedDB persistence, no shared
// state between users, no "who broke the demo" risk.
//
// Boot sequence:
//   1. Instantiate PGlite (in-memory)
//   2. Replay the consolidated upstream Avantos schema
//   3. Run the synthetic seed
//   4. Resolve `ready`
//
// The schema file is large (~1.3MB, ~31k lines). PGlite executes it in a
// couple seconds; we surface a loading splash while it runs.

import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import schemaSql from './migrations/schema.generated.sql?raw'
import { runSeed } from './seed/run'

let _pg: PGlite | null = null
let _ready: Promise<PGlite> | null = null

export interface BootStatus {
  phase: 'instantiate' | 'schema' | 'seed' | 'ready' | 'error'
  message: string
  /** Wall-clock ms since boot started, for the splash UI to show progress. */
  elapsedMs: number
}

type StatusListener = (s: BootStatus) => void
const _listeners = new Set<StatusListener>()

function emit(s: BootStatus) {
  for (const l of _listeners) l(s)
}

export function onBootStatus(l: StatusListener) {
  _listeners.add(l)
  return () => _listeners.delete(l)
}

/** Get the live PGlite instance. Resolves only after boot completes. */
export function getDb(): Promise<PGlite> {
  if (_ready) return _ready
  _ready = bootDb()
  return _ready
}

async function bootDb(): Promise<PGlite> {
  const start = performance.now()
  const since = () => Math.round(performance.now() - start)

  emit({ phase: 'instantiate', message: 'Starting in-browser database…', elapsedMs: since() })

  try {
    const pg = new PGlite({ extensions: { pg_trgm } })
    await pg.waitReady

    emit({
      phase: 'schema',
      message: 'Replaying Avantos schema (649 migrations)…',
      elapsedMs: since(),
    })

    await execSchema(pg, schemaSql)

    emit({ phase: 'seed', message: 'Seeding synthetic data…', elapsedMs: since() })
    await runSeed(pg)

    _pg = pg
    emit({ phase: 'ready', message: `Ready in ${since()}ms`, elapsedMs: since() })
    return pg
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    emit({ phase: 'error', message: `Boot failed: ${msg}`, elapsedMs: since() })
    throw err
  }
}

/**
 * Execute the consolidated schema. PGlite's `exec` runs multiple statements
 * in one call, but if any fail the whole batch aborts. To keep boot resilient
 * we split on a marker we control (the `-- ╔═════ filename ═════╗` headers
 * the build script emits) and run each migration as its own transaction.
 *
 * Failures inside a single migration are logged but don't abort boot — we
 * note the count and surface it in dev console so we can patch later.
 */
async function execSchema(pg: PGlite, sql: string) {
  // Split by the per-migration banner. The first chunk is the file header
  // (comments only), the rest are migration bodies.
  const chunks = sql.split(/^-- ╔═════ /m).filter((c) => c.trim().length > 0)
  let okCount = 0
  let skipCount = 0
  const failures: Array<{ name: string; error: string }> = []

  for (const chunk of chunks) {
    // First line of each chunk is `<filename> ═════╗` — extract for logging.
    const firstNewline = chunk.indexOf('\n')
    if (firstNewline === -1) continue
    const headerLine = chunk.slice(0, firstNewline)
    const name = headerLine.replace(/\s*═.*$/, '').trim()
    const body = chunk.slice(firstNewline + 1)
    if (!body.trim()) continue

    try {
      await pg.exec(body)
      okCount++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      failures.push({ name, error: msg })
      skipCount++
    }
  }

  if (failures.length > 0 && typeof console !== 'undefined') {
    console.warn(
      `[db] Schema replay: ${okCount} migrations OK, ${skipCount} skipped.`,
    )
    console.warn('[db] First few failures:', failures.slice(0, 5))
    // Expose for inspection in DevTools.
    ;(globalThis as unknown as { __dbSchemaFailures: typeof failures }).__dbSchemaFailures = failures
  } else {
    console.log(`[db] Schema replay: ${okCount} migrations OK`)
  }
}

/** Synchronous accessor — only safe to call after `ready` has resolved. */
export function db(): PGlite {
  if (!_pg) throw new Error('Database not ready yet. Await getDb() first.')
  return _pg
}
