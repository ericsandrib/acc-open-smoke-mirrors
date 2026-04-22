import type { Dispatch } from 'react'
import type { WorkflowAction } from '@/types/workflow'
import type { Selection } from '@/components/wizard/forms/AccountTypePickerDialog'

export function spawnOpenAccountChildrenFromSelections(
  dispatch: Dispatch<WorkflowAction>,
  parentTaskId: string,
  selections: Selection[],
) {
  for (const sel of selections) {
    const totalForType = sel.count

    for (let i = 0; i < totalForType; i++) {
      const idx = i + 1
      const name = totalForType > 1 ? `${sel.label} Account ${idx}` : `${sel.label} Account`
      dispatch({
        type: 'SPAWN_CHILD',
        parentTaskId,
        childName: name,
        childType: 'account-opening',
        metadata: {
          registrationType: sel.registrationType,
          officeCode: sel.officeCode,
          investmentProfessionalId: sel.investmentProfessionalId,
        },
      })
    }
  }
}
