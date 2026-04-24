import { useState } from 'react'
import { Send, CheckCircle2, XCircle, Copy, FileCode2 } from 'lucide-react'
import { toast } from 'sonner'
import { AccessoryBar } from '@/components/accessory-bar'
import { PageTitle } from '@/components/page-title'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SchwabConnectivityPanel } from './SchwabConnectivityPanel'
import {
  SCHWAB_SAMPLE_CUSTOMER,
  EMPLOYMENT_STATUS,
  OCCUPATION,
  IDENTIFICATION_TYPE,
  PHONE_TYPE,
  ADDRESS_TYPE,
  US_STATES,
} from './schwabFormDefaults'
import {
  createSchwabCustomer,
  type SchwabCustomer,
  type SchwabApiResult,
} from '@/lib/schwabClient'
import { TEST_CLIENT } from '@/data/testClientFlow'
import { cn } from '@/lib/utils'

// --- small helpers --------------------------------------------------------

function FormRow({
  children,
  cols = 2,
}: {
  children: React.ReactNode
  cols?: 1 | 2 | 3
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols === 1 && 'grid-cols-1',
        cols === 2 && 'grid-cols-1 md:grid-cols-2',
        cols === 3 && 'grid-cols-1 md:grid-cols-3',
      )}
    >
      {children}
    </div>
  )
}

function Field({
  label,
  stratosId,
  children,
}: {
  label: string
  stratosId?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-xs font-medium text-text-secondary">{label}</Label>
        {stratosId && (
          <Badge
            variant="outline"
            className="text-[10px] font-mono px-1 py-0 bg-fill-neutral-secondary text-text-tertiary border-border-primary"
          >
            {stratosId}
          </Badge>
        )}
      </div>
      {children}
    </div>
  )
}

function SectionHeader({
  title,
  subtitle,
  count,
}: {
  title: string
  subtitle?: string
  count?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {count && (
        <Badge variant="outline" className="text-xs bg-fill-neutral-secondary text-text-secondary">
          {count}
        </Badge>
      )}
    </div>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border-primary bg-fill-surface p-5 space-y-4">
      {children}
    </div>
  )
}

// --- response viewer ------------------------------------------------------

function ResponsePanel({ result }: { result: SchwabApiResult | null }) {
  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-border-primary bg-fill-surface p-4 text-center">
        <FileCode2 className="h-5 w-5 mx-auto text-text-tertiary" />
        <p className="text-xs text-text-secondary mt-2">
          No API call made yet. Click <span className="font-medium">Send to Schwab</span> to submit.
        </p>
      </div>
    )
  }

  const ok = result.ok
  const Icon = ok ? CheckCircle2 : XCircle
  const tone = ok ? 'text-text-success-primary' : 'text-text-danger-primary'
  const bg = ok ? 'bg-fill-success-tertiary' : 'bg-fill-danger-tertiary'

  const copyBody = () => {
    navigator.clipboard.writeText(JSON.stringify(result.body, null, 2))
    toast.success('Response body copied')
  }

  return (
    <div className="rounded-lg border border-border-primary bg-fill-surface overflow-hidden">
      <div className={cn('p-3 flex items-center justify-between gap-2', bg)}>
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', tone)} />
          <span className={cn('text-sm font-semibold', tone)}>
            {ok ? 'Success' : 'API error'} · HTTP {result.status}
          </span>
          <Badge variant="outline" className="text-[10px] uppercase bg-fill-surface">
            {result.mode}
          </Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={copyBody}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="p-3 space-y-1 text-xs">
        <div className="grid grid-cols-[120px_1fr] gap-1">
          <span className="text-text-secondary">Correlation ID</span>
          <span className="font-mono text-text-primary">{result.correlId ?? '—'}</span>
          <span className="text-text-secondary">Resource-Version</span>
          <span className="font-mono text-text-primary">{result.resourceVersion ?? '—'}</span>
          <span className="text-text-secondary">Endpoint</span>
          <span className="font-mono text-text-primary truncate">{result.url}</span>
          <span className="text-text-secondary">Duration</span>
          <span className="font-mono text-text-primary">{result.durationMs} ms</span>
          <span className="text-text-secondary">Completed at</span>
          <span className="font-mono text-text-primary">
            {new Date(result.requestedAt).toLocaleString()}
          </span>
        </div>
        {result.error && (
          <p className="text-text-danger-primary text-xs pt-2 border-t border-border-primary">
            {result.error}
          </p>
        )}
        <details className="pt-2 border-t border-border-primary">
          <summary className="text-xs text-text-secondary cursor-pointer hover:text-text-primary">
            Response body
          </summary>
          <pre className="mt-2 text-[11px] bg-fill-neutral-secondary text-text-primary p-2 rounded overflow-auto max-h-48">
            {JSON.stringify(result.body, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}

// --- main component -------------------------------------------------------

export function AccountOpeningFunding() {
  const [customer, setCustomer] = useState<SchwabCustomer>(() =>
    structuredClone(SCHWAB_SAMPLE_CUSTOMER),
  )
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SchwabApiResult | null>(null)

  // convenience setters --------------------------------------------------
  const set = <K extends keyof SchwabCustomer>(key: K, value: SchwabCustomer[K]) =>
    setCustomer((prev) => ({ ...prev, [key]: value }))

  const setName = <K extends keyof SchwabCustomer['name']>(
    key: K,
    value: SchwabCustomer['name'][K],
  ) => setCustomer((p) => ({ ...p, name: { ...p.name, [key]: value } }))

  const setPhone = (i: number, patch: Partial<SchwabCustomer['phoneNumbers'][0]>) =>
    setCustomer((p) => ({
      ...p,
      phoneNumbers: p.phoneNumbers.map((ph, idx) => (idx === i ? { ...ph, ...patch } : ph)),
    }))

  const setAddress = (i: number, patch: Partial<SchwabCustomer['addresses'][0]>) =>
    setCustomer((p) => ({
      ...p,
      addresses: p.addresses.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    }))

  const setEmployment = <K extends keyof SchwabCustomer['employment']>(
    key: K,
    value: SchwabCustomer['employment'][K],
  ) => setCustomer((p) => ({ ...p, employment: { ...p.employment, [key]: value } }))

  const setDirector = (
    i: number,
    patch: Partial<NonNullable<SchwabCustomer['employment']['directorDetails']>[number]>,
  ) =>
    setCustomer((p) => ({
      ...p,
      employment: {
        ...p.employment,
        directorDetails: (p.employment.directorDetails ?? []).map((d, idx) =>
          idx === i ? { ...d, ...patch } : d,
        ),
      },
    }))

  const setId = <K extends keyof SchwabCustomer['identification']>(
    key: K,
    value: SchwabCustomer['identification'][K],
  ) => setCustomer((p) => ({ ...p, identification: { ...p.identification, [key]: value } }))

  // submission -----------------------------------------------------------
  const handleSend = async () => {
    setSubmitting(true)
    try {
      const res = await createSchwabCustomer({ data: [customer] })
      setResult(res)
      if (res.ok) {
        toast.success(`Schwab accepted customer (HTTP ${res.status})`, {
          description: `Correlation ID: ${res.correlId ?? 'n/a'}`,
        })
      } else {
        toast.error(`Schwab rejected request (HTTP ${res.status})`, {
          description: res.error ?? 'See response panel for details.',
        })
      }
    } catch (err) {
      toast.error('Request failed', {
        description: err instanceof Error ? err.message : 'Network error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetSample = () => {
    setCustomer(structuredClone(SCHWAB_SAMPLE_CUSTOMER))
    setResult(null)
    toast.info('Reset to Schwab sample customer')
  }

  const ph = customer.phoneNumbers[0]
  const addr = customer.addresses[0]
  const dir0 = customer.employment.directorDetails?.[0]

  return (
    <div className="max-w-7xl mx-auto">
      <AccessoryBar
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Onboarding', href: '/onboarding' },
          { label: TEST_CLIENT.name, href: '/onboarding/flow' },
        ]}
        currentPage="Account Opening & Funding"
        showBackButton={true}
        showBorder={false}
        className="-mt-6 mb-2"
      />

      <div className="flex items-start justify-between mb-6 gap-4">
        <PageTitle
          title="Account Opening & Funding"
          subHead="Schwab Account Opening API · createCustomer · sandbox v1"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetSample}>
            Reset to sample
          </Button>
          <Button onClick={handleSend} disabled={submitting} size="sm">
            <Send className="h-3.5 w-3.5" />
            {submitting ? 'Sending…' : 'Send to Schwab'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* --- left: form --- */}
        <div className="space-y-5">
          {/* NAME */}
          <Section>
            <SectionHeader
              title="Name"
              subtitle="Stratos dictionary: S001–S005 · Schwab: data[].name"
              count="5 fields"
            />
            <FormRow cols={3}>
              <Field label="First name" stratosId="S001">
                <Input
                  value={customer.name.firstName}
                  onChange={(e) => setName('firstName', e.target.value)}
                />
              </Field>
              <Field label="Middle name" stratosId="S002">
                <Input
                  value={customer.name.middleName ?? ''}
                  onChange={(e) => setName('middleName', e.target.value)}
                />
              </Field>
              <Field label="Last name" stratosId="S003">
                <Input
                  value={customer.name.lastName}
                  onChange={(e) => setName('lastName', e.target.value)}
                />
              </Field>
            </FormRow>
            <FormRow cols={2}>
              <Field label="Suffix" stratosId="S004">
                <Input
                  value={customer.name.suffix ?? ''}
                  onChange={(e) => setName('suffix', e.target.value)}
                />
              </Field>
              <Field label="Alias / preferred" stratosId="S005">
                <Input
                  value={customer.name.alias ?? ''}
                  onChange={(e) => setName('alias', e.target.value)}
                />
              </Field>
            </FormRow>
          </Section>

          {/* CORE IDENTITY */}
          <Section>
            <SectionHeader
              title="Core identity"
              subtitle="Stratos: S007, S008, S010, S012, S016 · Schwab: dateOfBirth, ssn, email, citizenship"
              count="5 fields"
            />
            <FormRow cols={3}>
              <Field label="Date of birth" stratosId="S007">
                <Input
                  type="date"
                  value={customer.dateOfBirth}
                  onChange={(e) => set('dateOfBirth', e.target.value)}
                />
              </Field>
              <Field label="SSN (9 digits)" stratosId="S008">
                <Input
                  value={customer.ssn}
                  maxLength={9}
                  onChange={(e) => set('ssn', e.target.value.replace(/\D/g, '').slice(0, 9))}
                />
              </Field>
              <Field label="Email" stratosId="S016">
                <Input
                  type="email"
                  value={customer.emailAddress}
                  onChange={(e) => set('emailAddress', e.target.value)}
                />
              </Field>
            </FormRow>
            <FormRow cols={3}>
              <Field label="US citizen" stratosId="S010">
                <div className="flex items-center h-9 gap-2">
                  <Checkbox
                    checked={customer.isUsCitizen}
                    onCheckedChange={(v) => set('isUsCitizen', Boolean(v))}
                  />
                  <span className="text-sm">Yes</span>
                </div>
              </Field>
              <Field label="US resident">
                <div className="flex items-center h-9 gap-2">
                  <Checkbox
                    checked={customer.isUsResident}
                    onCheckedChange={(v) => set('isUsResident', Boolean(v))}
                  />
                  <span className="text-sm">Yes</span>
                </div>
              </Field>
              <Field label="Citizen of another country" stratosId="S011">
                <div className="flex items-center h-9 gap-2">
                  <Checkbox
                    checked={customer.isCitizenOfAnotherCountry}
                    onCheckedChange={(v) => set('isCitizenOfAnotherCountry', Boolean(v))}
                  />
                  <span className="text-sm">Yes</span>
                </div>
              </Field>
            </FormRow>
          </Section>

          {/* PHONE */}
          <Section>
            <SectionHeader
              title="Primary phone"
              subtitle="Stratos: S018–S020 · Schwab: phoneNumbers[0]"
              count="6 fields"
            />
            <FormRow cols={3}>
              <Field label="Type">
                <Select value={ph.type} onValueChange={(v) => setPhone(0, { type: v as typeof ph.type })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHONE_TYPE.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Country code">
                <Input value={ph.countryCode} onChange={(e) => setPhone(0, { countryCode: e.target.value })} />
              </Field>
              <Field label="Area code">
                <Input value={ph.areaCode} onChange={(e) => setPhone(0, { areaCode: e.target.value })} />
              </Field>
            </FormRow>
            <FormRow cols={3}>
              <Field label="Prefix">
                <Input value={ph.prefix} onChange={(e) => setPhone(0, { prefix: e.target.value })} />
              </Field>
              <Field label="Line number">
                <Input value={ph.lineNumber} onChange={(e) => setPhone(0, { lineNumber: e.target.value })} />
              </Field>
              <Field label="International">
                <div className="flex items-center h-9 gap-2">
                  <Checkbox
                    checked={ph.isInternational}
                    onCheckedChange={(v) => setPhone(0, { isInternational: Boolean(v) })}
                  />
                  <span className="text-sm">Yes</span>
                </div>
              </Field>
            </FormRow>
          </Section>

          {/* ADDRESS */}
          <Section>
            <SectionHeader
              title="Legal / mailing address"
              subtitle="Stratos: S038–S051 · Schwab: addresses[0] + mailingAddressType"
              count="9 fields"
            />
            <FormRow cols={2}>
              <Field label="Address type">
                <Select
                  value={addr.addressType}
                  onValueChange={(v) => setAddress(0, { addressType: v as typeof addr.addressType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_TYPE.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Mailing address type">
                <Select
                  value={customer.mailingAddressType}
                  onValueChange={(v) => set('mailingAddressType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_TYPE.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FormRow>
            <Field label="Line 1" stratosId="S038">
              <Input value={addr.addressLine1} onChange={(e) => setAddress(0, { addressLine1: e.target.value })} />
            </Field>
            <FormRow cols={2}>
              <Field label="Line 2" stratosId="S039">
                <Input
                  value={addr.addressLine2 ?? ''}
                  onChange={(e) => setAddress(0, { addressLine2: e.target.value })}
                />
              </Field>
              <Field label="Line 3">
                <Input
                  value={addr.addressLine3 ?? ''}
                  onChange={(e) => setAddress(0, { addressLine3: e.target.value })}
                />
              </Field>
            </FormRow>
            <FormRow cols={3}>
              <Field label="City" stratosId="S040">
                <Input value={addr.city} onChange={(e) => setAddress(0, { city: e.target.value })} />
              </Field>
              <Field label="State" stratosId="S041">
                <Select value={addr.state} onValueChange={(v) => setAddress(0, { state: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="ZIP" stratosId="S042">
                <Input value={addr.zipCode} onChange={(e) => setAddress(0, { zipCode: e.target.value })} />
              </Field>
            </FormRow>
            <FormRow cols={2}>
              <Field label="Country" stratosId="S043">
                <Input value={addr.country} onChange={(e) => setAddress(0, { country: e.target.value })} />
              </Field>
              <Field label="International">
                <div className="flex items-center h-9 gap-2">
                  <Checkbox
                    checked={addr.isInternational}
                    onCheckedChange={(v) => setAddress(0, { isInternational: Boolean(v) })}
                  />
                  <span className="text-sm">Yes</span>
                </div>
              </Field>
            </FormRow>
          </Section>

          {/* EMPLOYMENT */}
          <Section>
            <SectionHeader
              title="Employment & financial profile"
              subtitle="Stratos: S061–S065 · Schwab: employment"
              count="8 fields"
            />
            <FormRow cols={2}>
              <Field label="Status" stratosId="S061">
                <Select
                  value={customer.employment.status}
                  onValueChange={(v) => setEmployment('status', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Employer name" stratosId="S062">
                <Input
                  value={customer.employment.employerName ?? ''}
                  onChange={(e) => setEmployment('employerName', e.target.value)}
                />
              </Field>
            </FormRow>
            <FormRow cols={2}>
              <Field label="Occupation" stratosId="S064">
                <Select
                  value={customer.employment.occupation}
                  onValueChange={(v) => setEmployment('occupation', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCUPATION.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Occupation — other">
                <Input
                  value={customer.employment.occupationOther ?? ''}
                  onChange={(e) => setEmployment('occupationOther', e.target.value)}
                />
              </Field>
            </FormRow>
            <FormRow cols={2}>
              <Field label="Employed by security/broker firm" stratosId="S092">
                <div className="flex items-center h-9 gap-2">
                  <Checkbox
                    checked={customer.employment.isEmployedBySecurityOrBrokerFirm}
                    onCheckedChange={(v) =>
                      setEmployment('isEmployedBySecurityOrBrokerFirm', Boolean(v))
                    }
                  />
                  <span className="text-sm">Yes</span>
                </div>
              </Field>
              <Field label="Director" stratosId="S090">
                <div className="flex items-center h-9 gap-2">
                  <Checkbox
                    checked={customer.employment.isDirector}
                    onCheckedChange={(v) => setEmployment('isDirector', Boolean(v))}
                  />
                  <span className="text-sm">Yes</span>
                </div>
              </Field>
            </FormRow>
            {customer.employment.isDirector && dir0 && (
              <FormRow cols={2}>
                <Field label="Director — company" stratosId="S091">
                  <Input
                    value={dir0.companyName}
                    onChange={(e) => setDirector(0, { companyName: e.target.value })}
                  />
                </Field>
                <Field label="Director — trading symbol">
                  <Input
                    value={dir0.tradingSymbol}
                    onChange={(e) => setDirector(0, { tradingSymbol: e.target.value })}
                  />
                </Field>
              </FormRow>
            )}
          </Section>

          {/* IDENTIFICATION */}
          <Section>
            <SectionHeader
              title="Identification / KYC"
              subtitle="Stratos: S052–S056 · Schwab: identification"
              count="10 fields"
            />
            <FormRow cols={2}>
              <Field label="ID type" stratosId="S052">
                <Select
                  value={customer.identification.identificationType}
                  onValueChange={(v) => setId('identificationType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IDENTIFICATION_TYPE.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="ID number" stratosId="S053">
                <Input
                  value={customer.identification.identificationNumber}
                  onChange={(e) => setId('identificationNumber', e.target.value)}
                />
              </Field>
            </FormRow>
            <FormRow cols={2}>
              <Field label="Issued date" stratosId="S055">
                <Input
                  type="date"
                  value={customer.identification.issuedDate ?? ''}
                  onChange={(e) => setId('issuedDate', e.target.value)}
                />
              </Field>
              <Field label="Expiry date" stratosId="S056">
                <Input
                  type="date"
                  value={customer.identification.expiryDate ?? ''}
                  onChange={(e) => setId('expiryDate', e.target.value)}
                />
              </Field>
            </FormRow>
            <FormRow cols={3}>
              <Field label="Country" stratosId="S054">
                <Input
                  value={customer.identification.country}
                  onChange={(e) => setId('country', e.target.value)}
                />
              </Field>
              <Field label="Other country">
                <Input
                  value={customer.identification.otherCountry ?? ''}
                  onChange={(e) => setId('otherCountry', e.target.value)}
                />
              </Field>
              <Field label="Country of birth" stratosId="S012">
                <Input
                  value={customer.identification.countryOfBirth ?? ''}
                  onChange={(e) => setId('countryOfBirth', e.target.value)}
                />
              </Field>
            </FormRow>
            <FormRow cols={3}>
              <Field label="Passport issued country">
                <Input
                  value={customer.identification.passportIssuedCountry ?? ''}
                  onChange={(e) => setId('passportIssuedCountry', e.target.value)}
                />
              </Field>
              <Field label="Driver's license state">
                <Input
                  value={customer.identification.driversLicenseIssuedState ?? ''}
                  onChange={(e) => setId('driversLicenseIssuedState', e.target.value)}
                />
              </Field>
              <Field label="Gov ID state">
                <Input
                  value={customer.identification.governmentIdIssuedState ?? ''}
                  onChange={(e) => setId('governmentIdIssuedState', e.target.value)}
                />
              </Field>
            </FormRow>
          </Section>
        </div>

        {/* --- right: sticky API panel --- */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <SchwabConnectivityPanel />
          <ResponsePanel result={result} />
          <div className="rounded-lg border border-border-primary bg-fill-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Request preview</h3>
            <p className="text-xs text-text-secondary mb-2">
              POST <code className="font-mono">/v1/customers</code>
            </p>
            <details>
              <summary className="text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                Show JSON body
              </summary>
              <pre className="mt-2 text-[11px] bg-fill-neutral-secondary text-text-primary p-2 rounded overflow-auto max-h-64">
                {JSON.stringify({ data: [customer] }, null, 2)}
              </pre>
            </details>
          </div>
        </aside>
      </div>
    </div>
  )
}
