import type { Dispatch } from 'react'
import type { WorkflowAction } from '@/types/workflow'
import type { Selection } from '@/components/wizard/forms/AccountTypePickerDialog'
import { SCHWAB_APPLICATION_OPTIONS } from '@/utils/custodians'

export function spawnOpenAccountChildrenFromSelections(
  dispatch: Dispatch<WorkflowAction>,
  parentTaskId: string,
  selections: Selection[],
) {
  for (const sel of selections) {
    const totalForType = sel.count
    const opt = SCHWAB_APPLICATION_OPTIONS.find((o) => o.id === sel.applicationType)
    const baseName = opt?.shortLabel ?? sel.label

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
