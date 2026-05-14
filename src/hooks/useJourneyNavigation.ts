import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServicing } from '@/stores/servicingStore'
import { useWorkflow } from '@/stores/workflowStore'
import { relationships } from '@/data/relationships'
import { seededJourneys } from '@/data/servicingSeed'
import type { Journey } from '@/types/servicing'
import { getDefaultJourneyEntryTaskId } from '@/utils/journeyEntryTask'

const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function findTemplateRelationship(relationshipName: string) {
  const target = normalize(relationshipName)
  if (!target) return undefined
  const exact = relationships.find((r) => normalize(r.name) === target)
  if (exact) return exact
  const includes = relationships.find((r) => {
    const candidate = normalize(r.name)
    return candidate.includes(target) || target.includes(candidate)
  })
  if (includes) return includes
  const tokens = new Set(target.split(' ').filter(Boolean))
  return relationships.find((r) =>
    normalize(r.name)
      .split(' ')
      .some((t) => tokens.has(t)),
  )
}

export function useJourneyNavigation() {
  const { currentLiveJourney, saveCurrentJourney } = useServicing()
  const { dispatch, state } = useWorkflow()
  const navigate = useNavigate()
  const seededJourneyIds = useMemo(() => new Set(seededJourneys.map((j) => j.id)), [])

  const navigateToServicing = (row: Journey, actionId?: string, childId?: string) => {
    let reinitializedFromTemplate = false
    if (seededJourneyIds.has(row.id)) {
      const relationship = findTemplateRelationship(row.relationshipName)
      if (relationship) {
        if (currentLiveJourney && !seededJourneyIds.has(currentLiveJourney.id)) {
          saveCurrentJourney(currentLiveJourney)
        }
        dispatch({
          type: 'INITIALIZE_FROM_RELATIONSHIP',
          relatedParties: relationship.relatedParties,
          financialAccounts: relationship.financialAccounts,
          clientInfo: {
            firstName: relationship.primaryContact.firstName,
            lastName: relationship.primaryContact.lastName,
            email: relationship.primaryContact.email,
            phone: relationship.primaryContact.phone,
            dob: relationship.primaryContact.dob ?? '',
            clientType: relationship.primaryContact.clientType ?? '',
          },
          journeyName: row.name,
          journeyId: row.id,
          assignedTo: row.assignedTo,
          journeyOnboardingConfig: {
            office: '',
            investmentProfessionalId: '',
            openMultipleAccounts: false,
            openAnnuityAccount: false,
          },
        })
        reinitializedFromTemplate = true
      }
    }

    /**
     * Opening the journey root (no action/child drill-in): leave any child workflow still in
     * memory from before navigating away (e.g. live journey without template re-init, or seeded
     * journey when relationship template did not match). INITIALIZE_FROM_RELATIONSHIP already
     * clears child; GO_TO_TASK covers the other paths.
     */
    if (!actionId && !childId && !reinitializedFromTemplate && state.journeyId === row.id) {
      const entry = getDefaultJourneyEntryTaskId(state)
      if (entry) dispatch({ type: 'GO_TO_TASK', taskId: entry })
    }

    let taskId: string | undefined
    let sectionId: string | undefined
    if (actionId) {
      const strippedActionId = actionId.replace(`${row.id}-`, '')
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
    const path = params.size > 0 ? `/servicing/${row.id}?${params}` : `/servicing/${row.id}`
    navigate(path)
  }

  return { navigateToServicing, seededJourneyIds }
}
