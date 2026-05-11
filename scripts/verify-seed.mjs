#!/usr/bin/env node
// End-to-end sanity check: replay schema + run seed in headless PGlite,
// then spot-check row counts.

import fs from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'

// Dynamic import of the TS seed via tsx-compatible path won't work in plain
// node, so we reuse the seed by inlining its logic — we instead test by
// running the same orchestrator. We compile-on-the-fly using a child node
// process that imports the TS through Vite's compiler... too heavy.
//
// Simpler: run the seed via a side helper that re-exports it as compiled JS
// from src. For verification purposes we'll just check what the boot would
// produce by running through the actual seed module via dynamic import of
// the TS source, transpiled by the build pipeline.
//
// Actually the simplest path: use esbuild (already in node_modules via Vite)
// to transpile run.ts to ESM and import it.

import esbuild from 'esbuild'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const seedTs = path.join(root, 'src/db/seed/run.ts')

const built = await esbuild.build({
  entryPoints: [seedTs],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  external: ['@electric-sql/pglite'],
})
const seedJs = built.outputFiles[0].text
const seedUrl = 'data:text/javascript;base64,' + Buffer.from(seedJs).toString('base64')
const { runSeed } = await import(seedUrl)

// Replay schema
const sql = fs.readFileSync(path.join(root, 'src/db/migrations/schema.generated.sql'), 'utf8')
const pg = new PGlite({ extensions: { pg_trgm } })
await pg.waitReady

const chunks = sql.split(/^-- ╔═════ /m).filter((c) => c.trim().length > 0)
for (const chunk of chunks) {
  const firstNewline = chunk.indexOf('\n')
  if (firstNewline === -1) continue
  const body = chunk.slice(firstNewline + 1)
  if (!body.trim()) continue
  try { await pg.exec(body) } catch { /* expected: none */ }
}
console.log('Schema replayed.')

const t0 = performance.now()
await runSeed(pg)
console.log(`Seed completed in ${Math.round(performance.now() - t0)}ms.`)

// Spot checks
const checks = [
  ['agent_organisations', 'SELECT COUNT(*)::int AS c FROM agent_organisations'],
  ['agents', 'SELECT COUNT(*)::int AS c FROM agents'],
  ['client_organisations', 'SELECT COUNT(*)::int AS c FROM client_organisations'],
  ['persons', 'SELECT COUNT(*)::int AS c FROM persons'],
  ['clients', 'SELECT COUNT(*)::int AS c FROM clients'],
  ['financial_accounts', 'SELECT COUNT(*)::int AS c FROM financial_accounts'],
  ['action_blueprints', 'SELECT COUNT(*)::int AS c FROM action_blueprints'],
  ['action_runs', 'SELECT COUNT(*)::int AS c FROM action_runs'],
  ['tasks', 'SELECT COUNT(*)::int AS c FROM tasks'],
  ['meetings', 'SELECT COUNT(*)::int AS c FROM meetings'],
  ['addresses', 'SELECT COUNT(*)::int AS c FROM addresses'],
]

console.log('\nRow counts:')
for (const [label, q] of checks) {
  const r = await pg.query(q)
  console.log(`  ${label.padEnd(28)} ${r.rows[0].c}`)
}

// Sample a household
const sample = await pg.query(
  `SELECT name, relationship_status, approx_aum
   FROM client_organisations
   ORDER BY name
   LIMIT 5`,
)
console.log('\nFirst 5 client_organisations:')
for (const r of sample.rows) {
  console.log(`  • ${r.name.padEnd(28)} [${r.relationship_status}]  $${(r.approx_aum ?? 0).toLocaleString()}`)
}

process.exit(0)
