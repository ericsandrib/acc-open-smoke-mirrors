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
      const name = `${sel.label} Account`
      dispatch({
        type: 'SPAWN_CHILD',
        parentTaskId,
        childName: name,
        childType: 'account-opening',
        metadata: {
          custodian: sel.custodian,
          registrationType: sel.registrationType,
          // SEI account-creation (MRDC) fields — derived from reference data + the selection.
          ...(sel.seiAccountType ? { seiAccountType: sel.seiAccountType } : {}),
          ...(sel.accountTypeId != null ? { accountTypeId: sel.accountTypeId } : {}),
          ...(sel.investmentProgramId ? { investmentProgramId: sel.investmentProgramId } : {}),
          swpFirmId: sel.swpFirmId,
          primaryAdvisorId: sel.primaryAdvisorId,
        },
      })
    }
  }
}
