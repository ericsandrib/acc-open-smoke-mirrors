import type { EsignEnvelope } from '@/types/esignEnvelope'
import type { ChildReviewState, WorkflowState } from '@/types/workflow'
import { deriveChildDisplayStatus, type ChildDisplayStatus } from '@/utils/childStatusDisplay'
import { getEsignEnvelopeStatus } from '@/utils/esignEnvelopeStatus'
import {
  OPEN_ACCOUNTS_FORM_KEY,
  OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
} from '@/utils/openAccountsTaskContext'

function envelopesForAccountChild(
  state: WorkflowState,
  accountChildId: string,
): EsignEnvelope[] {
  const out: EsignEnvelope[] = []
  for (const task of state.tasks) {
    if (
      task.formKey !== OPEN_ACCOUNTS_FORM_KEY &&
      task.formKey !== OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY
    ) {
      continue
    }
    if (!(task.children ?? []).some((c) => c.id === accountChildId)) continue
    const data = state.taskData[task.id] as Record<string, unknown> | undefined
    const envelopes = data?.esignEnvelopes
    if (Array.isArray(envelopes)) out.push(...(envelopes as EsignEnvelope[]))
  }
  return out
}

/** Account is on a sent eSign package that has not been fully signed yet. */
export function isAccountChildAwaitingClientSignature(
  state: WorkflowState,
  accountChildId: string,
): boolean {
  const child = state.tasks
    .flatMap((t) => t.children ?? [])
    .find((c) => c.id === accountChildId)
  if (!child || child.childType !== 'account-opening') return false
  if (child.status !== 'not_started' && child.status !== 'in_progress') return false

  return envelopesForAccountChild(state, accountChildId).some((env) => {
    const status = getEsignEnvelopeStatus(env)
    if (status === 'completed' || status === 'canceled' || status === 'voided' || status === 'declined') {
      return false
    }
    if (status !== 'sent' && !env.sentToClient) return false
    return env.formSelections?.some((row) => row.included && row.accountChildId === accountChildId)
  })
}

export function deriveAccountOpeningChildDisplayStatus(
  state: WorkflowState,
  accountChildId: string,
  rawStatus: string,
  reviewState?: ChildReviewState,
): ChildDisplayStatus {
  if (isAccountChildAwaitingClientSignature(state, accountChildId)) {
    return 'awaiting_client_signature'
  }
  return deriveChildDisplayStatus(rawStatus, reviewState)
}
