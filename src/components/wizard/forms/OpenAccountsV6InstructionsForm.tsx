import { useMemo } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { OpenAccountsTaskOverrideProvider } from '@/components/wizard/openAccountsVariantContext'
import {
  OPEN_ACCOUNTS_FORM_KEY,
  OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY,
} from '@/utils/openAccountsTaskContext'
import { OpenAccountsForm } from './OpenAccountsForm'

/**
 * V6 combines both original "Account Instructions" tasks into one stacked surface.
 * The first block renders the annuity task; the second renders the no-annuity task.
 */
export function OpenAccountsV6InstructionsForm() {
  const { state } = useWorkflow()

  const withAnnuityTask = useMemo(
    () => state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_WITH_ANNUITY_FORM_KEY),
    [state.tasks],
  )
  const noAnnuityTask = useMemo(
    () => state.tasks.find((t) => t.formKey === OPEN_ACCOUNTS_FORM_KEY),
    [state.tasks],
  )

  return (
    <div className="space-y-6">
      {noAnnuityTask ? (
        <OpenAccountsTaskOverrideProvider taskId={noAnnuityTask.id} idPrefix="v6-noann-">
          <OpenAccountsForm />
        </OpenAccountsTaskOverrideProvider>
      ) : null}
      {withAnnuityTask ? (
        <OpenAccountsTaskOverrideProvider taskId={withAnnuityTask.id} idPrefix="v6-wann-">
          <OpenAccountsForm />
        </OpenAccountsTaskOverrideProvider>
      ) : null}
    </div>
  )
}
