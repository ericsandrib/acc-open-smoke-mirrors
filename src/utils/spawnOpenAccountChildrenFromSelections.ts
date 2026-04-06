import type { Dispatch } from 'react'
import type { WorkflowAction } from '@/types/workflow'
import type { Selection } from '@/components/wizard/forms/AccountTypePickerDialog'

/** Same rules as Open Accounts: per-type counts, optional paired annuity child. */
export function spawnOpenAccountChildrenFromSelections(
  dispatch: Dispatch<WorkflowAction>,
  parentTaskId: string,
  selections: Selection[],
) {
  for (const sel of selections) {
    const totalPlain = sel.count
    const totalWithAnnuity = sel.withAnnuityCount
    const totalForType = totalPlain + totalWithAnnuity
    for (let i = 1; i <= totalForType; i++) {
      const name = totalForType > 1 ? `${sel.label} Account ${i}` : `${sel.label} Account`
      dispatch({
        type: 'SPAWN_CHILD',
        parentTaskId,
        childName: name,
        childType: 'account-opening',
        metadata: {
          registrationType: sel.registrationType,
        },
      })

      if (i > totalPlain) {
        dispatch({
          type: 'SPAWN_CHILD',
          parentTaskId,
          childName: `${name} - Annuity 1`,
          childType: 'account-opening',
          metadata: {
            registrationType: sel.registrationType,
          },
        })
      }
    }
  }
}
