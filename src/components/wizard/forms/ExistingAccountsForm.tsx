import { Wallet } from 'lucide-react'
import { FinancialAccountsForm } from './FinancialAccountsForm'

export function ExistingAccountsForm() {
  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Existing Accounts
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          These are the financial accounts currently held by the client, including brokerage, retirement, and trust accounts.
        </p>
        <FinancialAccountsForm />
      </section>
    </div>
  )
}
