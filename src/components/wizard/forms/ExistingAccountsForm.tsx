import { useTaskData, useWorkflow } from '@/stores/workflowStore'
import { FinancialAccountsForm } from './FinancialAccountsForm'
import { getAllOpenAccountsTasks } from '@/utils/openAccountsTaskContext'

export function ExistingAccountsForm() {
  const { state, dispatch } = useWorkflow()
  const { data, updateField } = useTaskData('open-accounts')

  const setAdditionalOnAll = (v: string) => {
    updateField('additionalInstructions', v)
    for (const t of getAllOpenAccountsTasks(state)) {
      if (t.id === 'open-accounts') continue
      dispatch({ type: 'SET_TASK_DATA', taskId: t.id, fields: { additionalInstructions: v } })
    }
  }

  return (
    <div className="space-y-8">
      <section id="ea-existing-accounts" className="scroll-mt-16">
        <div className="mb-4">
          <h3 className="text-base font-semibold">
            Accounts
          </h3>
          <p className="text-base text-muted-foreground">
            Add or update the client&apos;s existing accounts to provide a complete financial picture.
          </p>
        </div>
        <FinancialAccountsForm />
      </section>

      <section id="ea-additional-instructions" className="scroll-mt-16">
        <div className="mb-4">
          <h3 className="text-base font-semibold">Additional Instructions</h3>
          <p className="text-base text-muted-foreground mt-2">
            Provide any special instructions related to opening or funding new accounts (e.g., transfers, rollovers, or funding sources).
          </p>
        </div>
        <textarea
          id="additionalInstructions"
          className="flex min-h-[18.67rem] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Account opening and funding notes for the new accounts (custodian, transfers, rollovers, timing, client requests)."
          value={(data.additionalInstructions as string) ?? ''}
          onChange={(e) => setAdditionalOnAll(e.target.value)}
        />
      </section>
    </div>
  )
}
