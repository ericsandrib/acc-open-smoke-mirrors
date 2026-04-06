import type { Dispatch } from 'react'
import type { WorkflowAction } from '@/types/workflow'
import { getFundingOptionLabel } from '@/data/fundingOptions'

export type FundingLineRowInput = { fundingMethod: string; quantity: number }

export function spawnFundingLineChildren(
  dispatch: Dispatch<WorkflowAction>,
  parentTaskId: string,
  accountChildId: string,
  rows: FundingLineRowInput[],
) {
  for (const row of rows) {
    if (!row.fundingMethod) continue
    const q = Math.min(10, Math.max(1, Math.floor(row.quantity) || 1))
    const base = getFundingOptionLabel(row.fundingMethod)
    for (let i = 1; i <= q; i++) {
      const name = q > 1 ? `${base} ${i}` : base
      dispatch({
        type: 'SPAWN_CHILD',
        parentTaskId,
        childName: name,
        childType: 'funding-line',
        metadata: {
          parentAccountChildId: accountChildId,
          fundingMethod: row.fundingMethod,
        },
      })
    }
  }
}
