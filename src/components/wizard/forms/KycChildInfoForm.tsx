import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorkflow, useTaskData, useChildActionContext, useAdvisorFormsEditable } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SensitiveTaxIdInput } from '@/components/ui/sensitive-tax-id-input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Lock, AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { AddHouseholdMemberSheet, householdRelationships, householdRoles } from './AddPartySheet'
import { PartySlotCard } from './PartySlotCard'
import { cn } from '@/lib/utils'

const ID_TYPES = ['Driver\'s License', 'Passport', 'State ID', 'Military ID'] as const
const SOURCE_OF_FUNDS = ['Employment Income', 'Inheritance', 'Investment Returns', 'Business Revenue', 'Savings', 'Gift', 'Other'] as const
const CITIZENSHIP_OPTIONS = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Other'] as const
const sectionCls = 'text-sm font-semibold text-foreground'
const fieldCls = 'text-xs font-medium text-foreground'

interface ValidationError {
  field: string
  message: string
}

const KYC_ID_VERIFICATION_FIELDS = new Set(['idType', 'idNumber', 'idExpiration'])

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

const ENTITY_REQUIRED_RULES: { field: string; label: string }[] = [
  { field: 'legalName', label: 'Legal name' },
  { field: 'entityType', label: 'Entity type' },
  { field: 'taxId', label: 'Tax ID / EIN' },
  { field: 'jurisdiction', label: 'Jurisdiction' },
]

export type GetKycValidationErrorsOptions = {
  /** When true, ID type / number / expiration are not required (e.g. Jane Smith KYC in demo). */
  optionalIdVerification?: boolean
  /** KYC subject shape — individuals use CIP fields; entities use KYB fields. */
  subjectType?: 'individual' | 'entity'
}

/** KYC child display name matches Jane Smith — ID verification fields are optional in the demo. */
export function kycChildHasOptionalIdVerification(child: { name: string } | null): boolean {
  if (!child?.name) return false
  return child.name.trim().toLowerCase() === 'jane smith'
}

export function getKycValidationErrors(
  data: Record<string, unknown>,
  options?: GetKycValidationErrorsOptions,
): ValidationError[] {
  if (options?.subjectType === 'entity') {
    const entityErrors: ValidationError[] = []
    for (const rule of ENTITY_REQUIRED_RULES) {
      if (!data[rule.field]) {
        entityErrors.push({ field: rule.field, message: `${rule.label} is required` })
      }
    }
    return entityErrors
  }

  const optionalId = options?.optionalIdVerification === true
  const errors: ValidationError[] = []
  for (const rule of REQUIRED_RULES) {
    if (optionalId && KYC_ID_VERIFICATION_FIELDS.has(rule.field)) continue
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

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function splitAddress(value: string): {
  street: string
  apt: string
  city: string
  state: string
  zip: string
  country: string
} {
  const input = value.trim()
  if (!input) return { street: '', apt: '', city: '', state: '', zip: '', country: '' }
  const parts = input.split(',').map((x) => x.trim()).filter(Boolean)
  return {
    street: parts[0] ?? '',
    apt: '',
    city: parts[1] ?? '',
    state: parts[2] ?? '',
    zip: parts[3] ?? '',
    country: parts[4] ?? '',
  }
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
  const [beneficialOwnerSheetOpen, setBeneficialOwnerSheetOpen] = useState(false)
  const [pendingBeneficialOwnerIndex, setPendingBeneficialOwnerIndex] = useState<number | null>(null)
  const [editingBeneficialOwnerIndex, setEditingBeneficialOwnerIndex] = useState<number | null>(null)
  const [controlPersonAddSheetOpen, setControlPersonAddSheetOpen] = useState(false)
  const [controlPersonDetailsOpen, setControlPersonDetailsOpen] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  const child = ctx?.child ?? null
  const submitAttempted = !!data._submitAttempted

  const childMeta = child
    ? (state.taskData[child.id] as Record<string, unknown> | undefined)
    : undefined
  const subjectTypeFromMeta =
    childMeta?.kycSubjectType === 'entity' ? 'entity' : childMeta?.kycSubjectType === 'individual' ? 'individual' : undefined
  const subjectPartyId = (childMeta?.kycSubjectPartyId as string | undefined) ?? undefined
  const party = child
    ? state.relatedParties.find((p) => p.id === subjectPartyId) ??
      state.relatedParties.find((p) => p.name === child.name)
    : null
  const isEntity = subjectTypeFromMeta
    ? subjectTypeFromMeta === 'entity'
    : party?.type === 'related_organization'

  useEffect(() => {
    if (party && !prePopulated.current && Object.keys(data).length === 0) {
      prePopulated.current = true
      const ext = party.accountOwnerIndividual ?? {}
      if (isEntity) {
        const trustPrimary = (party.trustParties ?? []).find((tp) => tp.partyId) ?? (party.trustParties ?? [])[0]
        const trustPrimaryMember = trustPrimary?.partyId
          ? state.relatedParties.find((p) => p.id === trustPrimary.partyId)
          : undefined
        const trustPrimaryMemberExt = trustPrimaryMember?.accountOwnerIndividual
        const formatMemberAddress = (memberId: string | undefined): string => {
          if (!memberId) return ''
          const member = state.relatedParties.find((p) => p.id === memberId)
          const memberExt = member?.accountOwnerIndividual
          if (!memberExt) return ''
          return [
            memberExt.legalStreet,
            memberExt.legalApt,
            [memberExt.legalCity, memberExt.legalState].filter(Boolean).join(', '),
            memberExt.legalZip,
            memberExt.legalCountry,
          ].filter(Boolean).join(' ').trim()
        }
        const splitFullName = (fullName?: string): { firstName: string; lastName: string } => {
          const text = fullName?.trim() ?? ''
          if (!text) return { firstName: '', lastName: '' }
          const parts = text.split(/\s+/)
          if (parts.length === 1) return { firstName: parts[0] ?? '', lastName: '' }
          return {
            firstName: parts.slice(0, -1).join(' '),
            lastName: parts[parts.length - 1] ?? '',
          }
        }
        const cpName = splitFullName(trustPrimaryMember?.name ?? party.contactPerson)
        const enrichedBeneficialOwners = (party.beneficialOwners ?? []).map((owner) => {
          const matchedMember = state.relatedParties.find(
            (p) =>
              p.type !== 'related_organization' &&
              !p.isHidden &&
              p.name?.trim().toLowerCase() === owner.name.trim().toLowerCase(),
          )
          const matchedExt = matchedMember?.accountOwnerIndividual
          const legacyAddress = matchedMember?.id ? formatMemberAddress(matchedMember.id) : ''
          return {
            partyId: matchedMember?.id ?? '',
            name: owner.name,
            ownershipPercent: owner.ownershipPercent,
            dob: matchedMember?.dob ?? '',
            nationality: matchedExt?.legalCountry ?? '',
            addressStreet: matchedExt?.legalStreet ?? '',
            addressApt: matchedExt?.legalApt ?? '',
            addressCity: matchedExt?.legalCity ?? '',
            addressState: matchedExt?.legalState ?? '',
            addressZip: matchedExt?.legalZip ?? '',
            addressCountry: matchedExt?.legalCountry ?? '',
            address: legacyAddress,
          }
        })
        const registeredAddress =
          formatMemberAddress(trustPrimaryMember?.id) ||
          trustPrimaryMember?.accountOwnerIndividual?.legalStreet ||
          party.jurisdiction ||
          ''
        const principalBusinessAddress = registeredAddress || party.jurisdiction || ''
        const inferredNatureOfBusiness = party.businessProfile?.industry || 'Trust administration / fiduciary management'
        const inferredRegulatoryClassification = party.entityType ? `${party.entityType} entity` : 'Legal entity'
        const inferredFatcaClassification = 'Passive NFFE'
        const registeredAddressParts = {
          street: trustPrimaryMemberExt?.legalStreet ?? splitAddress(registeredAddress).street,
          apt: trustPrimaryMemberExt?.legalApt ?? splitAddress(registeredAddress).apt,
          city: trustPrimaryMemberExt?.legalCity ?? splitAddress(registeredAddress).city,
          state: trustPrimaryMemberExt?.legalState ?? splitAddress(registeredAddress).state,
          zip: trustPrimaryMemberExt?.legalZip ?? splitAddress(registeredAddress).zip,
          country: trustPrimaryMemberExt?.legalCountry ?? splitAddress(registeredAddress).country,
        }
        const principalBusinessAddressParts = {
          street: trustPrimaryMemberExt?.legalStreet ?? splitAddress(principalBusinessAddress).street,
          apt: trustPrimaryMemberExt?.legalApt ?? splitAddress(principalBusinessAddress).apt,
          city: trustPrimaryMemberExt?.legalCity ?? splitAddress(principalBusinessAddress).city,
          state: trustPrimaryMemberExt?.legalState ?? splitAddress(principalBusinessAddress).state,
          zip: trustPrimaryMemberExt?.legalZip ?? splitAddress(principalBusinessAddress).zip,
          country: trustPrimaryMemberExt?.legalCountry ?? splitAddress(principalBusinessAddress).country,
        }
        const cpAddressParts = {
          street: trustPrimaryMemberExt?.legalStreet ?? '',
          apt: trustPrimaryMemberExt?.legalApt ?? '',
          city: trustPrimaryMemberExt?.legalCity ?? '',
          state: trustPrimaryMemberExt?.legalState ?? '',
          zip: trustPrimaryMemberExt?.legalZip ?? '',
          country: trustPrimaryMemberExt?.legalCountry ?? '',
        }
        updateFields({
          legalName: party.organizationName ?? party.name ?? '',
          entityType: party.entityType ?? '',
          taxId: party.taxId ?? '',
          jurisdiction: party.jurisdiction ?? '',
          contactPerson: party.contactPerson ?? '',
          email: party.email ?? '',
          phone: party.phone ?? '',
          sourceOfFunds: party.businessProfile?.sourceOfFunds ?? '',
          bizIndustry: party.businessProfile?.industry ?? '',
          annualRevenueRange: party.businessProfile?.annualRevenueRange ?? '',
          registrationNumber: party.clientId ?? '',
          dateOfFormation: party.dateOfFormation ?? '',
          registeredAddress,
          registeredStreet: registeredAddressParts.street,
          registeredApt: registeredAddressParts.apt,
          registeredCity: registeredAddressParts.city,
          registeredState: registeredAddressParts.state,
          registeredZip: registeredAddressParts.zip,
          registeredCountry: registeredAddressParts.country,
          principalBusinessAddress,
          principalStreet: principalBusinessAddressParts.street,
          principalApt: principalBusinessAddressParts.apt,
          principalCity: principalBusinessAddressParts.city,
          principalState: principalBusinessAddressParts.state,
          principalZip: principalBusinessAddressParts.zip,
          principalCountry: principalBusinessAddressParts.country,
          tradingName: party.organizationName ?? party.name ?? '',
          fatcaClassification: inferredFatcaClassification,
          regulatoryClassification: inferredRegulatoryClassification,
          natureOfBusiness: inferredNatureOfBusiness,
          expectedTransactionVolume: 'Moderate',
          expectedAssetSize: 'High',
          geographicExposure: party.jurisdiction ?? 'United States',
          cpFirstName: cpName.firstName,
          cpLastName: cpName.lastName,
          cpPartyId: trustPrimaryMember?.id ?? '',
          cpDob: trustPrimaryMember?.dob ?? '',
          cpAddress: formatMemberAddress(trustPrimaryMember?.id),
          cpAddressStreet: cpAddressParts.street,
          cpAddressApt: cpAddressParts.apt,
          cpAddressCity: cpAddressParts.city,
          cpAddressState: cpAddressParts.state,
          cpAddressZip: cpAddressParts.zip,
          cpAddressCountry: cpAddressParts.country,
          cpRelationship: trustPrimary?.role ?? trustPrimaryMember?.relationship ?? 'Trustee',
          cpRoleTitle: trustPrimary?.role ?? 'Trustee',
          beneficialOwners: enrichedBeneficialOwners,
        })
      } else {
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
          idType: ext.kycIdType ?? '',
          idNumber: ext.kycIdNumber ?? '',
          idState: ext.kycIdState ?? '',
          idExpiration: ext.kycIdExpiration ?? '',
          employmentStatus: ext.employmentStatus ?? '',
          employerName: ext.employerName ?? '',
          occupation: ext.occupation ?? '',
          industry: ext.industry ?? '',
          // Citizenship has no backing field on the party extension yet, so preserve
          // whatever the advisor has already entered in the form rather than
          // re-initializing to '' on every effect run (which would wipe the
          // user's Select selection because `data` is in this effect's deps).
          citizenship: (data.citizenship as string) || '',
          sourceOfFunds: ext.sourceOfFunds ?? '',
        })
      }
    }
  }, [party, data, updateFields, isEntity])

  useEffect(() => {
    if (!isEntity) return
    const owners = (data.beneficialOwners as Array<{
      partyId?: string
      name?: string
      ownershipPercent?: string
      dob?: string
      nationality?: string
      addressStreet?: string
      addressApt?: string
      addressCity?: string
      addressState?: string
      addressZip?: string
      addressCountry?: string
      address?: string
    }> | undefined) ?? []
    if (owners.length === 0) return

    const needsHydration = owners.some((owner) => {
      const hasStructuredAddress =
        Boolean(owner.addressStreet) ||
        Boolean(owner.addressCity) ||
        Boolean(owner.addressState) ||
        Boolean(owner.addressZip) ||
        Boolean(owner.addressCountry)
      return !hasStructuredAddress
    })
    if (!needsHydration) return

    let changed = false
    const nextOwners = owners.map((owner) => {
      const partyMatch = owner.partyId
        ? state.relatedParties.find((p) => p.id === owner.partyId)
        : state.relatedParties.find(
            (p) =>
              p.type !== 'related_organization' &&
              !p.isHidden &&
              p.name?.trim().toLowerCase() === (owner.name ?? '').trim().toLowerCase(),
          )
      const ext = partyMatch?.accountOwnerIndividual
      if (!ext) return owner
      const next = {
        ...owner,
        partyId: owner.partyId ?? partyMatch?.id ?? '',
        dob: owner.dob || partyMatch?.dob || '',
        nationality: owner.nationality || ext.legalCountry || '',
        addressStreet: owner.addressStreet || ext.legalStreet || '',
        addressApt: owner.addressApt || ext.legalApt || '',
        addressCity: owner.addressCity || ext.legalCity || '',
        addressState: owner.addressState || ext.legalState || '',
        addressZip: owner.addressZip || ext.legalZip || '',
        addressCountry: owner.addressCountry || ext.legalCountry || '',
      }
      if (JSON.stringify(next) !== JSON.stringify(owner)) changed = true
      return next
    })

    if (changed) {
      updateField('beneficialOwners', nextOwners)
    }
  }, [isEntity, data.beneficialOwners, state.relatedParties, updateField])

  useEffect(() => {
    if (!isEntity) return
    const normalizeEntityAddress = (prefix: 'registered' | 'principal') => {
      const cityKey = `${prefix}City`
      const stateKey = `${prefix}State`
      const zipKey = `${prefix}Zip`
      const countryKey = `${prefix}Country`
      const cityRaw = (data[cityKey] as string | undefined) ?? ''
      const stateRaw = (data[stateKey] as string | undefined) ?? ''
      const zipRaw = (data[zipKey] as string | undefined) ?? ''
      const countryRaw = (data[countryKey] as string | undefined) ?? ''
      if (!cityRaw || stateRaw || zipRaw || countryRaw) return
      if (!cityRaw.includes(',') && cityRaw.trim().split(/\s+/).length < 4) return
      const parsed = splitAddress(cityRaw)
      if (!parsed.city || (!parsed.state && !parsed.zip && !parsed.country)) return
      updateFields({
        [cityKey]: parsed.city,
        [stateKey]: parsed.state,
        [zipKey]: parsed.zip,
        [countryKey]: parsed.country,
      })
    }
    normalizeEntityAddress('registered')
    normalizeEntityAddress('principal')
  }, [isEntity, data, updateFields])

  const validationScrollNonce = data._validationScrollNonce as number | undefined
  const idVerificationOptional = kycChildHasOptionalIdVerification(child)

  useEffect(() => {
    if (!submitAttempted || validationScrollNonce == null) return
    const errors = getKycValidationErrors(data, {
      optionalIdVerification: idVerificationOptional,
      subjectType: isEntity ? 'entity' : 'individual',
    })
    if (errors.length === 0) return
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    // Intentionally omit `data`: only scroll when a new submit validation is triggered (nonce), not on every field edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitAttempted, validationScrollNonce, idVerificationOptional, isEntity])

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => {
      if (prev.has(field)) return prev
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }, [])

  const advisorFormsEditable = useAdvisorFormsEditable()

  if (!child) return null

  const statusLocked = child.status === 'awaiting_review' || child.status === 'complete' || child.status === 'rejected'
  const isLocked = statusLocked && !advisorFormsEditable
  const isApproved = child.status === 'complete'
  const str = (key: string) => (data[key] as string) ?? ''
  const mailingSame = str('mailingSameAsLegal') !== 'false'

  const allErrors = getKycValidationErrors(data, {
    optionalIdVerification: idVerificationOptional,
    subjectType: isEntity ? 'entity' : 'individual',
  })
  const errorMap = new Map(allErrors.map((e) => [e.field, e.message]))

  const showError = (field: string) => {
    if (isLocked) return false
    return (submitAttempted || touched.has(field)) && errorMap.has(field)
  }

  const inputErrorCls = (field: string) =>
    showError(field) ? 'border-red-500 focus-visible:ring-red-500' : ''

  if (isEntity) {
    const legalName = str('legalName')
    const entityType = str('entityType')
    const taxId = str('taxId')
    const jurisdiction = str('jurisdiction')
    const registrationNumber = str('registrationNumber')
    const dateOfFormation = str('dateOfFormation')
    const registeredAddress = str('registeredAddress')
    const principalBusinessAddress = str('principalBusinessAddress')
    const registeredStreet = str('registeredStreet') || splitAddress(registeredAddress).street
    const registeredApt = str('registeredApt') || splitAddress(registeredAddress).apt
    const registeredCity = str('registeredCity') || splitAddress(registeredAddress).city
    const registeredState = str('registeredState') || splitAddress(registeredAddress).state
    const registeredZip = str('registeredZip') || splitAddress(registeredAddress).zip
    const registeredCountry = str('registeredCountry') || splitAddress(registeredAddress).country
    const principalStreet = str('principalStreet') || splitAddress(principalBusinessAddress).street
    const principalApt = str('principalApt') || splitAddress(principalBusinessAddress).apt
    const principalCity = str('principalCity') || splitAddress(principalBusinessAddress).city
    const principalState = str('principalState') || splitAddress(principalBusinessAddress).state
    const principalZip = str('principalZip') || splitAddress(principalBusinessAddress).zip
    const principalCountry = str('principalCountry') || splitAddress(principalBusinessAddress).country
    const tradingName = str('tradingName')
    const fatcaClassification = str('fatcaClassification')
    const regulatoryClassification = str('regulatoryClassification')
    const natureOfBusiness = str('natureOfBusiness')
    const transactionVolume = str('expectedTransactionVolume')
    const expectedAssetSize = str('expectedAssetSize')
    const geographicExposure = str('geographicExposure')
    const contactPerson = str('contactPerson')
    const email = str('email')
    const phone = str('phone')
    const sourceOfFunds = str('sourceOfFunds')
    const bizIndustry = str('bizIndustry')
    const annualRevenueRange = str('annualRevenueRange')
    const cpFirstName = str('cpFirstName')
    const cpLastName = str('cpLastName')
    const cpPartyId = str('cpPartyId')
    const cpDob = str('cpDob')
    const cpAddress = str('cpAddress')
    const cpAddressStreet = str('cpAddressStreet') || splitAddress(cpAddress).street
    const cpAddressApt = str('cpAddressApt') || splitAddress(cpAddress).apt
    const cpAddressCity = str('cpAddressCity') || splitAddress(cpAddress).city
    const cpAddressState = str('cpAddressState') || splitAddress(cpAddress).state
    const cpAddressZip = str('cpAddressZip') || splitAddress(cpAddress).zip
    const cpAddressCountry = str('cpAddressCountry') || splitAddress(cpAddress).country
    const cpRelationship = str('cpRelationship')
    const cpRoleTitle = str('cpRoleTitle')
    const beneficialOwners = ((data.beneficialOwners as Array<{
      partyId?: string
      name?: string
      ownershipPercent?: string
      dob?: string
      nationality?: string
      addressStreet?: string
      addressApt?: string
      addressCity?: string
      addressState?: string
      addressZip?: string
      addressCountry?: string
      address?: string
    }> | undefined) ?? [])
    const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden)
    const assignControlPersonFromParty = (partyId: string) => {
      const member = householdMembers.find((p) => p.id === partyId)
      if (!member) return
      const ext = member.accountOwnerIndividual
      updateFields({
        cpPartyId: partyId,
        cpFirstName: member.firstName ?? cpFirstName,
        cpLastName: member.lastName ?? cpLastName,
        cpDob: member.dob ?? cpDob,
        cpAddressStreet: ext?.legalStreet ?? cpAddressStreet,
        cpAddressApt: ext?.legalApt ?? cpAddressApt,
        cpAddressCity: ext?.legalCity ?? cpAddressCity,
        cpAddressState: ext?.legalState ?? cpAddressState,
        cpAddressZip: ext?.legalZip ?? cpAddressZip,
        cpAddressCountry: ext?.legalCountry ?? cpAddressCountry,
        cpAddress: formatLegalAddress(partyId) || cpAddress,
        cpRelationship: cpRelationship || member.relationship || '',
      })
    }
    const clearControlPerson = () => {
      updateFields({
        cpPartyId: '',
        cpFirstName: '',
        cpLastName: '',
        cpDob: '',
        cpAddressStreet: '',
        cpAddressApt: '',
        cpAddressCity: '',
        cpAddressState: '',
        cpAddressZip: '',
        cpAddressCountry: '',
        cpAddress: '',
        cpRelationship: '',
        cpRoleTitle: '',
      })
      setControlPersonDetailsOpen(false)
    }
    const formatLegalAddress = (partyId: string): string => {
      const member = state.relatedParties.find((p) => p.id === partyId)
      if (!member) return ''
      const ext = member.accountOwnerIndividual
      if (!ext) return ''
      return [
        ext.legalStreet,
        ext.legalApt,
        [ext.legalCity, ext.legalState].filter(Boolean).join(', '),
        ext.legalZip,
        ext.legalCountry,
      ].filter(Boolean).join(' ').trim()
    }
    const updateBeneficialOwnerFromParty = (idx: number, partyId: string) => {
      const member = householdMembers.find((p) => p.id === partyId)
      if (!member) return
      const owner = beneficialOwners[idx] ?? {}
      const inferredNationality = member.accountOwnerIndividual?.legalCountry ?? owner.nationality ?? ''
      const ext = member.accountOwnerIndividual
      const inferredAddress = formatLegalAddress(partyId) || owner.address || ''
      updateField(
        'beneficialOwners',
        beneficialOwners.map((current, i) =>
          i === idx
            ? {
                ...current,
                partyId,
                name: member.name ?? current.name ?? '',
                dob: member.dob ?? current.dob ?? '',
                nationality: inferredNationality,
                addressStreet: ext?.legalStreet ?? current.addressStreet ?? '',
                addressApt: ext?.legalApt ?? current.addressApt ?? '',
                addressCity: ext?.legalCity ?? current.addressCity ?? '',
                addressState: ext?.legalState ?? current.addressState ?? '',
                addressZip: ext?.legalZip ?? current.addressZip ?? '',
                addressCountry: ext?.legalCountry ?? current.addressCountry ?? '',
                address: inferredAddress,
              }
            : current,
        ),
      )
    }
    const patchBeneficialOwner = (
      idx: number,
      field:
        | 'partyId'
        | 'name'
        | 'ownershipPercent'
        | 'dob'
        | 'nationality'
        | 'addressStreet'
        | 'addressApt'
        | 'addressCity'
        | 'addressState'
        | 'addressZip'
        | 'addressCountry'
        | 'address',
      value: string,
    ) => {
      if (isLocked) return
      updateField(
        'beneficialOwners',
        beneficialOwners.map((owner, i) => (i === idx ? { ...owner, [field]: value } : owner)),
      )
    }
    const chooseBeneficialOwner = (idx: number, value: string) => {
      if (isLocked) return
      if (value === '__search_create__') {
        setPendingBeneficialOwnerIndex(idx)
        setBeneficialOwnerSheetOpen(true)
        return
      }
      updateBeneficialOwnerFromParty(idx, value)
    }
    const setCreatedBeneficialOwner = (partyId: string) => {
      if (pendingBeneficialOwnerIndex == null) return
      updateBeneficialOwnerFromParty(pendingBeneficialOwnerIndex, partyId)
      setPendingBeneficialOwnerIndex(null)
      setBeneficialOwnerSheetOpen(false)
    }
    const removeBeneficialOwner = (idx: number) => {
      if (isLocked) return
      updateField(
        'beneficialOwners',
        beneficialOwners.filter((_, i) => i !== idx),
      )
      setEditingBeneficialOwnerIndex((prev) => {
        if (prev == null) return prev
        if (prev === idx) return null
        if (prev > idx) return prev - 1
        return prev
      })
    }
    const editingBeneficialOwner = editingBeneficialOwnerIndex != null
      ? beneficialOwners[editingBeneficialOwnerIndex]
      : null

    return (
      <div className="space-y-6" ref={topRef}>
        {!isLocked && submitAttempted && allErrors.length > 0 && (
          <ValidationSummary errors={allErrors} position="top" />
        )}

        <section className="space-y-3">
          <h4 className={sectionCls}>Legal Entity Information</h4>
          <div className="space-y-3">
            <div className="space-y-1.5" data-field="legalName">
              <Label className={fieldCls}>Legal name<RequiredStar /></Label>
              <Input value={legalName} onChange={(e) => updateField('legalName', e.target.value)} onBlur={() => markTouched('legalName')} disabled={isLocked} className={inputErrorCls('legalName')} />
              {showError('legalName') && <InlineError message={errorMap.get('legalName')!} />}
            </div>
            <div className="space-y-1.5" data-field="entityType">
              <Label className={fieldCls}>Entity type<RequiredStar /></Label>
              <Input value={entityType} onChange={(e) => updateField('entityType', e.target.value)} onBlur={() => markTouched('entityType')} disabled={isLocked} className={inputErrorCls('entityType')} />
              {showError('entityType') && <InlineError message={errorMap.get('entityType')!} />}
            </div>
            <div className="space-y-1.5" data-field="taxId">
              <Label className={fieldCls}>Tax ID / EIN<RequiredStar /></Label>
              <SensitiveTaxIdInput value={taxId} onChange={(e) => updateField('taxId', e.target.value)} onBlur={() => markTouched('taxId')} placeholder="XX-XXXXXXX" disabled={isLocked} className={inputErrorCls('taxId')} />
              {showError('taxId') && <InlineError message={errorMap.get('taxId')!} />}
            </div>
            <div className="space-y-1.5" data-field="jurisdiction">
              <Label className={fieldCls}>Jurisdiction<RequiredStar /></Label>
              <Input value={jurisdiction} onChange={(e) => updateField('jurisdiction', e.target.value)} onBlur={() => markTouched('jurisdiction')} disabled={isLocked} className={inputErrorCls('jurisdiction')} />
              {showError('jurisdiction') && <InlineError message={errorMap.get('jurisdiction')!} />}
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Contact person</Label>
              <Input value={contactPerson} onChange={(e) => updateField('contactPerson', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Registration number</Label>
              <Input value={registrationNumber} onChange={(e) => updateField('registrationNumber', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Date of formation</Label>
              <Input type="date" value={dateOfFormation} onChange={(e) => updateField('dateOfFormation', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Registered address - Street</Label>
              <Input value={registeredStreet} onChange={(e) => updateField('registeredStreet', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Registered address - Apt / unit</Label>
              <Input value={registeredApt} onChange={(e) => updateField('registeredApt', e.target.value)} disabled={isLocked} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={fieldCls}>Registered address - City</Label>
                <Input value={registeredCity} onChange={(e) => updateField('registeredCity', e.target.value)} disabled={isLocked} />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Registered address - State</Label>
                <Input value={registeredState} onChange={(e) => updateField('registeredState', e.target.value)} disabled={isLocked} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={fieldCls}>Registered address - ZIP</Label>
                <Input value={registeredZip} onChange={(e) => updateField('registeredZip', e.target.value)} disabled={isLocked} />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Registered address - Country</Label>
                <Input value={registeredCountry} onChange={(e) => updateField('registeredCountry', e.target.value)} disabled={isLocked} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Principal place of business - Street</Label>
              <Input value={principalStreet} onChange={(e) => updateField('principalStreet', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Principal place of business - Apt / unit</Label>
              <Input value={principalApt} onChange={(e) => updateField('principalApt', e.target.value)} disabled={isLocked} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={fieldCls}>Principal place of business - City</Label>
                <Input value={principalCity} onChange={(e) => updateField('principalCity', e.target.value)} disabled={isLocked} />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Principal place of business - State</Label>
                <Input value={principalState} onChange={(e) => updateField('principalState', e.target.value)} disabled={isLocked} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={fieldCls}>Principal place of business - ZIP</Label>
                <Input value={principalZip} onChange={(e) => updateField('principalZip', e.target.value)} disabled={isLocked} />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldCls}>Principal place of business - Country</Label>
                <Input value={principalCountry} onChange={(e) => updateField('principalCountry', e.target.value)} disabled={isLocked} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Trading name / DBA</Label>
              <Input value={tradingName} onChange={(e) => updateField('tradingName', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Email</Label>
              <Input type="email" value={email} onChange={(e) => updateField('email', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Phone</Label>
              <Input type="tel" value={phone} onChange={(e) => updateField('phone', e.target.value)} disabled={isLocked} />
            </div>
          </div>
        </section>

        <hr className="border-border" />

        <section className="space-y-3">
          <h4 className={sectionCls}>Business Profile</h4>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className={fieldCls}>Nature of business / activities</Label>
              <Input value={natureOfBusiness} onChange={(e) => updateField('natureOfBusiness', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Industry</Label>
              <Input value={bizIndustry} onChange={(e) => updateField('bizIndustry', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Annual revenue range</Label>
              <Input value={annualRevenueRange} onChange={(e) => updateField('annualRevenueRange', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Source of funds</Label>
              <Input value={sourceOfFunds} onChange={(e) => updateField('sourceOfFunds', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Expected transaction volume</Label>
              <Input value={transactionVolume} onChange={(e) => updateField('expectedTransactionVolume', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Expected asset size</Label>
              <Input value={expectedAssetSize} onChange={(e) => updateField('expectedAssetSize', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Geographic exposure</Label>
              <Input value={geographicExposure} onChange={(e) => updateField('geographicExposure', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>FATCA / CRS classification</Label>
              <Input value={fatcaClassification} onChange={(e) => updateField('fatcaClassification', e.target.value)} disabled={isLocked} />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldCls}>Regulatory classification</Label>
              <Input value={regulatoryClassification} onChange={(e) => updateField('regulatoryClassification', e.target.value)} disabled={isLocked} />
            </div>
          </div>
        </section>

        <hr className="border-border" />

        <section className="space-y-3">
          <h4 className={sectionCls}>Control Person</h4>
          <div className="space-y-3">
            <PartySlotCard
              title="Control Person"
              roleLabel="Control person"
              selectLabel="Select control person"
              partyId={cpPartyId || undefined}
              onPartyIdChange={(partyId) => assignControlPersonFromParty(partyId)}
              onRemove={cpPartyId ? clearControlPerson : undefined}
              parties={state.relatedParties}
              selectCandidates={householdMembers}
              onOpenAddParty={() => setControlPersonAddSheetOpen(true)}
              onEditParty={() => setControlPersonDetailsOpen(true)}
              hideDefaultDetails
              addPartyItemLabel="Search for an existing client or add a new individual"
              addPartyItemDescription="Adds a person to this household for use as control person."
              footer={
                <div className="rounded-md border border-border bg-muted/20 p-3 grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium">First name</p>
                    <p className="text-foreground">{cpFirstName || 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium">Last name</p>
                    <p className="text-foreground">{cpLastName || 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium">Role / title</p>
                    <p className="text-foreground">{cpRoleTitle || 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium">Relationship</p>
                    <p className="text-foreground">{cpRelationship || 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium">Date of birth</p>
                    <p className="text-foreground">{cpDob || 'Not set'}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-muted-foreground font-medium">Street</p>
                    <p className="text-foreground">{cpAddressStreet || 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium">Apt / unit</p>
                    <p className="text-foreground">{cpAddressApt || 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium">City</p>
                    <p className="text-foreground">{cpAddressCity || 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium">State</p>
                    <p className="text-foreground">{cpAddressState || 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium">ZIP</p>
                    <p className="text-foreground">{cpAddressZip || 'Not set'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium">Country</p>
                    <p className="text-foreground">{cpAddressCountry || 'Not set'}</p>
                  </div>
                </div>
              }
            />
          </div>
        </section>

        <hr className="border-border" />

        <section className="space-y-3">
          <h4 className={sectionCls}>Beneficial Owners</h4>
          <p className="text-xs text-muted-foreground">Beneficial owners (typically 25%+ ownership)</p>
          <div className="rounded-lg border border-border p-1">
            <div>
              {beneficialOwners.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <p className="text-sm text-muted-foreground">No beneficial owners added yet.</p>
                </div>
              ) : (
                beneficialOwners.map((owner, idx) => {
                  const ownerName = owner.name?.trim() || 'Beneficial owner'
                  const ownershipLabel = owner.ownershipPercent?.trim() ? `${owner.ownershipPercent}%` : 'Not set'
                  return (
                    <div key={`${owner.partyId ?? owner.name ?? 'owner'}-${idx}`}>
                      <button
                        type="button"
                        onClick={() => setEditingBeneficialOwnerIndex(idx)}
                        className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                            {getInitials(ownerName)}
                          </div>
                          <span className="truncate text-sm font-medium">{ownerName}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-xs tabular-nums text-muted-foreground">{ownershipLabel}</span>
                          {!isLocked && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeBeneficialOwner(idx)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </button>
                    </div>
                  )
                })
              )}
            </div>
            {!isLocked && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  const nextOwners = [
                    ...beneficialOwners,
                    {
                      partyId: '',
                      name: '',
                      ownershipPercent: '',
                      dob: '',
                      nationality: '',
                      addressStreet: '',
                      addressApt: '',
                      addressCity: '',
                      addressState: '',
                      addressZip: '',
                      addressCountry: '',
                      address: '',
                    },
                  ]
                  updateField('beneficialOwners', nextOwners)
                  setEditingBeneficialOwnerIndex(nextOwners.length - 1)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add beneficial owner
              </Button>
            )}
          </div>
        </section>

        <Sheet
          open={editingBeneficialOwnerIndex !== null}
          onOpenChange={(open) => {
            if (!open) setEditingBeneficialOwnerIndex(null)
          }}
        >
          <SheetContent side="right" className="sm:max-w-[560px] flex flex-col gap-0 p-0">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
              <SheetTitle>Beneficial owner details</SheetTitle>
              <SheetDescription>
                Review or update ownership and identity details.
              </SheetDescription>
            </SheetHeader>
            {editingBeneficialOwner && (
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <div className="rounded-lg border border-border p-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{editingBeneficialOwner.name?.trim() || 'Beneficial owner'}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className={fieldCls}>Owner</Label>
                      <Select
                        value={editingBeneficialOwner.partyId || undefined}
                        onValueChange={(value) => chooseBeneficialOwner(editingBeneficialOwnerIndex!, value)}
                        disabled={isLocked}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select household member" />
                        </SelectTrigger>
                        <SelectContent>
                          {editingBeneficialOwner.name && !editingBeneficialOwner.partyId ? (
                            <SelectItem value={`__saved_owner_${editingBeneficialOwnerIndex}`} disabled>
                              {editingBeneficialOwner.name} (saved)
                            </SelectItem>
                          ) : null}
                          {householdMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="__search_create__">Search / create individual…</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={fieldCls}>Ownership %</Label>
                      <Input
                        placeholder="e.g. 40"
                        value={editingBeneficialOwner.ownershipPercent ?? ''}
                        disabled={isLocked}
                        onChange={(e) => patchBeneficialOwner(editingBeneficialOwnerIndex!, 'ownershipPercent', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className={fieldCls}>Date of birth</Label>
                      <Input
                        type="date"
                        value={editingBeneficialOwner.dob ?? ''}
                        disabled={isLocked}
                        onChange={(e) => patchBeneficialOwner(editingBeneficialOwnerIndex!, 'dob', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={fieldCls}>Nationality</Label>
                      <Input
                        placeholder="Nationality"
                        value={editingBeneficialOwner.nationality ?? ''}
                        disabled={isLocked}
                        onChange={(e) => patchBeneficialOwner(editingBeneficialOwnerIndex!, 'nationality', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={fieldCls}>Street</Label>
                    <Input
                      value={editingBeneficialOwner.addressStreet ?? ''}
                      disabled={isLocked}
                      onChange={(e) => patchBeneficialOwner(editingBeneficialOwnerIndex!, 'addressStreet', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={fieldCls}>Apt / unit</Label>
                    <Input
                      value={editingBeneficialOwner.addressApt ?? ''}
                      disabled={isLocked}
                      onChange={(e) => patchBeneficialOwner(editingBeneficialOwnerIndex!, 'addressApt', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className={fieldCls}>City</Label>
                      <Input
                        value={editingBeneficialOwner.addressCity ?? ''}
                        disabled={isLocked}
                        onChange={(e) => patchBeneficialOwner(editingBeneficialOwnerIndex!, 'addressCity', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={fieldCls}>State</Label>
                      <Input
                        value={editingBeneficialOwner.addressState ?? ''}
                        disabled={isLocked}
                        onChange={(e) => patchBeneficialOwner(editingBeneficialOwnerIndex!, 'addressState', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className={fieldCls}>ZIP</Label>
                      <Input
                        value={editingBeneficialOwner.addressZip ?? ''}
                        disabled={isLocked}
                        onChange={(e) => patchBeneficialOwner(editingBeneficialOwnerIndex!, 'addressZip', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={fieldCls}>Country</Label>
                      <Input
                        value={editingBeneficialOwner.addressCountry ?? ''}
                        disabled={isLocked}
                        onChange={(e) => patchBeneficialOwner(editingBeneficialOwnerIndex!, 'addressCountry', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        <AddHouseholdMemberSheet
          open={controlPersonAddSheetOpen}
          onOpenChange={setControlPersonAddSheetOpen}
          onPartyAdded={(partyId) => {
            assignControlPersonFromParty(partyId)
            setControlPersonAddSheetOpen(false)
          }}
          title="Add control person"
          description="Search for an existing individual or create a new person to assign as control person."
          individualCreateOnly
        />

        <Sheet
          open={controlPersonDetailsOpen}
          onOpenChange={setControlPersonDetailsOpen}
        >
          <SheetContent side="right" className="sm:max-w-[560px] flex flex-col gap-0 p-0">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
              <SheetTitle>Control person details</SheetTitle>
              <SheetDescription>
                Review or update control person identity and address details.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className={fieldCls}>First name</Label>
                    <Input value={cpFirstName} onChange={(e) => updateField('cpFirstName', e.target.value)} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={fieldCls}>Last name</Label>
                    <Input value={cpLastName} onChange={(e) => updateField('cpLastName', e.target.value)} disabled={isLocked} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className={fieldCls}>Role / title</Label>
                    <Input value={cpRoleTitle} onChange={(e) => updateField('cpRoleTitle', e.target.value)} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={fieldCls}>Relationship to entity</Label>
                    <Input value={cpRelationship} onChange={(e) => updateField('cpRelationship', e.target.value)} disabled={isLocked} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldCls}>Date of birth</Label>
                  <Input type="date" value={cpDob} onChange={(e) => updateField('cpDob', e.target.value)} disabled={isLocked} />
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldCls}>Street</Label>
                  <Input value={cpAddressStreet} onChange={(e) => updateField('cpAddressStreet', e.target.value)} disabled={isLocked} />
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldCls}>Apt / unit</Label>
                  <Input value={cpAddressApt} onChange={(e) => updateField('cpAddressApt', e.target.value)} disabled={isLocked} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className={fieldCls}>City</Label>
                    <Input value={cpAddressCity} onChange={(e) => updateField('cpAddressCity', e.target.value)} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={fieldCls}>State</Label>
                    <Input value={cpAddressState} onChange={(e) => updateField('cpAddressState', e.target.value)} disabled={isLocked} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className={fieldCls}>ZIP</Label>
                    <Input value={cpAddressZip} onChange={(e) => updateField('cpAddressZip', e.target.value)} disabled={isLocked} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={fieldCls}>Country</Label>
                    <Input value={cpAddressCountry} onChange={(e) => updateField('cpAddressCountry', e.target.value)} disabled={isLocked} />
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <AddHouseholdMemberSheet
          open={beneficialOwnerSheetOpen}
          onOpenChange={(open) => {
            setBeneficialOwnerSheetOpen(open)
            if (!open) setPendingBeneficialOwnerIndex(null)
          }}
          onPartyAdded={setCreatedBeneficialOwner}
          title="Add beneficial owner"
          description="Search for a household member or create a new individual to link as a beneficial owner."
          individualCreateOnly
        />

        {!isLocked && submitAttempted && allErrors.length > 0 && (
          <ValidationSummary errors={allErrors} position="bottom" />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6" ref={topRef}>
      {isLocked && (
        isApproved ? (
          <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/40 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-xs font-medium text-green-900 dark:text-green-100">
                This KYC package has been approved. Fields are read-only.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                This submission is under review. Fields are locked and cannot be edited.
              </p>
            </div>
          </div>
        )
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
            <SensitiveTaxIdInput
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
        <div>
          <h4 className={sectionCls}>ID Verification</h4>
          {idVerificationOptional && (
            <p className="mt-1 text-xs text-muted-foreground">
              Optional for this member — add ID details when available.
            </p>
          )}
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5" data-field="idType">
            <Label className={fieldCls}>ID type{idVerificationOptional ? ' (optional)' : <RequiredStar />}</Label>
            <Select value={str('idType') || undefined} onValueChange={(v) => { updateField('idType', v); markTouched('idType') }} disabled={isLocked}>
              <SelectTrigger className={inputErrorCls('idType')}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {ID_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {showError('idType') && <InlineError message={errorMap.get('idType')!} />}
          </div>
          <div className="space-y-1.5" data-field="idNumber">
            <Label className={fieldCls}>ID number{idVerificationOptional ? ' (optional)' : <RequiredStar />}</Label>
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
            <Label className={fieldCls}>Expiration date{idVerificationOptional ? ' (optional)' : <RequiredStar />}</Label>
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

    </div>
  )
}
