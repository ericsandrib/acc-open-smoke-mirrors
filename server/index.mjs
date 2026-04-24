// Schwab API proxy for the Stratos account-opening demo.
//
// Why a proxy exists:
//   1. Schwab's Account Opening API uses OAuth 2.0. The client_secret must never
//      ship to the browser.
//   2. Browsers can't set the Schwab-Client-CorrelId / Schwab-Resource-Version
//      headers cross-origin without CORS preflight from Schwab.
//   3. We need somewhere to cache the access token between requests.
//
// Endpoints exposed to the frontend (all under /api/schwab):
//   GET  /health           → connectivity + config + token status (no secrets)
//   GET  /auth-url         → returns Schwab OAuth authorize URL to redirect to
//   GET  /oauth/callback   → Schwab redirects here with ?code; we exchange for token
//   POST /customers        → forwards to Schwab POST /v1/customers (createCustomer)
//
// Run with: `pnpm server`  (or `node server/index.mjs`).
// Config via .env — see .env.example.

import 'dotenv/config'
import express from 'express'
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.PORT || 3001)
const CLIENT_ID = process.env.SCHWAB_CLIENT_ID || ''
const CLIENT_SECRET = process.env.SCHWAB_CLIENT_SECRET || ''
// AS Digital Account Open required header — the app machine name from the portal.
const APP_ID = process.env.SCHWAB_APP_ID || ''
// Schwab sandbox (AS Digital Account Open) runs on sandbox.schwabapi.com.
// Override via SCHWAB_BASE_URL if pointing at production.
const BASE = process.env.SCHWAB_BASE_URL || 'https://sandbox.schwabapi.com'
// AS Digital Account Open service path + version.
const AS_DAO_PATH = process.env.SCHWAB_AS_DAO_PATH || '/as-integration/accounts/v2/account-open-contacts'
const AS_DAO_VERSION = process.env.SCHWAB_AS_DAO_VERSION || '2'
const CALLBACK = process.env.SCHWAB_CALLBACK_URL || `http://localhost:${PORT}/api/schwab/oauth/callback`
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const MOCK_MODE = process.env.SCHWAB_MOCK === '1' || (!CLIENT_ID || !CLIENT_SECRET)

// ---- token cache (in-memory, fine for single-user demo) ------------------

const tokenCache = {
  accessToken: /** @type {string|null} */ (null),
  refreshToken: /** @type {string|null} */ (null),
  expiresAt: /** @type {Date|null} */ (null),
  lastCorrelId: /** @type {string|null} */ (null),
}

// ---- app setup -----------------------------------------------------------

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use((req, res, next) => {
  // dev proxy runs under vite's same origin normally, but allow dev-only CORS
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// ---- helpers -------------------------------------------------------------

function healthPayload() {
  return {
    configured: Boolean(CLIENT_ID && CLIENT_SECRET),
    tokenPresent: Boolean(tokenCache.accessToken),
    tokenExpiresAt: tokenCache.expiresAt ? tokenCache.expiresAt.toISOString() : null,
    mode: MOCK_MODE ? 'mock' : 'live',
    proxyUp: true,
    lastCorrelId: tokenCache.lastCorrelId,
    sandboxBaseUrl: BASE,
    message: MOCK_MODE
      ? 'Mock mode — set SCHWAB_CLIENT_ID + SCHWAB_CLIENT_SECRET in .env to go live'
      : 'Live mode',
  }
}

function mockCustomerSuccess(req) {
  const correlId = req.headers['schwab-client-correlid'] || randomUUID()
  tokenCache.lastCorrelId = String(correlId)
  return {
    ok: true,
    status: 204,
    correlId: String(correlId),
    resourceVersion: 1,
    mode: 'mock',
  }
}

// ---- routes --------------------------------------------------------------

app.get('/api/schwab/health', (_req, res) => {
  res.json(healthPayload())
})

// Fetch (or refresh) a client_credentials token from Schwab.
// Sandbox AS Digital Account Open uses service-to-service auth — no user redirect.
async function fetchClientCredentialsToken() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const resp = await fetch(`${BASE}/v1/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })
  const text = await resp.text()
  let body
  try { body = JSON.parse(text) } catch { body = { raw: text } }
  if (!resp.ok) {
    const err = new Error(`Token exchange failed: HTTP ${resp.status} ${JSON.stringify(body).slice(0, 200)}`)
    err.cause = body
    err.status = resp.status
    throw err
  }
  tokenCache.accessToken = body.access_token || null
  tokenCache.refreshToken = body.refresh_token || null
  // Schwab returns expires_in as a string sometimes — coerce.
  const expiresSec = Number(body.expires_in || 1800)
  tokenCache.expiresAt = new Date(Date.now() + expiresSec * 1000)
  return body
}

async function ensureValidToken() {
  const stillValid =
    tokenCache.accessToken &&
    tokenCache.expiresAt &&
    tokenCache.expiresAt.getTime() - Date.now() > 30_000 // 30s buffer
  if (stillValid) return
  await fetchClientCredentialsToken()
}

// /auth-url is kept for compatibility with the frontend's "Connect Schwab" button.
// In client_credentials mode it just fetches a token server-side and redirects back.
app.get('/api/schwab/auth-url', async (_req, res) => {
  if (MOCK_MODE) {
    return res.json({ url: `/api/schwab/oauth/callback?code=MOCK_CODE&state=mock` })
  }
  try {
    await fetchClientCredentialsToken()
    res.json({
      url: `${FRONTEND_ORIGIN}/onboarding/flow/account-opening-funding?schwab=connected`,
    })
  } catch (err) {
    console.error('[schwab] client_credentials failed', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Token fetch failed',
    })
  }
})

// Kept for the old 3-legged OAuth flow. Sandbox doesn't use this today.
app.get('/api/schwab/oauth/callback', async (_req, res) => {
  res.redirect(`${FRONTEND_ORIGIN}/onboarding/flow/account-opening-funding?schwab=callback-unused`)
})

app.post('/api/schwab/customers', async (req, res) => {
  const startedAt = Date.now()
  const correlId = randomUUID()
  const url = `${BASE}${AS_DAO_PATH}`

  // Mock path — always succeeds; useful before OAuth is wired.
  if (MOCK_MODE) {
    const result = {
      ok: true,
      status: 204,
      correlId,
      resourceVersion: 1,
      requestedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      mode: 'mock',
      url,
      body: { note: 'Mock response. No call made to Schwab. Configure .env to go live.' },
      error: null,
    }
    tokenCache.lastCorrelId = correlId
    return res.json(result)
  }

  // Auto-fetch token on first call / when expired.
  try {
    await ensureValidToken()
  } catch (err) {
    return res.json({
      ok: false,
      status: err?.status ?? 401,
      correlId,
      resourceVersion: null,
      requestedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      mode: 'live',
      url,
      body: err?.cause ?? null,
      error:
        err instanceof Error
          ? err.message
          : 'Unable to acquire Schwab access token.',
    })
  }

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenCache.accessToken}`,
        'Content-Type': 'application/json',
        'Schwab-Client-AppId': APP_ID,
        'Schwab-Client-CorrelId': correlId,
        'Schwab-Resource-Version': AS_DAO_VERSION,
      },
      body: JSON.stringify(req.body),
    })
    const text = await resp.text()
    let parsed
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      parsed = { raw: text }
    }
    tokenCache.lastCorrelId = resp.headers.get('schwab-client-correlid') || correlId
    res.json({
      ok: resp.ok,
      status: resp.status,
      correlId: resp.headers.get('schwab-client-correlid') || correlId,
      resourceVersion: Number(resp.headers.get('schwab-resource-version') || 1),
      requestedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      mode: 'live',
      url,
      body: parsed,
      error: resp.ok
        ? null
        : parsed?.errors?.[0]?.detail || parsed?.errors?.[0]?.title || `HTTP ${resp.status}`,
    })
  } catch (err) {
    res.json({
      ok: false,
      status: 0,
      correlId,
      resourceVersion: null,
      requestedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      mode: 'live',
      url,
      body: null,
      error: err instanceof Error ? err.message : 'Network error',
    })
  }
})

app.listen(PORT, () => {
  console.log(`[schwab-proxy] listening on http://localhost:${PORT} (mode: ${MOCK_MODE ? 'mock' : 'live'})`)
  if (MOCK_MODE) {
    console.log('[schwab-proxy] running in MOCK MODE — create .env from .env.example to go live')
  }
})
