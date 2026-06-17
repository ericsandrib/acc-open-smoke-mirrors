#!/usr/bin/env node
// Print the column shape of the tables we plan to seed against.
// Reads schema.generated.sql into a fresh PGlite, then introspects.

import fs from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname))
const sql = fs.readFileSync(path.join(root, 'src/db/migrations/schema.generated.sql'), 'utf8')

const pg = new PGlite({ extensions: { pg_trgm } })
await pg.waitReady

const chunks = sql.split(/^-- ╔═════ /m).filter((c) => c.trim().length > 0)
for (const chunk of chunks) {
  const firstNewline = chunk.indexOf('\n')
  if (firstNewline === -1) continue
  const body = chunk.slice(firstNewline + 1)
  if (!body.trim()) continue
  try {
    await pg.exec(body)
  } catch {
    // ignore — already vetted via verify-schema.mjs
  }
}

const tables = [
  'persons',
  'addresses',
  'agent_organisations',
  'agents',
  'client_organisations',
  'clients',
  'agent_client_organisation_relationships',
  'address_entity_relationships',
  'financial_accounts',
  'action_blueprints',
  'action_runs',
  'tasks',
  'meetings',
  'meeting_attendees',
]

for (const t of tables) {
  const cols = await pg.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1
     ORDER BY ordinal_position`,
    [t],
  )
  console.log(`\n--- ${t} (${cols.rows.length} cols) ---`)
  for (const c of cols.rows) {
    const nn = c.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'
    const def = c.column_default ? ` DEFAULT ${c.column_default}` : ''
    console.log(`  ${c.column_name.padEnd(40)} ${c.data_type.padEnd(28)} ${nn}${def}`)
  }
}

process.exit(0)
