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
import { Minus, Plus } from 'lucide-react'

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
  onConfirm: (selections: { accountType: AccountType; label: string; count: number }[]) => void
}

export function AccountTypePickerDialog({ open, onOpenChange, onConfirm }: AccountTypePickerDialogProps) {
  const [counts, setCounts] = useState<Record<AccountType, number>>(() =>
    Object.fromEntries(ACCOUNT_TYPES.map((t) => [t.value, 0])) as Record<AccountType, number>,
  )

  const updateCount = (type: AccountType, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [type]: Math.max(0, (prev[type] ?? 0) + delta),
    }))
  }

  const totalSelected = Object.values(counts).reduce((sum, n) => sum + n, 0)

  const handleConfirm = () => {
    const selections = ACCOUNT_TYPES
      .filter((t) => counts[t.value] > 0)
      .map((t) => ({ accountType: t.value, label: t.label, count: counts[t.value] }))
    onConfirm(selections)
    // Reset counts after confirm
    setCounts(Object.fromEntries(ACCOUNT_TYPES.map((t) => [t.value, 0])) as Record<AccountType, number>)
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
            <div
              key={type.value}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/50"
            >
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
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={totalSelected === 0}>
            Open {totalSelected} {totalSelected === 1 ? 'Account' : 'Accounts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
