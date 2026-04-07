import type { Dispatch } from 'react'
import type { WorkflowAction } from '@/types/workflow'
import type { Selection } from '@/components/wizard/forms/AccountTypePickerDialog'

export function spawnOpenAccountChildrenFromSelections(
  dispatch: Dispatch<WorkflowAction>,
  parentTaskId: string,
  selections: Selection[],
) {
  for (const sel of selections) {
    const totalPlain = sel.count
    const totalAnnuity = sel.withAnnuityCount
    const totalForType = totalPlain + totalAnnuity

    let idx = 0
    for (let i = 0; i < totalPlain; i++) {
      idx++
      const name = totalForType > 1 ? `${sel.label} Account ${idx}` : `${sel.label} Account`
      dispatch({
        type: 'SPAWN_CHILD',
        parentTaskId,
        childName: name,
        childType: 'account-opening',
        metadata: { registrationType: sel.registrationType },
      })
    }

    for (let i = 0; i < totalAnnuity; i++) {
      idx++
      const base = totalForType > 1 ? `${sel.label} Account ${idx}` : `${sel.label} Account`
      dispatch({
        type: 'SPAWN_CHILD',
        parentTaskId,
        childName: `${base} - Annuity`,
        childType: 'account-opening',
        metadata: { registrationType: sel.registrationType },
      })
    }
  }
}
