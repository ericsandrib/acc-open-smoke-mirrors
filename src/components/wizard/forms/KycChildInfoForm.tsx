import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorkflow, useTaskData, useChildActionContext, useAdvisorUnlocked } from '@/stores/workflowStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Lock, AlertTriangle, CheckCircle2, Upload } from 'lucide-react'
import { FileUpload, type FileWithStatus } from '@/components/ui/file-upload'
import { householdRelationships, householdRoles } from './AddPartySheet'
import { cn } from '@/lib/utils'

const ID_TYPES = ['Driver\'s License', 'Passport', 'State ID', 'Military ID'] as const
const SOURCE_OF_FUNDS = ['Employment Income', 'Inheritance', 'Investment Returns', 'Business Revenue', 'Savings', 'Gift', 'Other'] as const
const CITIZENSHIP_OPTIONS = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Other'] as const
const sectionCls = 'text-sm font-semibold text-foreground'
const fieldCls = 'text-xs font-medium text-foreground'

const KYC_DOCS = [
  {
    id: 'gov-id',
    label: 'Government-Issued ID',
    description: 'Upload a passport, driver\'s license, or national ID card',
    hint: 'PDF, JPG, or PNG up to 10 MB',
  },
  {
    id: 'supporting-docs',
    label: 'Supporting Documents',
    description: 'Upload proof of address, utility bills, or other supporting documentation',
    hint: 'PDF, JPG, or PNG up to 10 MB',
  },
]

interface ValidationError {
  field: string
  message: string
}

const REQUIRED_RULES: { field: string; label: string }[] = [
  { field: 'firstName', label: 'First name' },
  { field: 'lastName', label: 'Last name' },
  { field: 'dob', label: 'Date of birth' },
  { field: 'taxId', label: 'SSN / Tax ID' },
  { field: 'legalStreet', label: 'Legal address (street)' },
  { field: 'idType', label: 'ID type' },
  { field: 'idNumber', label: 'ID number' },
  { field: 'idExpiration', label: 'ID expiration date' },
  { field: 'citizenship', label: 'Citizenship' },
  { field: 'sourceOfFunds', label: 'Source of funds' },
]

export function getKycValidationErrors(data: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = []
  for (const rule of REQUIRED_RULES) {
    if (!data[rule.field]) {
      errors.push({ field: rule.field, message: `${rule.label} is required` })
    }
  }
  if (data.idExpiration && new Date(data.idExpiration as string) < new Date()) {
    errors.push({ field: 'idExpiration', message: 'ID document is expired' })
  }
  return errors
}

function RequiredStar() {
  return <span className="text-red-500 ml-0.5">*</span>
}

function InlineError({ message }: { message: string }) {
  return <p className="text-xs text-red-600 mt-0.5">{message}</p>
}

function ValidationSummary({ errors, position }: { errors: ValidationError[]; position: 'top' | 'bottom' }) {
  if (errors.length === 0) {
    if (position === 'bottom') {
      return (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-900 dark:text-green-100">All required fields are complete</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn(
      'rounded-lg border px-4 py-3 space-y-2',
      position === 'top'
        ? 'border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40'
        : 'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40',
    )}>
      <div className="flex items-center gap-2">
        <AlertTriangle className={cn('h-4 w-4 shrink-0', position === 'top' ? 'text-red-600' : 'text-amber-600')} />
        <p className={cn(
          'text-sm font-medium',
          position === 'top' ? 'text-red-900 dark:text-red-100' : 'text-amber-900 dark:text-amber-100',
        )}>
          {position === 'top'
            ? `Please fix ${errors.length} issue${errors.length > 1 ? 's' : ''} before submitting`
            : `Validation Issues (${errors.length})`}
        </p>
      </div>
      <ul className="space-y-1 pl-6">
        {errors.map((err) => (
          <li key={err.field} className={cn(
            'text-xs list-disc',
            position === 'top' ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200',
          )}>
            {err.message}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function KycChildInfoForm() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()
  const taskId = ctx?.subTaskId ?? ''
  const { data, updateFields, updateField } = useTaskData(taskId || '__no_child__')
  const prePopulated = useRef(false)
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const topRef = useRef<HTMLDivElement>(null)

  const child = ctx?.child ?? null
  const submitAttempted = !!data._submitAttempted

  const party = child
    ? state.relatedParties.find((p) => p.name === child.name)
    : null

  useEffect(() => {
    if (party && !prePopulated.current && Object.keys(data).length === 0) {
      prePopulated.current = true
      const ext = party.accountOwnerIndividual ?? {}
      updateFields({
        firstName: party.firstName ?? '',
        lastName: party.lastName ?? '',
        middleName: ext.middleName ?? '',
        suffix: ext.suffix ?? '',
        dob: party.dob ?? '',
        taxId: party.taxId ?? '',
        relationship: party.relationship ?? '',
        role: party.role ?? '',
        email: party.email ?? '',
        phone: party.phone ?? '',
        legalStreet: ext.legalStreet ?? '',
        legalApt: ext.legalApt ?? '',
        legalCity: ext.legalCity ?? '',
        legalState: ext.legalState ?? '',
        legalZip: ext.legalZip ?? '',
        legalCountry: ext.legalCountry ?? '',
        mailingSameAsLegal: ext.mailingSameAsLegal !== false ? 'true' : 'false',
        mailingStreet: ext.mailingStreet ?? '',
        mailingCity: ext.mailingCity ?? '',
        mailingState: ext.mailingState ?? '',
        mailingZip: ext.mailingZip ?? '',
        mailingCountry: ext.mailingCountry ?? '',
        idType: '',
        idNumber: '',
        idState: '',
        idExpiration: '',
        employmentStatus: ext.employmentStatus ?? '',
        employerName: ext.employerName ?? '',
        occupation: ext.occupation ?? '',
        industry: ext.industry ?? '',
        citizenship: '',
        sourceOfFunds: ext.sourceOfFunds ?? '',
      })
    }
  }, [party, data, updateFields])

  const validationScrollNonce = data._validationScrollNonce as number | undefined
  useEffect(() => {
    if (!submitAttempted || validationScrollNonce == null) return
    const errors = getKycValidationErrors(data)
    if (errors.length === 0) return
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    // Intentionally omit `data`: only scroll when a new submit validation is triggered (nonce), not on every field edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitAttempted, validationScrollNonce])

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => {
      if (prev.has(field)) return prev
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }, [])

  const advisorUnlocked = useAdvisorUnlocked()

  if (!child) return null

  const statusLocked = child.status === 'awaiting_review' || child.status === 'complete' || child.status === 'rejected'
  const isLocked = statusLocked && !advisorUnlocked
  const str = (key: string) => (data[key] as string) ?? ''
  const mailingSame = str('mailingSameAsLegal') !== 'false'

  const allErrors = getKycValidationErrors(data)
  const errorMap = new Map(allErrors.map((e) => [e.field, e.message]))

  const showError = (field: string) => {
    if (isLocked) return false
    return (submitAttempted || touched.has(field)) && errorMap.has(field)
  }

  const inputErrorCls = (field: string) =>
    showError(field) ? 'border-red-500 focus-visible:ring-red-500' : ''

  return (
    <div className="space-y-6" ref={topRef}>
      {isLocked && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
              This submission is under review. Fields are locked and cannot be edited.
            </p>
          </div>
        </div>
      )}

      {!isLocked && submitAttempted && allErrors.length > 0 && (
        <ValidationSummary errors={allErrors} position="top" />
      )}

      {/* Personal Information */}
      <section className="space-y-3">
        <h4 className={sectionCls}>Personal Information</h4>
        <div className="space-y-3">
          <div className="space-y-1.5" data-field="firstName">
            <Label className={fieldCls}>First name<RequiredStar /></Label>
            <Input
              value={str('firstName')}
              onChange={(e) => updateField('firstName', e.target.value)}
              onBlur={() => markTouched('firstName')}
              disabled={isLocked}
              className={inputErrorCls('firstName')}
            />
            {showError('firstName') && <InlineError message={errorMap.get('firstName')!} />}
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Middle name</Label>
            <Input value={str('middleName')} onChange={(e) => updateField('middleName', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5" data-field="lastName">
            <Label className={fieldCls}>Last name<RequiredStar /></Label>
            <Input
              value={str('lastName')}
              onChange={(e) => updateField('lastName', e.target.value)}
              onBlur={() => markTouched('lastName')}
              disabled={isLocked}
              className={inputErrorCls('lastName')}
            />
            {showError('lastName') && <InlineError message={errorMap.get('lastName')!} />}
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Suffix</Label>
            <Select value={str('suffix') || '__none__'} onValueChange={(v) => updateField('suffix', v === '__none__' ? '' : v)} disabled={isLocked}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {(['Jr.', 'Sr.', 'II', 'III', 'IV', 'Esq.'] as const).map((x) => (
                  <SelectItem key={x} value={x}>{x}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5" data-field="dob">
            <Label className={fieldCls}>Date of birth<RequiredStar /></Label>
            <Input
              type="date"
              value={str('dob')}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => updateField('dob', e.target.value)}
              onBlur={() => markTouched('dob')}
              disabled={isLocked}
              className={inputErrorCls('dob')}
            />
            {showError('dob') && <InlineError message={errorMap.get('dob')!} />}
          </div>
          <div className="space-y-1.5" data-field="taxId">
            <Label className={fieldCls}>SSN / Tax ID<RequiredStar /></Label>
            <Input
              value={str('taxId')}
              onChange={(e) => updateField('taxId', e.target.value)}
              onBlur={() => markTouched('taxId')}
              placeholder="XXX-XX-XXXX"
              disabled={isLocked}
              className={inputErrorCls('taxId')}
            />
            {showError('taxId') && <InlineError message={errorMap.get('taxId')!} />}
          </div>
          <div className="space-y-1.5" data-field="citizenship">
            <Label className={fieldCls}>Citizenship<RequiredStar /></Label>
            <Select value={str('citizenship') || undefined} onValueChange={(v) => { updateField('citizenship', v); markTouched('citizenship') }} disabled={isLocked}>
              <SelectTrigger className={inputErrorCls('citizenship')}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {CITIZENSHIP_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {showError('citizenship') && <InlineError message={errorMap.get('citizenship')!} />}
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Relationship</Label>
            <Select value={str('relationship') || undefined} onValueChange={(v) => updateField('relationship', v)} disabled={isLocked}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {householdRelationships.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Role</Label>
            <Select value={str('role') || undefined} onValueChange={(v) => updateField('role', v)} disabled={isLocked}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {householdRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Address */}
      <section className="space-y-3">
        <h4 className={sectionCls}>Address</h4>
        <p className="text-xs text-muted-foreground font-medium">Legal (residential) address</p>
        <div className="space-y-3">
          <div className="space-y-1.5" data-field="legalStreet">
            <Label className={fieldCls}>Street<RequiredStar /></Label>
            <Input
              value={str('legalStreet')}
              onChange={(e) => updateField('legalStreet', e.target.value)}
              onBlur={() => markTouched('legalStreet')}
              disabled={isLocked}
              className={inputErrorCls('legalStreet')}
            />
            {showError('legalStreet') && <InlineError message={errorMap.get('legalStreet')!} />}
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Apt / unit</Label>
            <Input value={str('legalApt')} onChange={(e) => updateField('legalApt', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>City</Label>
            <Input value={str('legalCity')} onChange={(e) => updateField('legalCity', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>State</Label>
            <Input value={str('legalState')} onChange={(e) => updateField('legalState', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>ZIP</Label>
            <Input value={str('legalZip')} onChange={(e) => updateField('legalZip', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Country</Label>
            <Input value={str('legalCountry')} onChange={(e) => updateField('legalCountry', e.target.value)} disabled={isLocked} />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="kyc-mailing-same"
            checked={mailingSame}
            onChange={(e) => updateField('mailingSameAsLegal', e.target.checked ? 'true' : 'false')}
            className="rounded border-border"
            disabled={isLocked}
          />
          <Label htmlFor="kyc-mailing-same" className="text-sm font-normal cursor-pointer">
            Mailing address is the same as legal address
          </Label>
        </div>

        {!mailingSame && (
          <div className="space-y-3 rounded-md border border-border p-3 bg-muted/20">
            <p className="text-xs text-muted-foreground font-medium">Mailing address</p>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Street</Label>
              <Input value={str('mailingStreet')} onChange={(e) => updateField('mailingStreet', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>City</Label>
              <Input value={str('mailingCity')} onChange={(e) => updateField('mailingCity', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>State</Label>
              <Input value={str('mailingState')} onChange={(e) => updateField('mailingState', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>ZIP</Label>
              <Input value={str('mailingZip')} onChange={(e) => updateField('mailingZip', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Country</Label>
              <Input value={str('mailingCountry')} onChange={(e) => updateField('mailingCountry', e.target.value)} disabled={isLocked} />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className={fieldCls}>Phone</Label>
          <Input type="tel" value={str('phone')} onChange={(e) => updateField('phone', e.target.value)} disabled={isLocked} />
        </div>
        <div className="space-y-1.5">
          <Label className={fieldCls}>Email</Label>
          <Input type="email" value={str('email')} onChange={(e) => updateField('email', e.target.value)} disabled={isLocked} />
        </div>
      </section>

      <hr className="border-border" />

      {/* ID Verification */}
      <section className="space-y-3">
        <h4 className={sectionCls}>ID Verification</h4>
        <div className="space-y-3">
          <div className="space-y-1.5" data-field="idType">
            <Label className={fieldCls}>ID type<RequiredStar /></Label>
            <Select value={str('idType') || undefined} onValueChange={(v) => { updateField('idType', v); markTouched('idType') }} disabled={isLocked}>
              <SelectTrigger className={inputErrorCls('idType')}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {ID_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {showError('idType') && <InlineError message={errorMap.get('idType')!} />}
          </div>
          <div className="space-y-1.5" data-field="idNumber">
            <Label className={fieldCls}>ID number<RequiredStar /></Label>
            <Input
              value={str('idNumber')}
              onChange={(e) => updateField('idNumber', e.target.value)}
              onBlur={() => markTouched('idNumber')}
              placeholder="ID number"
              disabled={isLocked}
              className={inputErrorCls('idNumber')}
            />
            {showError('idNumber') && <InlineError message={errorMap.get('idNumber')!} />}
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Issuing state</Label>
            <Input value={str('idState')} onChange={(e) => updateField('idState', e.target.value)} placeholder="e.g. California" disabled={isLocked} />
          </div>
          <div className="space-y-1.5" data-field="idExpiration">
            <Label className={fieldCls}>Expiration date<RequiredStar /></Label>
            <Input
              type="date"
              value={str('idExpiration')}
              onChange={(e) => updateField('idExpiration', e.target.value)}
              onBlur={() => markTouched('idExpiration')}
              disabled={isLocked}
              className={inputErrorCls('idExpiration')}
            />
            {showError('idExpiration') && <InlineError message={errorMap.get('idExpiration')!} />}
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Employment */}
      <section className="space-y-3">
        <h4 className={sectionCls}>Employment</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={fieldCls}>Employment status</Label>
            <Select value={str('employmentStatus') || undefined} onValueChange={(v) => updateField('employmentStatus', v)} disabled={isLocked}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {(['Employed', 'Self-employed', 'Retired', 'Unemployed'] as const).map((x) => (
                  <SelectItem key={x} value={x}>{x}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Employer name</Label>
            <Input value={str('employerName')} onChange={(e) => updateField('employerName', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Occupation</Label>
            <Input value={str('occupation')} onChange={(e) => updateField('occupation', e.target.value)} disabled={isLocked} />
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Industry</Label>
            <Input value={str('industry')} onChange={(e) => updateField('industry', e.target.value)} disabled={isLocked} />
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Source of Funds */}
      <section className="space-y-3">
        <h4 className={sectionCls}>Source of Funds</h4>
        <div className="space-y-3">
          <div className="space-y-1.5" data-field="sourceOfFunds">
            <Label className={fieldCls}>Primary source of funds<RequiredStar /></Label>
            <Select value={str('sourceOfFunds') || undefined} onValueChange={(v) => { updateField('sourceOfFunds', v); markTouched('sourceOfFunds') }} disabled={isLocked}>
              <SelectTrigger className={inputErrorCls('sourceOfFunds')}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {SOURCE_OF_FUNDS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {showError('sourceOfFunds') && <InlineError message={errorMap.get('sourceOfFunds')!} />}
          </div>
          <div className="space-y-1.5">
            <Label className={fieldCls}>Additional details</Label>
            <Input value={str('sourceOfFundsDetails')} onChange={(e) => updateField('sourceOfFundsDetails', e.target.value)} placeholder="Provide additional context if needed" disabled={isLocked} />
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="space-y-3">
        <h3 className={sectionCls}>
          <span className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            Documents
          </span>
        </h3>
        <div className="space-y-4">
          {KYC_DOCS.map((doc) => {
            const storedFiles = (data[`doc-${doc.id}`] as { name: string; size?: number }[] | undefined) ?? []
            return (
              <FileUpload
                key={doc.id}
                id={`kyc-${taskId}-${doc.id}`}
                label={doc.label}
                subtitle={doc.description}
                hint={doc.hint}
                initialFiles={storedFiles}
                acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png']}
                disabled={isLocked}
                onFilesChange={(files: FileWithStatus[]) => {
                  const meta = files.map((f) => ({
                    name: f.file.name,
                    size: f.file.size,
                  }))
                  updateField(`doc-${doc.id}`, meta)
                }}
              />
            )
          })}
        </div>
      </section>

    </div>
  )
}
