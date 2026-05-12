import { useEffect, useMemo, useRef } from 'react'
import { useTaskData, useWorkflow } from '@/stores/workflowStore'
import { buildSchwabPrefill, deriveIdentityFromUploadedDocs, type SchwabPrefill } from './schwabPrePopulation'
import { getRelevantOpenAccountsTask } from '@/utils/openAccountsTaskContext'

const SCHWAB_FORM_STATE_KEY = 'schwabForm'

/** Bag of fields stored on a single Schwab form. */
export type SchwabFormBag = Record<string, unknown>

interface SchwabFormStateApi {
  data: SchwabFormBag
  /** Get a string-valued field (returns '' if absent). */
  get(field: string): string
  /** Get a string[] field for checkbox groups. */
  getMulti(field: string): string[]
  /** Get a boolean field. */
  getBool(field: string): boolean
  /** Set one field. */
  set(field: string, value: unknown): void
  prefill: SchwabPrefill
  /** Party IDs the operator has selected as account owners (for this child). */
  selectedOwnerPartyIds: string[]
  /** Display names of the selected owners, indexed to slot order. */
  selectedOwnerDisplayNames: string[]
  /** Filename of the supporting document that seeded the Primary Holder's ID fields, if any. */
  idSourceFileName: string | null
}

type OwnerSlot = { id: string; type?: string; partyId?: string }

/**
 * AccountHolderSection looks up fields via `${prefix}${CapitalKey}`. With empty
 * prefix (Primary Holder) keys are `FirstName`, `LastName`, etc. With prefix
 * `additional` (Additional Holder), keys are `additionalFirstName`, etc. This
 * helper writes a SchwabPrefill (which uses lowercase property names) into the
 * bag under whichever key shape the section expects, keyed by `prefix`.
 */
function writePersonFieldsToBag(
  bag: SchwabFormBag,
  prefix: '' | 'additional',
  p: SchwabPrefill | undefined,
  fallbackHomeCountry = '',
): void {
  // For empty prefix the bag key is the capitalised field name directly.
  // For "additional" prefix the bag key is `additional` + capitalised field.
  const key = (capName: string) => (prefix === '' ? capName : `additional${capName}`)
  bag[key('FirstName')] = p?.firstName ?? ''
  bag[key('MiddleName')] = p?.middleName ?? ''
  bag[key('LastName')] = p?.lastName ?? ''
  bag[key('Suffix')] = p?.suffix ?? ''
  bag[key('Ssn')] = p?.ssn ?? ''
  bag[key('Dob')] = p?.dob ?? ''
  bag[key('PreferredName')] = p?.preferredName ?? ''
  bag[key('HomeStreet')] = p?.homeStreet ?? ''
  bag[key('HomeCity')] = p?.homeCity ?? ''
  bag[key('HomeState')] = p?.homeState ?? ''
  bag[key('HomeZip')] = p?.homeZip ?? ''
  bag[key('HomeCountry')] = p?.homeCountry ?? fallbackHomeCountry
  bag[key('MailingStreet')] = p?.mailingStreet ?? ''
  bag[key('MailingCity')] = p?.mailingCity ?? ''
  bag[key('MailingState')] = p?.mailingState ?? ''
  bag[key('MailingZip')] = p?.mailingZip ?? ''
  bag[key('MailingCountry')] = p?.mailingCountry ?? ''
  bag[key('Phone')] = p?.phone ?? ''
  bag[key('Mobile')] = ''
  bag[key('WorkNumber')] = ''
  bag[key('WorkExtension')] = ''
  bag[key('Email')] = p?.email ?? ''
  bag[key('MothersMaidenName')] = ''
  bag[key('CitizenshipUsa')] = true
  bag[key('CitizenshipOther')] = ''
  bag[key('LegalResidenceCountry')] = 'USA'
  bag[key('LegalResidenceOther')] = ''
  bag[key('IdType')] = p?.idType ?? ''
  bag[key('IdNumber')] = p?.idNumber ?? ''
  bag[key('IdCountry')] = p?.idCountry ?? 'United States'
  bag[key('IdState')] = p?.idState ?? ''
  bag[key('IdIssueDate')] = p?.idIssueDate ?? ''
  bag[key('IdExpirationDate')] = p?.idExpirationDate ?? ''
  bag[key('EmploymentStatus')] = p?.employmentStatus ?? ''
  bag[key('Occupation')] = p?.occupation ?? ''
  bag[key('OccupationOther')] = ''
  bag[key('EmployerName')] = p?.employerName ?? ''
  bag[key('BusinessStreet')] = ''
  bag[key('BusinessCity')] = ''
  bag[key('BusinessState')] = ''
  bag[key('BusinessZip')] = ''
  bag[key('BusinessCountry')] = ''
  bag[key('FinraAffiliation')] = p?.finraAffiliation ?? 'No'
  bag[key('FinraCompanyName')] = ''
  bag[key('ControlPerson')] = p?.controlPerson ?? 'No'
  bag[key('ControlPersonCompanyName')] = ''
  bag[key('ControlPersonSymbol')] = ''
}

/**
 * Re-syncs only the prefill-eligible Person Holder fields without clobbering
 * operator-edited values for unrelated keys. Used by the owner-change effect.
 */
function rewritePersonFieldsOnBag(
  existing: SchwabFormBag,
  prefix: '' | 'additional',
  p: SchwabPrefill | undefined,
  preserveIdFromDoc: boolean,
): SchwabFormBag {
  const next: SchwabFormBag = { ...existing }
  const fallbackHomeCountry = prefix === '' ? 'United States' : ''
  writePersonFieldsToBag(next, prefix, p, fallbackHomeCountry)
  if (preserveIdFromDoc && prefix === '') {
    // The Primary Holder's ID fields may have been seeded from an uploaded
    // document earlier. When an owner change wipes p.idType etc., keep the
    // doc-derived values rather than blanking them.
    if (!p?.idType && existing.IdType) next.IdType = existing.IdType
    if (!p?.idNumber && existing.IdNumber) next.IdNumber = existing.IdNumber
    if (!p?.idState && existing.IdState) next.IdState = existing.IdState
    if (!p?.idIssueDate && existing.IdIssueDate) next.IdIssueDate = existing.IdIssueDate
    if (!p?.idExpirationDate && existing.IdExpirationDate)
      next.IdExpirationDate = existing.IdExpirationDate
  }
  return next
}

/**
 * Schwab-form state lives under `taskData[childId].schwabForm`. Initial values
 * seed from upstream workflow state on first mount; subsequent owner-picker
 * changes overwrite the Primary Holder and Additional Holder field groups so
 * the paperwork stays in sync with the selected account owners.
 */
export function useSchwabFormState(childId: string): SchwabFormStateApi {
  const { state } = useWorkflow()
  const { data: rawData, updateFields } = useTaskData(childId)
  const seeded = useRef(false)
  const lastOwnerSignature = useRef<string>('')

  const selectedOwnerPartyIds = useMemo(() => {
    const ownerBag = state.taskData[`${childId}-account-owners`] as Record<string, unknown> | undefined
    const owners = (ownerBag?.owners as OwnerSlot[] | undefined) ?? []
    return owners.map((o) => o.partyId).filter((id): id is string => Boolean(id))
  }, [state.taskData, childId])

  const documentIdentity = useMemo(() => {
    const openAccountsTask = getRelevantOpenAccountsTask(state)
    const openAccountsTaskData = openAccountsTask
      ? (state.taskData[openAccountsTask.id] as Record<string, unknown> | undefined)
      : undefined
    return deriveIdentityFromUploadedDocs(openAccountsTaskData)
  }, [state])

  const prefill = useMemo(
    () =>
      buildSchwabPrefill({
        relatedParties: state.relatedParties,
        selectedOwnerPartyIds,
        investmentProfessionalId: rawData.investmentProfessionalId as string | undefined,
        clientInfo: state.taskData['client-info'] as Record<string, unknown> | undefined,
        documentIdentity,
      }),
    [state, rawData.investmentProfessionalId, selectedOwnerPartyIds, documentIdentity],
  )

  const selectedOwnerDisplayNames = useMemo(
    () =>
      selectedOwnerPartyIds.map((id) => {
        const party = state.relatedParties.find((p) => p.id === id)
        return party?.name?.trim() || party?.firstName || 'Owner'
      }),
    [selectedOwnerPartyIds, state.relatedParties],
  )

  const formBag = (rawData[SCHWAB_FORM_STATE_KEY] as SchwabFormBag | undefined) ?? {}

  // Initial seed — runs once per child.
  useEffect(() => {
    if (seeded.current) return
    if (rawData[SCHWAB_FORM_STATE_KEY]) {
      seeded.current = true
      lastOwnerSignature.current = selectedOwnerPartyIds.join('|')
      return
    }
    const seed: SchwabFormBag = {
      // Trusted contact
      trustedContact1FirstName: prefill.trustedContact?.firstName ?? '',
      trustedContact1LastName: prefill.trustedContact?.lastName ?? '',
      trustedContact1Relationship: prefill.trustedContact?.relationship ?? '',
      trustedContact1Phone: prefill.trustedContact?.phone ?? '',
      trustedContact1Email: prefill.trustedContact?.email ?? '',
      // Advisor / IA
      advisorFirmName: prefill.advisor?.firmName ?? '',
      advisorMasterAccountNumber: prefill.advisor?.masterAccountNumber ?? '',
      advisorServiceTeam: prefill.advisor?.serviceTeam ?? '',
      advisorContactName: prefill.advisor?.contactName ?? '',
      advisorTelephoneNumber: prefill.advisor?.contactPhone ?? '',
      advisorEmailAddress: prefill.advisor?.contactEmail ?? '',
      // Defaults
      sourceOfFunds: [] as string[],
      sourceOfFundsOther: '',
      purposeOfAccount: [] as string[],
      purposeOfAccountOther: '',
    }
    writePersonFieldsToBag(seed, '', prefill, 'United States')
    writePersonFieldsToBag(seed, 'additional', prefill.additional, '')
    updateFields({ [SCHWAB_FORM_STATE_KEY]: seed })
    seeded.current = true
    lastOwnerSignature.current = selectedOwnerPartyIds.join('|')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Owner-driven resync — overwrite Primary + Additional Holder field groups
  // when the selected owners change after initial seed.
  useEffect(() => {
    if (!seeded.current) return
    const sig = selectedOwnerPartyIds.join('|')
    if (sig === lastOwnerSignature.current) return
    lastOwnerSignature.current = sig
    let next = rewritePersonFieldsOnBag(formBag, '', prefill, true)
    next = rewritePersonFieldsOnBag(next, 'additional', prefill.additional, false)
    updateFields({ [SCHWAB_FORM_STATE_KEY]: next })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOwnerPartyIds.join('|')])

  return {
    data: formBag,
    prefill,
    selectedOwnerPartyIds,
    selectedOwnerDisplayNames,
    idSourceFileName: documentIdentity?.sourceFileName ?? null,
    get(field) {
      const v = formBag[field]
      return typeof v === 'string' ? v : v == null ? '' : String(v)
    },
    getMulti(field) {
      const v = formBag[field]
      return Array.isArray(v) ? (v as string[]) : []
    },
    getBool(field) {
      const v = formBag[field]
      return v === true
    },
    set(field, value) {
      const next = { ...formBag, [field]: value }
      updateFields({ [SCHWAB_FORM_STATE_KEY]: next })
    },
  }
}
