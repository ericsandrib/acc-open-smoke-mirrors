import type { Task, WorkflowState } from '@/types/workflow'
import { isOpenAccountsFormKey } from '@/utils/openAccountsTaskContext'

export function getTaskFieldProgress(state: WorkflowState, task: Task): { filled: number; total: number } {
  switch (task.formKey) {
    case 'related-parties': {
      const members = state.relatedParties.filter(
        (p) => p.type === 'household_member' && !p.isHidden,
      )
      const total = members.length * 2
      let filled = 0
      for (const m of members) {
        if (m.email?.trim()) filled++
        if (m.phone?.trim()) filled++
      }
      return { filled, total }
    }
    case 'existing-accounts':
      return {
        filled: state.financialAccounts.length > 0 ? 1 : 0,
        total: 1,
      }
    case 'kyc': {
      const members = state.relatedParties.filter(
        (p) => p.type === 'household_member' && !p.isHidden,
      )
      const needsKyc = members.filter((m) => m.kycStatus !== 'verified')
      const children = task.children ?? []
      const total = Math.max(needsKyc.length, 1)
      const filled = Math.min(
        children.filter((c) => c.status === 'complete').length,
        total,
      )
      return { filled, total }
    }
    case 'open-accounts': {
      const accountChildren = (task.children ?? []).filter((c) => c.childType === 'account-opening')
      const kycTask = state.tasks.find((t) => t.formKey === 'kyc')
      const kycChildren = (kycTask?.children ?? []).filter((c) => c.childType === 'kyc')
      const taskData = (state.taskData[task.id] as Record<string, unknown> | undefined) ?? {}
      const envelopes = Array.isArray(taskData.esignEnvelopes) ? taskData.esignEnvelopes : []

      let filled = 0
      if (accountChildren.length > 0) filled++
      if (kycChildren.length > 0) filled++
      if (envelopes.length > 0) filled++

      return { filled, total: 3 }
    }
    case 'open-accounts-with-annuity': {
      const accountChildren = (task.children ?? []).filter((c) => c.childType === 'account-opening')
      return {
        filled: accountChildren.length > 0 ? 1 : 0,
        total: 1,
      }
    }
    default:
      if (isOpenAccountsFormKey(task.formKey)) return { filled: 0, total: 1 }
      return { filled: 0, total: 0 }
  }
}
