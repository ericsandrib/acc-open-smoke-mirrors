import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export function FinancialAccountsForm() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="accountType">Account Type</Label>
        <Select id="accountType">
          <option value="">Select account type...</option>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
          <option value="investment">Investment</option>
          <option value="retirement">Retirement (IRA)</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fundingSource">Funding Source</Label>
        <Select id="fundingSource">
          <option value="">Select funding source...</option>
          <option value="employment">Employment Income</option>
          <option value="investment">Investment Returns</option>
          <option value="inheritance">Inheritance</option>
          <option value="business">Business Income</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="initialDeposit">Estimated Initial Deposit</Label>
        <Input id="initialDeposit" type="number" placeholder="50,000" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select id="currency">
          <option value="usd">USD</option>
          <option value="eur">EUR</option>
          <option value="gbp">GBP</option>
          <option value="chf">CHF</option>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="statements" />
        <Label htmlFor="statements">Receive electronic statements</Label>
      </div>
    </div>
  )
}
