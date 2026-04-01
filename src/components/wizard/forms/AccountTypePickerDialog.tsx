import { useState } from 'react'
import type { AccountType } from '@/types/workflow'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Minus, Plus, Shield } from 'lucide-react'

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'brokerage', label: 'Brokerage' },
  { value: 'ira', label: 'Traditional IRA' },
  { value: 'roth_ira', label: 'Roth IRA' },
  { value: '401k', label: '401(k)' },
  { value: 'trust', label: 'Trust' },
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
]

interface AccountTypePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (selections: { accountType: AccountType; label: string; count: number; withAnnuityCount: number }[]) => void
}

export function AccountTypePickerDialog({ open, onOpenChange, onConfirm }: AccountTypePickerDialogProps) {
  const zeroCounts = () => Object.fromEntries(ACCOUNT_TYPES.map((t) => [t.value, 0])) as Record<AccountType, number>
  const [counts, setCounts] = useState<Record<AccountType, number>>(zeroCounts)
  const [withAnnuityCounts, setWithAnnuityCounts] = useState<Record<AccountType, number>>(zeroCounts)
  const [annuityRowVisible, setAnnuityRowVisible] = useState<Record<AccountType, boolean>>(
    () => Object.fromEntries(ACCOUNT_TYPES.map((t) => [t.value, false])) as Record<AccountType, boolean>,
  )

  const updateCount = (type: AccountType, delta: number) => {
    setCounts((prev) => ({ ...prev, [type]: Math.max(0, (prev[type] ?? 0) + delta) }))
  }

  const updateWithAnnuityCount = (type: AccountType, delta: number) => {
    setWithAnnuityCounts((prev) => {
      const next = Math.max(0, (prev[type] ?? 0) + delta)
      if (next === 0) {
        setAnnuityRowVisible((v) => ({ ...v, [type]: false }))
      }
      return { ...prev, [type]: next }
    })
  }

  const showAnnuityRow = (type: AccountType) => {
    setAnnuityRowVisible((prev) => ({ ...prev, [type]: true }))
    setWithAnnuityCounts((prev) => ({ ...prev, [type]: Math.max(1, prev[type] ?? 0) }))
  }

  const totalAccounts = Object.values(counts).reduce((sum, n) => sum + n, 0)
  const totalWithAnnuity = Object.values(withAnnuityCounts).reduce((sum, n) => sum + n, 0)
  const totalSelected = totalAccounts + totalWithAnnuity

  const handleConfirm = () => {
    const selections = ACCOUNT_TYPES
      .filter((t) => counts[t.value] > 0 || withAnnuityCounts[t.value] > 0)
      .map((t) => ({ accountType: t.value, label: t.label, count: counts[t.value], withAnnuityCount: withAnnuityCounts[t.value] ?? 0 }))
    onConfirm(selections)
    setCounts(zeroCounts())
    setWithAnnuityCounts(zeroCounts())
    setAnnuityRowVisible(
      Object.fromEntries(ACCOUNT_TYPES.map((t) => [t.value, false])) as Record<AccountType, boolean>,
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Account Types</DialogTitle>
          <DialogDescription>
            Choose the types and quantities of accounts to open.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 py-2">
          {ACCOUNT_TYPES.map((type) => (
            <div key={type.value} className="space-y-1">
              {/* Plain accounts row */}
              <div className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/50">
                <span className="text-sm font-medium">{type.label}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateCount(type.value, -1)}
                    disabled={counts[type.value] === 0}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm tabular-nums font-medium">
                    {counts[type.value]}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateCount(type.value, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  {!annuityRowVisible[type.value] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 ml-1"
                      onClick={() => showAnnuityRow(type.value)}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      + Annuity
                    </Button>
                  )}
                </div>
              </div>
              {/* With-annuity accounts row */}
              {annuityRowVisible[type.value] && (
                <div className="flex items-center justify-between rounded-lg ml-4 pl-3 pr-3 py-2.5 border-l-2 border-border hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{type.label} w/ Annuity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateWithAnnuityCount(type.value, -1)}
                      disabled={withAnnuityCounts[type.value] === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm tabular-nums font-medium">
                      {withAnnuityCounts[type.value]}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateWithAnnuityCount(type.value, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={totalSelected === 0}>
            Open {totalSelected} {totalSelected === 1 ? 'Account' : 'Accounts'}
            {totalWithAnnuity > 0 && ` (${totalWithAnnuity} w/ annuity)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
