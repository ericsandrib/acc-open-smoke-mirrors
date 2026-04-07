import { Label } from '@/components/ui/label'
import { useTaskData } from '@/stores/workflowStore'
import { FinancialAccountsForm } from './FinancialAccountsForm'

export function ExistingAccountsForm() {
  const { data, updateField } = useTaskData('open-accounts')

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-2">
          <h3 className="text-sm font-semibold">
            Existing Accounts
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          These are the financial accounts currently held by the client, including brokerage, retirement, and trust accounts.
        </p>
        <FinancialAccountsForm />
      </section>

      <section>
        <div className="mb-3">
          <Label htmlFor="additionalInstructions" className="text-sm font-semibold">
            Additional Instructions
          </Label>
        </div>
        <textarea
          id="additionalInstructions"
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter any special instructions for account opening..."
          value={(data.additionalInstructions as string) ?? ''}
          onChange={(e) => updateField('additionalInstructions', e.target.value)}
        />
      </section>
    </div>
  )
}
