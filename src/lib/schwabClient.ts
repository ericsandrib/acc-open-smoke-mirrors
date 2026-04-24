// Thin fetch wrapper around the local Schwab proxy server.
// The proxy lives at /api/schwab/* (see server/index.mjs).
// Keeping this tiny on purpose — it mostly exists so components can import types.

export interface SchwabHealthStatus {
  configured: boolean // client id + secret present on server
  tokenPresent: boolean // OAuth access token cached on server
  tokenExpiresAt: string | null
  mode: 'live' | 'mock'
  proxyUp: boolean
  lastCorrelId?: string | null
  sandboxBaseUrl?: string
  message?: string
}

export interface SchwabCustomerName {
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  alias?: string
}

export interface SchwabPhone {
  type: 'Home' | 'Work' | 'Mobile'
  countryCode: string
  areaCode: string
  prefix: string
  lineNumber: string
  isInternational: boolean
}

export interface SchwabAddress {
  addressType: 'Home' | 'Work' | 'Mailing' | 'Legal'
  addressLine1: string
  addressLine2?: string
  addressLine3?: string
  city: string
  state: string
  zipCode: string
  country: string
  isInternational: boolean
}

export interface SchwabDirectorDetail {
  companyName: string
  tradingSymbol: string
}

export interface SchwabEmployment {
  status: string
  occupation: string
  occupationOther?: string
  employerName?: string
  isEmployedBySecurityOrBrokerFirm: boolean
  isDirector: boolean
  directorDetails?: SchwabDirectorDetail[]
}

export interface SchwabIdentification {
  identificationType: string
  identificationNumber: string
  issuedDate?: string
  expiryDate?: string
  country: string
  otherCountry?: string
  countryOfBirth?: string
  passportIssuedCountry?: string
  driversLicenseIssuedState?: string
  governmentIdIssuedState?: string
}

export interface SchwabCustomer {
  name: SchwabCustomerName
  dateOfBirth: string
  ssn: string
  emailAddress: string
  phoneNumbers: SchwabPhone[]
  mailingAddressType: string
  addresses: SchwabAddress[]
  employment: SchwabEmployment
  isCitizenOfAnotherCountry: boolean
  isUsCitizen: boolean
  isUsResident: boolean
  identification: SchwabIdentification
}

export interface SchwabCreateCustomerRequest {
  data: SchwabCustomer[]
}

export interface SchwabApiResult {
  ok: boolean
  status: number
  correlId: string | null
  resourceVersion: number | null
  requestedAt: string
  durationMs: number
  mode: 'live' | 'mock'
  url: string
  body: unknown
  error?: string | null
}

const PROXY = '/api/schwab'

export async function getSchwabHealth(): Promise<SchwabHealthStatus> {
  try {
    const res = await fetch(`${PROXY}/health`, { cache: 'no-store' })
    if (!res.ok) {
      return {
        configured: false,
        tokenPresent: false,
        tokenExpiresAt: null,
        mode: 'mock',
        proxyUp: true,
        message: `Proxy returned ${res.status}`,
      }
    }
    return (await res.json()) as SchwabHealthStatus
  } catch (err) {
    return {
      configured: false,
      tokenPresent: false,
      tokenExpiresAt: null,
      mode: 'mock',
      proxyUp: false,
      message: err instanceof Error ? err.message : 'Proxy unreachable',
    }
  }
}

export async function createSchwabCustomer(
  payload: SchwabCreateCustomerRequest,
): Promise<SchwabApiResult> {
  const res = await fetch(`${PROXY}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return (await res.json()) as SchwabApiResult
}

/** Start OAuth: returns the Schwab authorize URL to redirect the user to. */
export async function getSchwabAuthUrl(): Promise<string> {
  const res = await fetch(`${PROXY}/auth-url`)
  const body = (await res.json()) as { url: string }
  return body.url
}
