import { FinancialAccountsForm } from './FinancialAccountsForm'

export function ExistingAccountsForm() {
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
    </div>
  )
}
