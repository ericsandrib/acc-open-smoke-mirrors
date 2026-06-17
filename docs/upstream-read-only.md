# Upstream Avantos — read-only

The `mosaic-avantos/avantos` repository is the source of truth for this
prototype's database schema. A local clone lives at:

```
~/Documents/Schwab/avantos-upstream/avantos/
```

## Rule

This clone is **read-only**. Never:

- `git push` from it
- Edit files inside it
- Open pull requests from it
- Commit anything to it

The only command you should run inside that directory is `git pull` (to refresh).

## Why it lives outside this repo

The upstream is ~462MB and contains 649 migrations, generated Go models for
~200 tables, and many other things irrelevant to this prototype. Keeping it
out-of-tree avoids accidentally vendoring large binaries and removes any
risk of an inadvertent commit being pushed upstream.

## How we use it

The schema generator at `scripts/build-schema.mjs` reads the upstream
migrations from the clone, extracts the Up-only portions in chronological
order, and emits a single consolidated SQL file at
`src/db/migrations/schema.generated.sql`. That file is the canonical schema
the in-browser PGlite database replays at boot.

To refresh after upstream changes:

```bash
cd ~/Documents/Schwab/avantos-upstream/avantos && git pull
cd ~/Documents/Schwab/acc-open-smoke-mirrors && pnpm build:schema
```

The generated file is checked in so the prototype works without a local
upstream clone.
