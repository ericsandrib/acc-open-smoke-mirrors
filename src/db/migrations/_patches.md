# Schema patches

`schema.generated.sql` is the consolidated Up-only output of the upstream Avantos
migrations. The generator at `scripts/build-schema.mjs` applies the following
mechanical transforms during consolidation so that PGlite (Postgres-in-WASM)
can replay the schema cleanly.

These are not edits to the upstream — the upstream files are untouched. The
patches are applied at generation time only.

## Patches applied

### 1. Strip sql-migrate directives

Lines matching `-- +migrate Up [...]`, `-- +migrate Down [...]`,
`-- +migrate StatementBegin`, and `-- +migrate StatementEnd` are removed.
The `notransaction` qualifier (e.g. `-- +migrate Up notransaction`) is also
stripped — it controls the migration runner, not the SQL itself.

### 2. Replace `CREATE INDEX CONCURRENTLY` with `CREATE INDEX`

PGlite wraps every `pg.exec()` call in an implicit transaction. Postgres
forbids `CREATE INDEX CONCURRENTLY` inside a transaction. For a synthetic
prototype with seeded data, plain `CREATE INDEX` is operationally
equivalent — no production-scale concurrent reads to worry about. Affects
the same form for `CREATE UNIQUE INDEX CONCURRENTLY` and
`DROP INDEX CONCURRENTLY`.

## Runtime requirements

The PGlite instance must be created with the `pg_trgm` extension loaded:

```ts
import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'

const pg = new PGlite({ extensions: { pg_trgm } })
```

Several upstream migrations depend on the `gin_trgm_ops` operator class for
full-text search indexes. PGlite ships pg_trgm but does not auto-load it.

## Verification

Run `node scripts/verify-schema.mjs` from the repo root. Expected output:

```
Replay complete in <2s>.
  OK:     650
  Failed: 0
Tables created: 140
```

All 12 critical tables (persons, clients, client_organisations, agents,
agent_organisations, agent_client_organisation_relationships,
financial_accounts, action_blueprints, action_runs, tasks, meetings,
addresses) should report `✓`.

## Refreshing after upstream changes

```bash
cd ~/Documents/Schwab/avantos-upstream/avantos && git pull
cd ~/Documents/Schwab/acc-open-smoke-mirrors
pnpm build:schema     # regenerates schema.generated.sql
node scripts/verify-schema.mjs   # confirms 0 failures
```

If new failures appear after a pull, add a transform here and to
`scripts/build-schema.mjs::extractUp`. Keep transforms mechanical — never
silently drop tables or columns.
