import { useState, useMemo } from 'react'
import { Circle, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// --- field configs (mirror Avantos formConfig.ts) -------------------------

type ProspectKind = 'individual' | 'business'

const TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.'] as const
const SUFFIXES = ['Jr.', 'Sr.', 'II', 'III', 'IV'] as const
const GENDERS = ['Male', 'Female', 'Other'] as const
const MARITAL = ['Single', 'Married', 'Divorced', 'Widowed'] as const
// Trimmed to keep the demo file lean; Avantos ships the full ISO list.
const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Mexico',
  'Other',
] as const
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
] as const
const AGENT_OPTIONS = [
  'Alice Chen',
  'Bob Martinez',
  'Carol Williams',
  'Diana Torres',
  'Edward Kim',
  'Eric Sandrib',
] as const

const PHONE_REGEX = /^\+?1?\s*\(?\d{3}\)?\s*[-.]?\s*\d{3}\s*[-.]?\s*\d{4}$/
const US_ZIP_REGEX = /^\d{5}(-\d{4})?$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// --- shape ---------------------------------------------------------------

interface ProspectForm {
  // Step 1 (Prospect/Client mini-form)
  legalFirstName: string
  legalLastName: string
  email: string
  phoneNumber: string
  // Step 2 (Full prospect)
  middleName: string
  preferredName: string
  title: string
  suffix: string
  dateOfBirth: string
  gender: string
  maritalStatus: string
  country: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  referredBy: string
  primaryAdvisor: string
  assignedTo: string
}

interface BusinessForm {
  businessName: string
  primaryContact: string
  businessPhoneNumber: string
  webAddress: string
  email: string
  country: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  referredBy: string
  primaryAdvisor: string
  assignedTo: string
}

const emptyProspect: ProspectForm = {
  legalFirstName: '', legalLastName: '', email: '', phoneNumber: '',
  middleName: '', preferredName: '', title: '', suffix: '',
  dateOfBirth: '', gender: '', maritalStatus: '',
  country: 'United States', addressLine1: '', addressLine2: '',
  city: '', state: '', zipCode: '',
  referredBy: '', primaryAdvisor: '', assignedTo: '',
}

const emptyBusiness: BusinessForm = {
  businessName: '', primaryContact: '', businessPhoneNumber: '', webAddress: '',
  email: '', country: 'United States',
  addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '',
  referredBy: '', primaryAdvisor: '', assignedTo: '',
}

// --- shared bits ---------------------------------------------------------

function RequiredStar() {
  return <span className="text-destructive ml-0.5" aria-hidden>*</span>
}

function FieldRow({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 }) {
  return (
    <div className={cn('grid gap-4', cols === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <RequiredStar />}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function KindCard({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg border px-5 py-4 text-left transition-all flex-1',
        active
          ? 'border-foreground ring-1 ring-foreground bg-background'
          : 'border-border bg-background hover:border-foreground/40',
      )}
    >
      {active ? (
        <CheckCircle2 className="h-5 w-5 fill-foreground text-background" />
      ) : (
        <Circle className="h-5 w-5 text-muted-foreground" />
      )}
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="text-base font-semibold text-foreground mt-6 first:mt-0">{title}</h3>
}

// --- main dialog ---------------------------------------------------------

interface CreateProspectDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateProspectDialog({ open, onClose }: CreateProspectDialogProps) {
  const [kind, setKind] = useState<ProspectKind>('individual')
  const [step, setStep] = useState<1 | 2>(1)
  const [prospect, setProspect] = useState<ProspectForm>(emptyProspect)
  const [business, setBusiness] = useState<BusinessForm>(emptyBusiness)
  const [touched, setTouched] = useState(false)

  const setP = <K extends keyof ProspectForm>(k: K, v: ProspectForm[K]) =>
    setProspect((p) => ({ ...p, [k]: v }))
  const setB = <K extends keyof BusinessForm>(k: K, v: BusinessForm[K]) =>
    setBusiness((b) => ({ ...b, [k]: v }))

  const computedAge = useMemo(() => {
    if (!prospect.dateOfBirth) return ''
    const dob = new Date(prospect.dateOfBirth)
    if (Number.isNaN(dob.getTime())) return ''
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    return age >= 0 ? String(age) : ''
  }, [prospect.dateOfBirth])

  // --- validation -------------------------------------------------------
  const step1Errors = useMemo(() => {
    const e: Partial<Record<string, string>> = {}
    if (kind === 'individual') {
      if (!prospect.legalFirstName.trim()) e.legalFirstName = 'Required'
      if (!prospect.legalLastName.trim()) e.legalLastName = 'Required'
      if (!prospect.email.trim()) e.email = 'Required'
      else if (!EMAIL_REGEX.test(prospect.email)) e.email = 'Please enter a valid email'
      if (prospect.phoneNumber && !PHONE_REGEX.test(prospect.phoneNumber))
        e.phoneNumber = 'Phone format: (555) 123-4567'
    } else {
      if (!business.businessName.trim()) e.businessName = 'Required'
      if (business.email && !EMAIL_REGEX.test(business.email))
        e.email = 'Please enter a valid email'
      if (business.businessPhoneNumber && !PHONE_REGEX.test(business.businessPhoneNumber))
        e.businessPhoneNumber = 'Phone format: (555) 123-4567'
    }
    return e
  }, [kind, prospect, business])

  const step2Errors = useMemo(() => {
    const e: Partial<Record<string, string>> = {}
    if (kind === 'individual') {
      if (prospect.dateOfBirth) {
        const dob = new Date(prospect.dateOfBirth)
        if (!Number.isNaN(dob.getTime()) && dob > new Date())
          e.dateOfBirth = 'Date of birth cannot be in the future'
      }
      if (!prospect.addressLine1.trim()) e.addressLine1 = 'Required'
      if (!prospect.city.trim()) e.city = 'Required'
      if (!prospect.zipCode.trim()) e.zipCode = 'Required'
      else if (prospect.country === 'United States' && !US_ZIP_REGEX.test(prospect.zipCode))
        e.zipCode = 'Format: 12345 or 12345-6789'
    } else {
      if (!business.addressLine1.trim()) e.addressLine1 = 'Required'
      if (!business.city.trim()) e.city = 'Required'
      if (!business.zipCode.trim()) e.zipCode = 'Required'
      else if (business.country === 'United States' && !US_ZIP_REGEX.test(business.zipCode))
        e.zipCode = 'Format: 12345 or 12345-6789'
    }
    return e
  }, [kind, prospect, business])

  const step1Valid = Object.keys(step1Errors).length === 0
  const step2Valid = Object.keys(step2Errors).length === 0

  const reset = () => {
    setProspect(emptyProspect)
    setBusiness(emptyBusiness)
    setStep(1)
    setKind('individual')
    setTouched(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleNext = () => {
    setTouched(true)
    if (!step1Valid) return
    setStep(2)
    setTouched(false)
  }

  const handleCreate = () => {
    setTouched(true)
    if (!step2Valid) return
    const name =
      kind === 'individual'
        ? `${prospect.legalFirstName} ${prospect.legalLastName}`.trim()
        : business.businessName.trim()
    toast.success(`Prospect created`, {
      description: `${name} has been added to your relationships.`,
    })
    handleClose()
  }

  if (!open) return null

  // --- render -----------------------------------------------------------
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={handleClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-prospect-title"
        className="fixed left-1/2 top-1/2 z-50 w-[min(720px,calc(100vw-2rem))] max-h-[calc(100vh-4rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="create-prospect-title" className="text-lg font-semibold text-foreground">
            Create Prospect
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {step === 1 && (
            <>
              <div className="flex gap-3">
                <KindCard
                  active={kind === 'individual'}
                  label="Prospect/Client"
                  onClick={() => setKind('individual')}
                />
                <KindCard
                  active={kind === 'business'}
                  label="Business"
                  onClick={() => setKind('business')}
                />
              </div>

              {kind === 'individual' ? (
                <>
                  <FieldRow>
                    <Field label="Legal First Name" required error={touched ? step1Errors.legalFirstName : undefined}>
                      <Input
                        placeholder="John"
                        value={prospect.legalFirstName}
                        onChange={(e) => setP('legalFirstName', e.target.value)}
                      />
                    </Field>
                    <Field label="Legal Last Name" required error={touched ? step1Errors.legalLastName : undefined}>
                      <Input
                        placeholder="Smith"
                        value={prospect.legalLastName}
                        onChange={(e) => setP('legalLastName', e.target.value)}
                      />
                    </Field>
                  </FieldRow>
                  <Field label="Email" required error={touched ? step1Errors.email : undefined}>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={prospect.email}
                      onChange={(e) => setP('email', e.target.value)}
                    />
                  </Field>
                  <Field label="Phone number" error={touched ? step1Errors.phoneNumber : undefined}>
                    <Input
                      placeholder="(000) 000 0000"
                      value={prospect.phoneNumber}
                      onChange={(e) => setP('phoneNumber', e.target.value)}
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Business Name" required error={touched ? step1Errors.businessName : undefined}>
                    <Input
                      placeholder="Acme Holdings LLC"
                      value={business.businessName}
                      onChange={(e) => setB('businessName', e.target.value)}
                    />
                  </Field>
                  <FieldRow>
                    <Field label="Email" error={touched ? step1Errors.email : undefined}>
                      <Input
                        type="email"
                        placeholder="contact@example.com"
                        value={business.email}
                        onChange={(e) => setB('email', e.target.value)}
                      />
                    </Field>
                    <Field label="Business Phone Number" error={touched ? step1Errors.businessPhoneNumber : undefined}>
                      <Input
                        placeholder="(000) 000 0000"
                        value={business.businessPhoneNumber}
                        onChange={(e) => setB('businessPhoneNumber', e.target.value)}
                      />
                    </Field>
                  </FieldRow>
                  <FieldRow>
                    <Field label="Web Address">
                      <Input
                        placeholder="https://example.com"
                        value={business.webAddress}
                        onChange={(e) => setB('webAddress', e.target.value)}
                      />
                    </Field>
                    <Field label="Primary Contact">
                      <Select
                        value={business.primaryContact || undefined}
                        onValueChange={(v) => setB('primaryContact', v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select advisor" /></SelectTrigger>
                        <SelectContent>
                          {AGENT_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>
                </>
              )}
            </>
          )}

          {step === 2 && kind === 'individual' && (
            <>
              <div>
                <SectionHeader title="Name" />
                <div className="space-y-4 mt-3">
                  <FieldRow>
                    <Field label="Legal First Name" required>
                      <Input value={prospect.legalFirstName} onChange={(e) => setP('legalFirstName', e.target.value)} />
                    </Field>
                    <Field label="Middle Name">
                      <Input value={prospect.middleName} onChange={(e) => setP('middleName', e.target.value)} />
                    </Field>
                  </FieldRow>
                  <FieldRow>
                    <Field label="Legal Last Name" required>
                      <Input value={prospect.legalLastName} onChange={(e) => setP('legalLastName', e.target.value)} />
                    </Field>
                    <Field label="Preferred Name">
                      <Input value={prospect.preferredName} onChange={(e) => setP('preferredName', e.target.value)} />
                    </Field>
                  </FieldRow>
                  <FieldRow>
                    <Field label="Title">
                      <Select value={prospect.title || undefined} onValueChange={(v) => setP('title', v)}>
                        <SelectTrigger><SelectValue placeholder="Select Title" /></SelectTrigger>
                        <SelectContent>
                          {TITLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Suffix">
                      <Select value={prospect.suffix || undefined} onValueChange={(v) => setP('suffix', v)}>
                        <SelectTrigger><SelectValue placeholder="Select Suffix" /></SelectTrigger>
                        <SelectContent>
                          {SUFFIXES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>
                </div>
              </div>

              <div>
                <SectionHeader title="Demographics" />
                <div className="space-y-4 mt-3">
                  <FieldRow>
                    <Field label="Date of Birth" error={touched ? step2Errors.dateOfBirth : undefined}>
                      <Input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={prospect.dateOfBirth}
                        onChange={(e) => setP('dateOfBirth', e.target.value)}
                      />
                    </Field>
                    <Field label="Age">
                      <Input value={computedAge} disabled placeholder="—" />
                    </Field>
                  </FieldRow>
                  <FieldRow>
                    <Field label="Gender">
                      <Select value={prospect.gender || undefined} onValueChange={(v) => setP('gender', v)}>
                        <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                        <SelectContent>
                          {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Marital Status">
                      <Select value={prospect.maritalStatus || undefined} onValueChange={(v) => setP('maritalStatus', v)}>
                        <SelectTrigger><SelectValue placeholder="Select Marital Status" /></SelectTrigger>
                        <SelectContent>
                          {MARITAL.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>
                </div>
              </div>

              <div>
                <SectionHeader title="Contact" />
                <div className="space-y-4 mt-3">
                  <FieldRow>
                    <Field label="Phone Number">
                      <Input value={prospect.phoneNumber} onChange={(e) => setP('phoneNumber', e.target.value)} />
                    </Field>
                    <Field label="Email" required>
                      <Input
                        type="email"
                        value={prospect.email}
                        onChange={(e) => setP('email', e.target.value)}
                      />
                    </Field>
                  </FieldRow>
                </div>
              </div>

              <div>
                <SectionHeader title="Address" />
                <div className="space-y-4 mt-3">
                  <FieldRow>
                    <Field label="Country">
                      <Select value={prospect.country} onValueChange={(v) => setP('country', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="State">
                      <Select value={prospect.state || undefined} onValueChange={(v) => setP('state', v)}>
                        <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>
                  <Field label="Address line 1" required error={touched ? step2Errors.addressLine1 : undefined}>
                    <Input value={prospect.addressLine1} onChange={(e) => setP('addressLine1', e.target.value)} />
                  </Field>
                  <Field label="Address line 2">
                    <Input value={prospect.addressLine2} onChange={(e) => setP('addressLine2', e.target.value)} />
                  </Field>
                  <FieldRow>
                    <Field label="City" required error={touched ? step2Errors.city : undefined}>
                      <Input value={prospect.city} onChange={(e) => setP('city', e.target.value)} />
                    </Field>
                    <Field label="Zip Code" required error={touched ? step2Errors.zipCode : undefined}>
                      <Input value={prospect.zipCode} onChange={(e) => setP('zipCode', e.target.value)} />
                    </Field>
                  </FieldRow>
                </div>
              </div>

              <div>
                <SectionHeader title="Assignment" />
                <div className="space-y-4 mt-3">
                  <FieldRow>
                    <Field label="Referred By">
                      <Select value={prospect.referredBy || undefined} onValueChange={(v) => setP('referredBy', v)}>
                        <SelectTrigger><SelectValue placeholder="Select advisor" /></SelectTrigger>
                        <SelectContent>
                          {AGENT_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Primary Advisor">
                      <Select value={prospect.primaryAdvisor || undefined} onValueChange={(v) => setP('primaryAdvisor', v)}>
                        <SelectTrigger><SelectValue placeholder="Select advisor" /></SelectTrigger>
                        <SelectContent>
                          {AGENT_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>
                  <Field label="Assigned To">
                    <Select value={prospect.assignedTo || undefined} onValueChange={(v) => setP('assignedTo', v)}>
                      <SelectTrigger><SelectValue placeholder="Select advisor" /></SelectTrigger>
                      <SelectContent>
                        {AGENT_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            </>
          )}

          {step === 2 && kind === 'business' && (
            <>
              <div>
                <SectionHeader title="Address" />
                <div className="space-y-4 mt-3">
                  <FieldRow>
                    <Field label="Country">
                      <Select value={business.country} onValueChange={(v) => setB('country', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="State">
                      <Select value={business.state || undefined} onValueChange={(v) => setB('state', v)}>
                        <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>
                  <Field label="Address line 1" required error={touched ? step2Errors.addressLine1 : undefined}>
                    <Input value={business.addressLine1} onChange={(e) => setB('addressLine1', e.target.value)} />
                  </Field>
                  <Field label="Address line 2">
                    <Input value={business.addressLine2} onChange={(e) => setB('addressLine2', e.target.value)} />
                  </Field>
                  <FieldRow>
                    <Field label="City" required error={touched ? step2Errors.city : undefined}>
                      <Input value={business.city} onChange={(e) => setB('city', e.target.value)} />
                    </Field>
                    <Field label="Zip Code" required error={touched ? step2Errors.zipCode : undefined}>
                      <Input value={business.zipCode} onChange={(e) => setB('zipCode', e.target.value)} />
                    </Field>
                  </FieldRow>
                </div>
              </div>

              <div>
                <SectionHeader title="Assignment" />
                <div className="space-y-4 mt-3">
                  <FieldRow>
                    <Field label="Referred By">
                      <Select value={business.referredBy || undefined} onValueChange={(v) => setB('referredBy', v)}>
                        <SelectTrigger><SelectValue placeholder="Select advisor" /></SelectTrigger>
                        <SelectContent>
                          {AGENT_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Primary Advisor">
                      <Select value={business.primaryAdvisor || undefined} onValueChange={(v) => setB('primaryAdvisor', v)}>
                        <SelectTrigger><SelectValue placeholder="Select advisor" /></SelectTrigger>
                        <SelectContent>
                          {AGENT_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>
                  <Field label="Assigned To">
                    <Select value={business.assignedTo || undefined} onValueChange={(v) => setB('assignedTo', v)}>
                      <SelectTrigger><SelectValue placeholder="Select advisor" /></SelectTrigger>
                      <SelectContent>
                        {AGENT_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div className="text-xs text-muted-foreground">
            Step {step} of 2
          </div>
          <div className="flex items-center gap-2">
            {step === 1 ? (
              <>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleNext}>Next</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setStep(1); setTouched(false) }}>Go Back</Button>
                <Button onClick={handleCreate}>
                  Create {kind === 'business' ? 'Business' : 'Prospect'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
