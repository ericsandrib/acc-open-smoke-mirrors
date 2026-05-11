#!/usr/bin/env node
// Headless sanity check: load the generated schema into PGlite (which runs
// fine in Node too) and report which migrations failed.
//
// Run with: node scripts/verify-schema.mjs
//
// Output:
//   • count of migrations executed
//   • count of failures
//   • first 10 failures with their error
//   • count of tables created at the end
//   • basic spot checks for the tables we plan to seed against

import fs from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname))
const schemaPath = path.join(root, 'src/db/migrations/schema.generated.sql')
const sql = fs.readFileSync(schemaPath, 'utf8')

console.log(`Schema file: ${(sql.length / 1024).toFixed(0)}KB`)

const pg = new PGlite({ extensions: { pg_trgm } })
await pg.waitReady
console.log('PGlite instantiated.')

const chunks = sql.split(/^-- ╔═════ /m).filter((c) => c.trim().length > 0)
console.log(`Migration chunks: ${chunks.length}`)

let ok = 0
let fail = 0
const failures = []

const t0 = performance.now()
for (const chunk of chunks) {
  const firstNewline = chunk.indexOf('\n')
  if (firstNewline === -1) continue
  const name = chunk.slice(0, firstNewline).replace(/\s*═.*$/, '').trim()
  const body = chunk.slice(firstNewline + 1)
  if (!body.trim()) continue
  try {
    await pg.exec(body)
    ok++
  } catch (err) {
    fail++
    failures.push({ name, error: err.message.split('\n')[0] })
  }
}
const elapsed = Math.round(performance.now() - t0)

console.log(`\nReplay complete in ${elapsed}ms.`)
console.log(`  OK:     ${ok}`)
console.log(`  Failed: ${fail}`)

if (failures.length > 0) {
  console.log('\nFirst 15 failures:')
  for (const f of failures.slice(0, 15)) {
    console.log(`  • ${f.name}`)
    console.log(`      ${f.error}`)
  }
}

// Table inventory
const tablesRes = await pg.query(
  `SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
   ORDER BY table_name`,
)
console.log(`\nTables created: ${tablesRes.rows.length}`)

// Spot-check critical tables for our 8 tabs
const criticalTables = [
  'persons',
  'clients',
  'client_organisations',
  'agents',
  'agent_organisations',
  'agent_client_organisation_relationships',
  'financial_accounts',
  'action_blueprints',
  'action_runs',
  'tasks',
  'meetings',
  'addresses',
]
const presentNames = new Set(tablesRes.rows.map((r) => r.table_name))
console.log('\nCritical tables for the prototype:')
for (const t of criticalTables) {
  console.log(`  ${presentNames.has(t) ? '✓' : '✗'} ${t}`)
}

// Save full failure list for inspection
if (failures.length > 0) {
  const outFile = path.join(root, 'src/db/migrations/_failures.json')
  fs.writeFileSync(outFile, JSON.stringify(failures, null, 2))
  console.log(`\nFull failure list written to: ${outFile}`)
}

process.exit(0)
