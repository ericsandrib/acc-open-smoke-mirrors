import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServicing } from '@/stores/servicingStore'
import { useWorkflow } from '@/stores/workflowStore'
import { relationships } from '@/data/relationships'
import { seededJourneys } from '@/data/servicingSeed'
import type { Journey } from '@/types/servicing'
import type { FinancialAccount, RelatedParty } from '@/types/workflow'
import { getDefaultJourneyEntryTaskId } from '@/utils/journeyEntryTask'
import {
  isHoDemoServicingJourneyId,
  JOHN_SMITH_ONBOARDING_JOURNEY_ID,
  JOHN_SMITH_ONBOARDING_JOURNEY_NAME,
} from '@/data/defaultOnboardingJourney'

const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Household name on the seeded journey row must match a relationship `name` (normalized). */
function findExactRelationshipForSeededJourney(relationshipName: string) {
  const target = normalize(relationshipName.trim())
  if (!target) return undefined
  return relationships.find((r) => normalize(r.name) === target)
}

function buildSyntheticInitFromSeededJourney(row: Journey) {
  const label = (row.relationshipName ?? '').trim() || row.name
  const parts = label.split(/[\s,/]+/).filter(Boolean)
  const firstName = parts[0] ?? 'Client'
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'Household'
  const partyId = `seeded-primary-${row.id}`
  const party: RelatedParty = {
    id: partyId,
    name: label,
    firstName,
    lastName,
    type: 'household_member',
    role: 'Client',
    isPrimary: true,
    email: 'household@example.com',
    phone: '',
    dob: '',
    kycStatus: 'needs_kyc',
    clientId: `CLN-${row.id.replace(/[^a-zA-Z0-9]/g, '').slice(-10).toUpperCase() || 'SEED'}`,
  }
  return {
    relatedParties: [party],
    financialAccounts: [] as FinancialAccount[],
    clientInfo: {
      firstName,
      lastName,
      email: party.email ?? '',
      phone: '',
      dob: '',
      clientType: 'individual',
    },
  }
}

export function useJourneyNavigation() {
  const { currentLiveJourney, saveCurrentJourney } = useServicing()
  const { dispatch, state } = useWorkflow()
  const navigate = useNavigate()
  const seededJourneyIds = useMemo(() => new Set(seededJourneys.map((j) => j.id)), [])

  const navigateToServicing = (row: Journey, actionId?: string, childId?: string) => {
    let reinitializedFromTemplate = false
    const johnSmithRel = findExactRelationshipForSeededJourney(row.relationshipName)
    const targetRow =
      johnSmithRel?.id === 'john-smith-household' && isHoDemoServicingJourneyId(row.id)
        ? { ...row, id: JOHN_SMITH_ONBOARDING_JOURNEY_ID, name: JOHN_SMITH_ONBOARDING_JOURNEY_NAME }
        : row

    if (seededJourneyIds.has(targetRow.id)) {
      if (currentLiveJourney && !seededJourneyIds.has(currentLiveJourney.id)) {
        saveCurrentJourney(currentLiveJourney)
      }
      const exactRel = findExactRelationshipForSeededJourney(targetRow.relationshipName)
      const init = exactRel
        ? {
            relatedParties: exactRel.relatedParties,
            financialAccounts: exactRel.financialAccounts,
            clientInfo: {
              firstName: exactRel.primaryContact.firstName,
              lastName: exactRel.primaryContact.lastName,
              email: exactRel.primaryContact.email,
              phone: exactRel.primaryContact.phone,
              dob: exactRel.primaryContact.dob ?? '',
              clientType: exactRel.primaryContact.clientType ?? '',
            },
          }
        : buildSyntheticInitFromSeededJourney(targetRow)

      dispatch({
        type: 'INITIALIZE_FROM_RELATIONSHIP',
        relatedParties: init.relatedParties,
        financialAccounts: init.financialAccounts,
        clientInfo: init.clientInfo,
        journeyName: targetRow.name,
        journeyId: targetRow.id,
        assignedTo: targetRow.assignedTo,
        /** Split Open Accounts (non-annuity + annuity) so the wizard sidebar matches the full v6 demo. */
        journeyOnboardingConfig: {
          office: '',
          investmentProfessionalId: '',
          openMultipleAccounts: true,
          openAnnuityAccount: true,
        },
      })
      reinitializedFromTemplate = true
    }

    /**
     * Opening the journey root (no action/child drill-in): leave any child workflow still in
     * memory from before navigating away (e.g. live journey without template re-init, or seeded
     * journey when relationship template did not match). INITIALIZE_FROM_RELATIONSHIP already
     * clears child; GO_TO_TASK covers the other paths.
     */
    if (!actionId && !childId && !reinitializedFromTemplate && state.journeyId === targetRow.id) {
      const entry = getDefaultJourneyEntryTaskId(state)
      if (entry) dispatch({ type: 'GO_TO_TASK', taskId: entry })
    }

    let taskId: string | undefined
    let sectionId: string | undefined
    if (actionId) {
      const strippedActionId = actionId.replace(`${targetRow.id}-`, '')
      if (strippedActionId === 'kyc-child-actions') {
        taskId = 'open-accounts'
        sectionId = 'oa-kyc'
      } else if (strippedActionId === 'account-opening-child') {
        taskId = 'open-accounts'
        sectionId = 'oa-accounts'
      }
    }

    const params = new URLSearchParams()
    if (taskId) params.append('taskId', taskId)
    if (sectionId) params.append('sectionId', sectionId)
    if (childId) params.append('childId', childId)
    const path =
      params.size > 0 ? `/servicing/${targetRow.id}?${params}` : `/servicing/${targetRow.id}`
    navigate(path)
  }

  return { navigateToServicing, seededJourneyIds }
}
