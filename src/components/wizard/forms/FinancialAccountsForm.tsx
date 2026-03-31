import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ChevronRight } from 'lucide-react'
import { useWorkflow } from '@/stores/workflowStore'
import type { AccountType, FinancialAccount } from '@/types/workflow'

const accountTypeLabels: Record<AccountType, string> = {
  brokerage: 'Brokerage',
  ira: 'Traditional IRA',
  roth_ira: 'Roth IRA',
  '401k': '401(k)',
  trust: 'Trust',
  checking: 'Checking',
  savings: 'Savings',
}

function AddAccountForm({ onDone }: { onDone: () => void }) {
  const { dispatch } = useWorkflow()
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState<AccountType | ''>('')
  const [custodian, setCustodian] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')
  const handleAdd = () => {
    if (!accountName.trim()) return
    dispatch({
      type: 'ADD_FINANCIAL_ACCOUNT',
      account: {
        id: `acct-${Date.now()}`,
        accountName: accountName.trim(),
        accountType: accountType || undefined,
        custodian: custodian || undefined,
        accountNumber: accountNumber || undefined,
        estimatedValue: estimatedValue || undefined,
      },
    })
    setAccountName('')
    setAccountType('')
    setCustodian('')
    setAccountNumber('')
    setEstimatedValue('')
    onDone()
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-4">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Account name</Label>
        <Input
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="e.g. Smith Family Trust"
          className="col-span-2"
        />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Account type</Label>
        <div className="col-span-2">
          <Select value={accountType} onValueChange={(v) => setAccountType(v as AccountType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(accountTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Current custodian</Label>
        <Input
          value={custodian}
          onChange={(e) => setCustodian(e.target.value)}
          placeholder="e.g. Fidelity, Schwab"
          className="col-span-2"
        />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Account number</Label>
        <Input
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Account number"
          className="col-span-2"
        />
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label>Estimated value</Label>
        <Input
          value={estimatedValue}
          onChange={(e) => setEstimatedValue(e.target.value)}
          placeholder="e.g. 500,000"
          className="col-span-2"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!accountName.trim()}>Add account</Button>
      </div>
    </div>
  )
}

function DeleteAccountButton({ account }: { account: FinancialAccount }) {
  const { dispatch } = useWorkflow()
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [confirming])

  if (confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs gap-1"
        onClick={(e) => {
          e.stopPropagation()
          dispatch({ type: 'REMOVE_FINANCIAL_ACCOUNT', accountId: account.id })
        }}
        aria-label={`Confirm remove ${account.accountName}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remove?
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
      onClick={(e) => {
        e.stopPropagation()
        setConfirming(true)
      }}
      aria-label={`Remove ${account.accountName}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}

function AccountCard({ account }: { account: FinancialAccount }) {
  const { dispatch } = useWorkflow()
  const [open, setOpen] = useState(false)

  const update = (updates: Partial<Omit<FinancialAccount, 'id'>>) => {
    dispatch({ type: 'UPDATE_FINANCIAL_ACCOUNT', accountId: account.id, updates })
  }

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-t-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ease-out ${open ? 'rotate-90' : ''}`} />
          <span className="text-sm font-medium">{account.accountName}</span>
          {account.accountType && (
            <span className="text-xs text-muted-foreground">{accountTypeLabels[account.accountType]}</span>
          )}
          {account.custodian && (
            <span className="text-xs text-muted-foreground">at {account.custodian}</span>
          )}
        </div>
        <DeleteAccountButton account={account} />
      </button>
      {open && (
        <div className="border-t border-border px-3 pb-3 pt-3 space-y-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Account name</Label>
            <Input
              value={account.accountName}
              onChange={(e) => update({ accountName: e.target.value })}
              placeholder="Account name"
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Account type</Label>
            <div className="col-span-2">
              <Select value={account.accountType ?? ''} onValueChange={(v) => update({ accountType: v as AccountType })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(accountTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Current custodian</Label>
            <Input
              value={account.custodian ?? ''}
              onChange={(e) => update({ custodian: e.target.value })}
              placeholder="e.g. Fidelity, Schwab"
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Account number</Label>
            <Input
              value={account.accountNumber ?? ''}
              onChange={(e) => update({ accountNumber: e.target.value })}
              placeholder="Account number"
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label>Estimated value</Label>
            <Input
              value={account.estimatedValue ?? ''}
              onChange={(e) => update({ estimatedValue: e.target.value })}
              placeholder="e.g. 500,000"
              className="col-span-2"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function FinancialAccountsForm() {
  const { state } = useWorkflow()
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {state.financialAccounts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">No financial accounts added yet. Add accounts you'd like to transfer or manage.</p>
          </div>
        ) : (
          state.financialAccounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))
        )}
      </div>

      {showAdd ? (
        <AddAccountForm onDone={() => setShowAdd(false)} />
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add account
        </Button>
      )}
    </div>
  )
}
