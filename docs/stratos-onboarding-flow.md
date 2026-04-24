# Stratos onboarding flow — personal fork

This fork adds a demo-ready onboarding flow for a single test client (`Lang, Chris M.`) and wires **Account Opening & Funding** to Schwab's Account Opening API.

## What was added

```
src/data/testClientFlow.ts                     5-step flow config
src/components/onboarding/
  TestClientFlowDashboard.tsx                  5-card dashboard
  AccountOpeningFunding.tsx                    Schwab-field form + API panel
  SchwabConnectivityPanel.tsx                  API health widget
  FlowStepPlaceholder.tsx                      Placeholder for unbuilt steps
  schwabFormDefaults.ts                        Sample customer + enums
src/pages/
  TestClientFlowPage.tsx
  AccountOpeningFundingPage.tsx
  FlowStepPlaceholderPage.tsx
src/lib/schwabClient.ts                        Thin fetch client for the proxy
server/index.mjs                               Node/Express Schwab proxy
.env.example                                   Proxy config template
```

## Routes

| Path | What it shows |
|---|---|
| `/onboarding` | Existing page + new banner linking into the demo flow |
| `/onboarding/flow` | 5-step dashboard for `Lang, Chris M.` |
| `/onboarding/flow/account-opening-funding` | Schwab field form + live API connectivity panel |
| `/onboarding/flow/:stepSlug` | Placeholder for the other 4 steps |

## How it connects to Schwab

```
browser  ──/api/schwab/*──▶  vite proxy  ──▶  node/express  ──https──▶  api.schwabapi.com
                                              (holds client_secret
                                               + OAuth token)
```

The secret never leaves the server. The browser only talks to `/api/schwab/*`.

## Run it

```bash
nvm use 22         # requires Node ≥ 20.19
pnpm install
cp .env.example .env   # optional — without .env the proxy runs in MOCK mode
pnpm dev:all       # starts web (5173) + api (3001) concurrently
```

Then:
1. Open http://localhost:5173
2. Password: `Avantos2026`
3. Click **Onboarding** in the left nav
4. Click the purple **Test client flow · Lang, Chris M.** banner
5. Click the **Account Opening and Funding** card
6. Click **Send to Schwab** — you'll get HTTP 204 + a correlation ID in the response panel

## Going live against the real Schwab sandbox

1. Log into https://developer.schwab.com → **My Apps** → your app
2. Copy `Client ID` and `Client Secret`
3. Register callback URL: `http://localhost:3001/api/schwab/oauth/callback`
4. Edit `.env`:
   ```
   SCHWAB_CLIENT_ID=your-id
   SCHWAB_CLIENT_SECRET=your-secret
   ```
5. Restart `pnpm dev:all`
6. The connectivity panel will change from **MOCK** to **LIVE** and show "Credentials missing" → "Not authorized"
7. Click **Connect Schwab** → browser redirects through OAuth → back to the form with a cached token
8. Click **Send to Schwab** → hits the real sandbox, response panel shows the Schwab correlation ID

## What's wired vs stub

| Step | Status |
|---|---|
| Collect Client Data | Stub |
| Financial Plan | Stub |
| KYC | Stub |
| Account Opening & Funding | **Full form, live API** |
| New Protection Policy | Stub |

The Schwab form sections map 1:1 to the `createCustomer` request body. Each field shows its Stratos Data Dictionary ID (e.g. `S001`) so you can trace it back to `Stratos_Data_Dictionary_v1.xlsx` → Stratos Field Inventory sheet.
