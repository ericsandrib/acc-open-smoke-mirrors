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
    // shortLabel is custodian-aware (Schwab/Fidelity application or SEI registration).
    const baseName = sel.shortLabel || sel.label

    for (let i = 0; i < totalForType; i++) {
      const idx = i + 1
      const name = totalForType > 1 ? `${baseName} ${idx}` : baseName
      dispatch({
        type: 'SPAWN_CHILD',
        parentTaskId,
        childName: name,
        childType: 'account-opening',
        metadata: {
          applicationType: sel.applicationType,
          officeCode: sel.officeCode,
          investmentProfessionalId: sel.investmentProfessionalId,
          custodian: sel.custodian,
          accountCategory: sel.category,
        },
      })
    }
  }
}
