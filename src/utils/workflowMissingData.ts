import type { WorkflowState } from '@/types/workflow'
import { computeSmartDocuments } from '@/utils/smartDocuments'
import { getAccountOwnersMissingKyc } from '@/utils/accountOpeningOwnerKyc'
import { getAllOpenAccountsTasks, OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY } from '@/utils/openAccountsTaskContext'

export type MissingDataEntry = {
  taskId: string
  taskTitle: string
  actionTitle: string
  issues: string[]
}

function actionTitle(state: WorkflowState, taskId: string): string {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) return ''
  return state.actions.find((a) => a.id === task.actionId)?.title ?? ''
}

function uniqueStrings(items: string[]): string[] {
  return [...new Set(items)]
}

/**
 * Heuristic gaps across wizard tasks so advisors can see what still needs attention.
 * Rules are aligned with demo forms, not a full production validation engine.
 */
export function computeWorkflowMissingData(state: WorkflowState): MissingDataEntry[] {
  const entries: MissingDataEntry[] = []

  const relatedTask = state.tasks.find((t) => t.formKey === 'related-parties')
  if (relatedTask) {
    const issues: string[] = []
    for (const m of state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden)) {
      if (!m.email?.trim()) issues.push(`${m.name}: add an email address`)
      if (!m.phone?.trim()) issues.push(`${m.name}: add a phone number`)
    }
    if (issues.length) {
      entries.push({
        taskId: relatedTask.id,
        taskTitle: relatedTask.title,
        actionTitle: actionTitle(state, relatedTask.id),
        issues: uniqueStrings(issues),
      })
    }
  }

  const existingTask = state.tasks.find((t) => t.formKey === 'existing-accounts')
  if (existingTask && state.financialAccounts.length === 0) {
    entries.push({
      taskId: existingTask.id,
      taskTitle: existingTask.title,
      actionTitle: actionTitle(state, existingTask.id),
      issues: ['Add held-away accounts, or confirm none need to be reported for this household.'],
    })
  }

  const kycTask = state.tasks.find((t) => t.formKey === 'kyc')
  if (kycTask) {
    const children = kycTask.children ?? []
    const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden)
    const spawnedNames = new Set(children.map((c) => c.name))
    const needsKycMembers = householdMembers.filter(
      (m) => m.kycStatus !== 'verified' && !spawnedNames.has(m.name),
    )
    const issues: string[] = []
    if (needsKycMembers.length > 0) {
      issues.push(`Start KYC initiation for: ${needsKycMembers.map((m) => m.name).join(', ')}`)
    }
    for (const c of children) {
      if (c.status === 'complete') continue
      const short = c.name
      const infoId = `${c.id}-info`
      const info = state.taskData[infoId] ?? {}
      const first = (info.firstName as string | undefined)?.trim()
      const last = (info.lastName as string | undefined)?.trim()
      const dob = (info.dob as string | undefined)?.trim()
      const email = (info.email as string | undefined)?.trim()
      if (!first || !last || !dob || !email) {
        issues.push(`${short}: complete identity fields (name, date of birth, email)`)
      }
    }
    if (issues.length) {
      entries.push({
        taskId: kycTask.id,
        taskTitle: kycTask.title,
        actionTitle: actionTitle(state, kycTask.id),
        issues: uniqueStrings(issues),
      })
    }
  }

  for (const openTask of getAllOpenAccountsTasks(state)) {
    const issues: string[] = []
    const accountChildren = (openTask.children ?? []).filter((c) => c.childType === 'account-opening')
    if (accountChildren.length === 0) {
      issues.push('Select at least one account registration to open.')
    }
    for (const c of accountChildren) {
      if (c.status === 'complete') continue
      const meta = state.taskData[c.id] as Record<string, unknown> | undefined
      if (!meta?.registrationType) {
        issues.push(`${c.name}: set registration type`)
      }
      const ownersData = state.taskData[`${c.id}-account-owners`] as Record<string, unknown> | undefined
      const owners = (ownersData?.owners as { partyId?: string; type: string }[] | undefined) ?? []
      if (owners.length === 0) {
        issues.push(`${c.name}: add at least one account owner`)
      } else if (owners.some((o) => o.type === 'existing' && !o.partyId)) {
        issues.push(`${c.name}: finish assigning each owner slot`)
      } else if (openTask.formKey !== OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY) {
        const kycGap = getAccountOwnersMissingKyc(state, c.id)
        if (kycGap.names.length > 0) {
          issues.push(
            `${c.name}: KYC not verified for — ${kycGap.names.join(', ')}`,
          )
        }
      }
      const sd = computeSmartDocuments(state, c.id)
      if (sd.counts.missing > 0) {
        issues.push(
          `${c.name}: ${sd.counts.missing} required document package(s) still open (see Documents while editing this account)`,
        )
      }
    }
    if (issues.length) {
      entries.push({
        taskId: openTask.id,
        taskTitle: openTask.title,
        actionTitle: actionTitle(state, openTask.id),
        issues: uniqueStrings(issues),
      })
    }
  }

  return entries
}
