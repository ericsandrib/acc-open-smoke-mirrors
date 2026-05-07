import { useMemo } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { OpenAccountsTaskOverrideProvider } from '@/components/wizard/openAccountsVariantContext'
import { OPEN_ACCOUNTS_FORM_KEY } from '@/utils/openAccountsTaskContext'
import { OpenAccountsForm } from './OpenAccountsForm'

/**
 * V6 “Account Setup” page: no-annuity open-accounts surface only.
 * The annuity Yes/No control and with-annuity setup live under the “Annuity Accounts Setup” task.
 */
export function OpenAccountsV6InstructionsForm() {
  const { state } = useWorkflow()

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
    </div>
  )
}
