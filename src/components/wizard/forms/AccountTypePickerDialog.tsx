import { useState } from 'react'
import type { AccountType } from '@/types/workflow'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { Plus, Trash2 } from 'lucide-react'

const REGISTRATION_TYPES: { value: AccountType; label: string }[] = [
  { value: 'brokerage', label: 'Brokerage' },
  { value: 'ira', label: 'Traditional IRA' },
  { value: 'roth_ira', label: 'Roth IRA' },
  { value: '401k', label: '401(k)' },
  { value: 'trust', label: 'Trust' },
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
]

const QUANTITY_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

interface Row {
  id: string
  registrationType: AccountType | ''
  annuity: 'No' | 'Yes'
  quantity: number
}

function createRow(): Row {
  return { id: `row-${Date.now()}-${Math.random()}`, registrationType: '', annuity: 'No', quantity: 1 }
}

interface AccountTypePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (selections: { accountType: AccountType; label: string; count: number; withAnnuityCount: number }[]) => void
}

export function AccountTypePickerDialog({ open, onOpenChange, onConfirm }: AccountTypePickerDialogProps) {
  const [rows, setRows] = useState<Row[]>(() => [createRow()])

  const handleReset = () => setRows([createRow()])

  const handleOpenChange = (next: boolean) => {
    if (!next) handleReset()
    onOpenChange(next)
  }

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRow = (id: string) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id)
      return next.length === 0 ? [createRow()] : next
    })
  }

  const addRow = () => setRows((prev) => [...prev, createRow()])

  const validRows = rows.filter((r) => r.registrationType !== '')

  const totalAccounts = validRows.reduce((sum, r) => sum + r.quantity, 0)

  const handleConfirm = () => {
    const grouped = new Map<AccountType, { plain: number; annuity: number }>()

    for (const row of validRows) {
      const type = row.registrationType as AccountType
      const existing = grouped.get(type) ?? { plain: 0, annuity: 0 }
      if (row.annuity === 'Yes') {
        existing.annuity += row.quantity
      } else {
        existing.plain += row.quantity
      }
      grouped.set(type, existing)
    }

    const selections = Array.from(grouped.entries()).map(([type, counts]) => {
      const label = REGISTRATION_TYPES.find((r) => r.value === type)?.label ?? type
      return {
        accountType: type,
        label,
        count: counts.plain,
        withAnnuityCount: counts.annuity,
      }
    })

    onConfirm(selections)
    handleReset()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-[640px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>Add Accounts</SheetTitle>
          <SheetDescription>Select the registration types and quantities for accounts to open.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="rounded-lg border border-border overflow-visible">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_100px_90px_40px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Registration Type</span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Annuity</span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Qty</span>
              <span />
            </div>

            {/* Table rows */}
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_100px_90px_40px] gap-3 items-center px-4 py-3 border-b border-border last:border-b-0"
              >
                {/* Registration Type */}
                <Combobox
                  options={REGISTRATION_TYPES.map((r) => ({ value: r.value, label: r.label }))}
                  value={row.registrationType}
                  onValueChange={(val) => updateRow(row.id, { registrationType: val as AccountType })}
                  placeholder="Select type"
                  emptyMessage="No types found."
                />

                {/* Annuity */}
                <Select
                  value={row.annuity}
                  onValueChange={(val) => updateRow(row.id, { annuity: val as 'No' | 'Yes' })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>

                {/* Quantity */}
                <Combobox
                  options={QUANTITY_OPTIONS}
                  value={String(row.quantity)}
                  onValueChange={(val) => {
                    const num = parseInt(val, 10)
                    if (!isNaN(num)) updateRow(row.id, { quantity: num })
                  }}
                  placeholder="Qty"
                  emptyMessage="No match."
                />

                {/* Remove row */}
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Add row button */}
            <button
              type="button"
              onClick={addRow}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add row
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={validRows.length === 0}>
            Open {totalAccounts} {totalAccounts === 1 ? 'Account' : 'Accounts'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
