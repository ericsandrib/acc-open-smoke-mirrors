import type { Dispatch } from 'react'
import type { WorkflowAction } from '@/types/workflow'
import { ACCOUNT_EMBEDDED_FEATURE_VALUES, getAccountFeatureServiceLabel } from '@/data/accountFeatureServiceOptions'

export type FeatureServiceLineRowInput = { featureServiceType: string; quantity: number }

export function spawnFeatureServiceLineChildren(
  dispatch: Dispatch<WorkflowAction>,
  parentTaskId: string,
  accountChildId: string,
  rows: FeatureServiceLineRowInput[],
) {
  for (const row of rows) {
    if (!row.featureServiceType) continue
    if ((ACCOUNT_EMBEDDED_FEATURE_VALUES as readonly string[]).includes(row.featureServiceType)) continue
    const q = Math.min(10, Math.max(1, Math.floor(row.quantity) || 1))
    const base = getAccountFeatureServiceLabel(row.featureServiceType)
    for (let i = 1; i <= q; i++) {
      const name = q > 1 ? `${base} ${i}` : base
      dispatch({
        type: 'SPAWN_CHILD',
        parentTaskId,
        childName: name,
        childType: 'feature-service-line',
        metadata: {
          parentAccountChildId: accountChildId,
          featureServiceType: row.featureServiceType,
        },
      })
    }
  }
}
