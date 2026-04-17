import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Plus, Trash2 } from 'lucide-react'
import { useWorkflow } from '@/stores/workflowStore'
import type { AccountType, FinancialAccount } from '@/types/workflow'
import { accountTypeLabels } from '@/utils/financialAccountLabels'

export function AddAccountSheet({
  open,
  onOpenChange,
  onAccountAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccountAdded?: (account: FinancialAccount) => void
}) {
  const { dispatch } = useWorkflow()
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState<AccountType | ''>('')
  const [custodian, setCustodian] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')

  const reset = () => {
    setAccountName('')
    setAccountType('')
    setCustodian('')
    setRoutingNumber('')
    setAccountNumber('')
    setEstimatedValue('')
  }

  const handleAdd = () => {
    if (!accountName.trim()) return
    const account: FinancialAccount = {
      id: `acct-${Date.now()}`,
      accountName: accountName.trim(),
      accountType: accountType || undefined,
      custodian: custodian || undefined,
      routingNumber:
        accountType === 'checking' || accountType === 'savings' ? routingNumber || undefined : undefined,
      accountNumber: accountNumber || undefined,
      estimatedValue: estimatedValue || undefined,
    }
    dispatch({
      type: 'ADD_FINANCIAL_ACCOUNT',
      account,
    })
    onAccountAdded?.(account)
    reset()
    onOpenChange(false)
  }

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-[488px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>Add Account</SheetTitle>
          <SheetDescription>Add a new financial account to this relationship.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-2">
            <Label>Account name</Label>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. Smith Family Trust"
            />
          </div>
          <div className="space-y-2">
            <Label>Account type</Label>
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
          <div className="space-y-2">
            <Label>{accountType === 'checking' || accountType === 'savings' ? 'Financial institution' : 'Current custodian'}</Label>
            <Input
              value={custodian}
              onChange={(e) => setCustodian(e.target.value)}
              placeholder={accountType === 'checking' || accountType === 'savings' ? 'e.g. Chase Bank' : 'e.g. Fidelity, Schwab'}
            />
          </div>
          {(accountType === 'checking' || accountType === 'savings') && (
            <div className="space-y-2">
              <Label>Routing / ABA</Label>
              <Input
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                placeholder="9-digit routing number"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Account number</Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Account number"
            />
          </div>
          <div className="space-y-2">
            <Label>Estimated value</Label>
            <Input
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(e.target.value)}
              placeholder="e.g. 500,000"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
          <Button onClick={handleAdd} disabled={!accountName.trim()}>
            Add account
          </Button>
        </div>
      </SheetContent>
    </Sheet>
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

function getAccountInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function AccountCard({ account, onClick }: { account: FinancialAccount; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
          {getAccountInitials(account.accountName)}
        </div>
        <span className="text-sm font-medium truncate">{account.accountName}</span>
        {account.accountType && (
          <span className="text-xs text-muted-foreground shrink-0">{accountTypeLabels[account.accountType]}</span>
        )}
        {account.custodian && (
          <span className="text-xs text-muted-foreground shrink-0">at {account.custodian}</span>
        )}
      </div>
      <DeleteAccountButton account={account} />
    </button>
  )
}

interface AccountFields {
  accountName: string
  accountType: string
  custodian: string
  routingNumber: string
  accountNumber: string
  estimatedValue: string
}

function snapshotAccount(account: FinancialAccount): AccountFields {
  return {
    accountName: account.accountName ?? '',
    accountType: account.accountType ?? '',
    custodian: account.custodian ?? '',
    routingNumber: account.routingNumber ?? '',
    accountNumber: account.accountNumber ?? '',
    estimatedValue: account.estimatedValue ?? '',
  }
}

function EditAccountSheetInner({
  account,
  open,
  onOpenChange,
}: {
  account: FinancialAccount
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { dispatch } = useWorkflow()
  const [baseline] = useState<AccountFields>(() => snapshotAccount(account))
  const [fields, setFields] = useState<AccountFields>(() => snapshotAccount(account))

  const isDirty = Object.keys(baseline).some(
    (k) => fields[k as keyof AccountFields] !== baseline[k as keyof AccountFields]
  )

  const setField = (key: keyof AccountFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_FINANCIAL_ACCOUNT',
      accountId: account.id,
      updates: {
        accountName: fields.accountName || account.accountName,
        accountType: (fields.accountType as AccountType) || undefined,
        custodian: fields.custodian || undefined,
        routingNumber:
          fields.accountType === 'checking' || fields.accountType === 'savings'
            ? fields.routingNumber || undefined
            : undefined,
        accountNumber: fields.accountNumber || undefined,
        estimatedValue: fields.estimatedValue || undefined,
      },
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[488px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>{account.accountName}</SheetTitle>
          <SheetDescription>Edit financial account details.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-2">
            <Label>Account name</Label>
            <Input
              value={fields.accountName}
              onChange={(e) => setField('accountName', e.target.value)}
              placeholder="e.g. Smith Family Trust"
            />
          </div>
          <div className="space-y-2">
            <Label>Account type</Label>
            <Select value={fields.accountType} onValueChange={(v) => setField('accountType', v)}>
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
          <div className="space-y-2">
            <Label>
              {fields.accountType === 'checking' || fields.accountType === 'savings'
                ? 'Financial institution'
                : 'Current custodian'}
            </Label>
            <Input
              value={fields.custodian}
              onChange={(e) => setField('custodian', e.target.value)}
              placeholder={
                fields.accountType === 'checking' || fields.accountType === 'savings'
                  ? 'e.g. Chase Bank'
                  : 'e.g. Fidelity, Schwab'
              }
            />
          </div>
          {(fields.accountType === 'checking' || fields.accountType === 'savings') && (
            <div className="space-y-2">
              <Label>Routing / ABA</Label>
              <Input
                value={fields.routingNumber}
                onChange={(e) => setField('routingNumber', e.target.value)}
                placeholder="9-digit routing number"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Account number</Label>
            <Input
              value={fields.accountNumber}
              onChange={(e) => setField('accountNumber', e.target.value)}
              placeholder="Account number"
            />
          </div>
          <div className="space-y-2">
            <Label>Estimated value</Label>
            <Input
              value={fields.estimatedValue}
              onChange={(e) => setField('estimatedValue', e.target.value)}
              placeholder="e.g. 500,000"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
          <Button onClick={handleSave} disabled={!isDirty}>
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function EditAccountSheet({
  account,
  open,
  onOpenChange,
}: {
  account: FinancialAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!account) return null
  return <EditAccountSheetInner key={account.id} account={account} open={open} onOpenChange={onOpenChange} />
}

export function FinancialAccountsForm() {
  const { state } = useWorkflow()
  const [showAdd, setShowAdd] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)

  const editingAccount = editingAccountId
    ? state.financialAccounts.find((a) => a.id === editingAccountId) ?? null
    : null

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-1">
        <div>
          {state.financialAccounts.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No financial accounts added yet. Add accounts you'd like to transfer or manage.</p>
            </div>
          ) : (
            state.financialAccounts.map((account) => (
              <AccountCard key={account.id} account={account} onClick={() => setEditingAccountId(account.id)} />
            ))
          )}
        </div>
        <Button variant="ghost" className="w-full" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add account
        </Button>
      </div>

      <AddAccountSheet open={showAdd} onOpenChange={setShowAdd} />

      <EditAccountSheet
        account={editingAccount}
        open={!!editingAccountId}
        onOpenChange={(open) => { if (!open) setEditingAccountId(null) }}
      />
    </div>
  )
}
