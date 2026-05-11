#!/usr/bin/env node
// Consolidate the upstream Avantos migrations into a single Up-only SQL file
// that PGlite can replay at boot.
//
// Reads from   ~/Documents/Schwab/avantos-upstream/avantos/backend/schemata/migrations/*.sql
// Writes to    src/db/migrations/schema.generated.sql
// Companion patch log at src/db/migrations/_patches.md
//
// The upstream uses `sql-migrate` directives:
//
//     -- +migrate Up
//     <statements>
//     -- +migrate Down
//     <statements>
//
// We extract only the Up portion of each file and concatenate in
// chronological (filename) order.
//
// Run with:    node scripts/build-schema.mjs
// Or via:      pnpm build:schema

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const UPSTREAM_DIR = path.join(
  os.homedir(),
  'Documents/Schwab/avantos-upstream/avantos/backend/schemata/migrations',
)
const OUT_DIR = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
  'src/db/migrations',
)
const OUT_FILE = path.join(OUT_DIR, 'schema.generated.sql')
const MANIFEST_FILE = path.join(OUT_DIR, '_manifest.txt')

if (!fs.existsSync(UPSTREAM_DIR)) {
  console.error(`Upstream migrations dir not found: ${UPSTREAM_DIR}`)
  console.error('Clone the upstream repo per docs/upstream-read-only.md first.')
  process.exit(1)
}

const files = fs
  .readdirSync(UPSTREAM_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort() // lexical sort = chronological because filenames are YYYYMMDDHHMMSS-*.sql

console.log(`Reading ${files.length} migration files from ${UPSTREAM_DIR}`)

function extractUp(sql) {
  // sql-migrate directives appear as comments — we strip the directive lines
  // themselves and keep only the Up body. Forms encountered:
  //
  //   -- +migrate Up
  //   -- +migrate Up notransaction
  //   -- +migrate Down
  //   -- +migrate Down notransaction
  //   -- +migrate StatementBegin
  //   -- +migrate StatementEnd
  //
  // We match the "Up <suffix?>" / "Down <suffix?>" forms with a regex so the
  // notransaction qualifier doesn't leak into the SQL as a bare keyword.

  const upMatch = sql.match(/--\s*\+migrate\s+Up[^\n]*\n/)
  const downMatch = sql.match(/--\s*\+migrate\s+Down[^\n]*\n/)

  let body
  const upStart = upMatch ? (upMatch.index ?? -1) : -1
  const upEnd = upMatch ? upStart + upMatch[0].length : -1
  const downStart = downMatch ? (downMatch.index ?? -1) : -1

  if (upStart === -1 && downStart === -1) {
    body = sql
  } else if (upStart === -1) {
    body = sql.slice(0, downStart)
  } else if (downStart === -1) {
    body = sql.slice(upEnd)
  } else if (upStart < downStart) {
    body = sql.slice(upEnd, downStart)
  } else {
    body = sql.slice(upEnd)
  }

  // Strip StatementBegin / StatementEnd markers — runner annotations only.
  body = body
    .replace(/--\s*\+migrate\s+StatementBegin\s*\n/g, '')
    .replace(/--\s*\+migrate\s+StatementEnd\s*\n/g, '')

  // PGlite wraps each .exec() in a transaction. CREATE INDEX CONCURRENTLY is
  // forbidden inside a transaction in Postgres. For a synthetic prototype
  // with seeded data, plain CREATE INDEX is equivalent — no perf concern.
  // Strip the CONCURRENTLY keyword wherever it appears.
  body = body
    .replace(/CREATE\s+INDEX\s+CONCURRENTLY/gi, 'CREATE INDEX')
    .replace(/CREATE\s+UNIQUE\s+INDEX\s+CONCURRENTLY/gi, 'CREATE UNIQUE INDEX')
    .replace(/DROP\s+INDEX\s+CONCURRENTLY/gi, 'DROP INDEX')

  return body.trim()
}

const parts = []
const manifest = []
let totalLines = 0

for (const f of files) {
  const full = path.join(UPSTREAM_DIR, f)
  const sql = fs.readFileSync(full, 'utf8')
  const up = extractUp(sql)
  if (!up) {
    manifest.push(`${f}\tSKIPPED (empty Up section)`)
    continue
  }
  parts.push(`-- ╔═════ ${f} ═════╗`)
  parts.push(up)
  parts.push('')
  manifest.push(`${f}\t${up.split('\n').length} lines`)
  totalLines += up.split('\n').length
}

const header = `-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ Avantos schema — auto-generated. Do not edit by hand.                ║
-- ║                                                                      ║
-- ║ Source: mosaic-avantos/avantos backend/schemata/migrations/          ║
-- ║ Generator: scripts/build-schema.mjs                                  ║
-- ║ Migration count: ${String(files.length).padEnd(54)}║
-- ║ Generated: ${new Date().toISOString().padEnd(60)}║
-- ╚══════════════════════════════════════════════════════════════════════╝
`

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT_FILE, header + '\n' + parts.join('\n') + '\n')
fs.writeFileSync(
  MANIFEST_FILE,
  `# Migration manifest — generated ${new Date().toISOString()}\n` +
    `# ${files.length} files, ${totalLines} total Up lines\n\n` +
    manifest.join('\n') +
    '\n',
)

console.log(`Wrote ${OUT_FILE}`)
console.log(`Wrote ${MANIFEST_FILE}`)
console.log(`Total Up lines: ${totalLines}`)
