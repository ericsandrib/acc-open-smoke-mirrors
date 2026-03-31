import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export function FinancialAccountsForm() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Account Type</Label>
        <div className="col-span-2">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select account type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking">Checking</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="investment">Investment</SelectItem>
              <SelectItem value="retirement">Retirement (IRA)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Funding Source</Label>
        <div className="col-span-2">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select funding source..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employment">Employment Income</SelectItem>
              <SelectItem value="investment">Investment Returns</SelectItem>
              <SelectItem value="inheritance">Inheritance</SelectItem>
              <SelectItem value="business">Business Income</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="initialDeposit">Estimated Initial Deposit</Label>
        <Input id="initialDeposit" type="number" placeholder="50,000" className="col-span-2" />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Currency</Label>
        <div className="col-span-2">
          <Select defaultValue="usd">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usd">USD</SelectItem>
              <SelectItem value="eur">EUR</SelectItem>
              <SelectItem value="gbp">GBP</SelectItem>
              <SelectItem value="chf">CHF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="statements">Electronic Statements</Label>
        <div className="col-span-2">
          <Checkbox id="statements" />
        </div>
      </div>
    </div>
  )
}
