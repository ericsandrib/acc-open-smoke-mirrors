import type { WorkflowState } from '@/types/workflow'
import { applyDemoAccountNumberOverrides } from '@/utils/demoAccountNumberOverrides'
import {
  consolidateAccountOpeningChildrenOnPrimaryTask,
  removeAccidentalDemoSeedAccountChildren,
  repairAccountOpeningAccountNumberLast4,
  repairAmlFlaggedAccountWorkflowPhase,
  repairDuplicateAccountOpeningChildrenOnAnnuityTask,
  repairIndexedAccountOpeningChildNames,
  repairMissingAccountOpeningChildren,
  repairPrematurePrincipalReviewPhase,
  repairSplitOpenAccountsJourneyTasks,
  repairV6SplitNavigationPage,
} from '@/utils/repairAccountOpeningChildNames'
import { repairParticipantAmlReuseAcrossAccounts } from '@/utils/participantVerification'

/** Bump when persisted workflow shape or repair logic changes. */
export const WORKFLOW_STORAGE_SCHEMA_VERSION = 13
export const WORKFLOW_STORAGE_SCHEMA_KEY = 'demo-workflow-state-schema-version'

/** Run all workflow localStorage repairs (names, AML escalation phase, etc.). */
/**
 * Repairs persisted workflow on load. Account numbers: only {@link repairAccountOpeningAccountNumberLast4}
 * rewrites last-four digits in existing taskData / labels — it does not replace user-created children.
 */
export function applyWorkflowStorageMigrations(state: WorkflowState): WorkflowState {
  const withoutDemoSeed = removeAccidentalDemoSeedAccountChildren(state)
  const withSplit = repairSplitOpenAccountsJourneyTasks(withoutDemoSeed)
  const withChildren = repairMissingAccountOpeningChildren(withSplit)
  const withConsolidated = consolidateAccountOpeningChildrenOnPrimaryTask(withChildren)
  const withDedupedAnnuity = repairDuplicateAccountOpeningChildrenOnAnnuityTask(withConsolidated)
  const withNames = repairIndexedAccountOpeningChildNames(withDedupedAnnuity)
  const withAmlPhase = repairAmlFlaggedAccountWorkflowPhase(withNames)
  const withParticipantAmlReuse = repairParticipantAmlReuseAcrossAccounts(withAmlPhase)
  const withPrincipalPhase = repairPrematurePrincipalReviewPhase(withParticipantAmlReuse)
  const withLast4 = repairAccountOpeningAccountNumberLast4(withPrincipalPhase)
  const withNav = repairV6SplitNavigationPage(withLast4)
  return applyDemoAccountNumberOverrides(withNav)
}

export function readWorkflowStorageSchemaVersion(): number {
  if (typeof window === 'undefined') return WORKFLOW_STORAGE_SCHEMA_VERSION
  const raw = window.localStorage.getItem(WORKFLOW_STORAGE_SCHEMA_KEY)
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
}
