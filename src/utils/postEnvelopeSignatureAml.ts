import type { WorkflowState } from '@/types/workflow'
import { getAllOpenAccountsTasks } from '@/utils/openAccountsTaskContext'

/**
 * KYC child workflows whose subject (`kycSubjectPartyId`) is an account owner on any of the given
 * account-opening children (from `…-account-owners` taskData), plus optional envelope signer party ids.
 */
export function getKycChildIdsForSignedAccountChildren(
  state: WorkflowState,
  accountChildIds: ReadonlySet<string>,
  supplementalOwnerPartyIds?: readonly string[],
): string[] {
  if (accountChildIds.size === 0) return []

  const partyIds = new Set<string>()
  for (const acctId of accountChildIds) {
    const ownersTaskId = `${acctId}-account-owners`
    const owners = ((state.taskData[ownersTaskId] as Record<string, unknown> | undefined)?.owners ??
      []) as Array<{ partyId?: string }>
    for (const o of owners) {
      if (typeof o.partyId === 'string' && o.partyId.length > 0) partyIds.add(o.partyId)
    }
  }
  if (supplementalOwnerPartyIds) {
    for (const p of supplementalOwnerPartyIds) {
      if (typeof p === 'string' && p.length > 0) partyIds.add(p)
    }
  }
  if (partyIds.size === 0) return []

  const kycChildren = getAllOpenAccountsTasks(state).flatMap(
    (t) => t.children?.filter((c) => c.childType === 'kyc') ?? [],
  )

  const partyById = new Map(state.relatedParties.map((p) => [p.id, p]))
  const impacted: string[] = []
  for (const k of kycChildren) {
    const meta = state.taskData[k.id] as Record<string, unknown> | undefined
    const subjectPartyId = meta?.kycSubjectPartyId as string | undefined
    if (subjectPartyId && partyIds.has(subjectPartyId)) {
      impacted.push(k.id)
      continue
    }
    /** Spawned rows sometimes align by display name before `kycSubjectPartyId` is present everywhere. */
    for (const pid of partyIds) {
      const party = partyById.get(pid)
      if (party && k.name.trim() === party.name.trim()) {
        impacted.push(k.id)
        break
      }
    }
  }
  return [...new Set(impacted)]
}
