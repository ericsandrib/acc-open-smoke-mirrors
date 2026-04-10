import { useTaskData } from '@/stores/workflowStore'
import { FinancialAccountsForm } from './FinancialAccountsForm'

export function ExistingAccountsForm() {
  const { data, updateField } = useTaskData('open-accounts')

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold">
            Existing Accounts
          </h3>
          <p className="text-base text-muted-foreground">
            These are the financial accounts currently held by the client, including brokerage, retirement, and trust accounts.
          </p>
        </div>
        <FinancialAccountsForm />
      </section>

      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold">Additional Instructions</h3>
          <p className="text-base text-muted-foreground mt-2">
            Account opening and funding instructions for the new accounts to be opened.
          </p>
        </div>
        <textarea
          id="additionalInstructions"
          className="flex min-h-[18.67rem] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Account opening and funding notes for the new accounts (custodian, transfers, rollovers, timing, client requests)."
          value={(data.additionalInstructions as string) ?? ''}
          onChange={(e) => updateField('additionalInstructions', e.target.value)}
        />
      </section>
    </div>
  )
}
