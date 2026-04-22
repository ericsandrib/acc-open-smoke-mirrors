import { useState } from 'react'
import type { RegistrationType } from '@/utils/registrationDocuments'
import { registrationTypeLabels } from '@/utils/registrationDocuments'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Combobox } from '@/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { teamMembers } from '@/data/teamMembers'

const REGISTRATION_TYPE_OPTIONS: { value: string; label: string }[] = (
  Object.entries(registrationTypeLabels) as [RegistrationType, string][]
).map(([value, label]) => ({ value, label }))

const QUANTITY_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

interface Row {
  id: string
  registrationType: RegistrationType | ''
  quantity: number
}

export type Selection = {
  registrationType: RegistrationType
  label: string
  count: number
  officeCode: string
  investmentProfessionalId: string
}

function createRow(): Row {
  return { id: `row-${Date.now()}-${Math.random().toString(36).slice(2)}`, registrationType: '', quantity: 1 }
}

interface AccountTypePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (selections: Selection[]) => void
}

export function AccountTypePickerDialog({ open, onOpenChange, onConfirm }: AccountTypePickerDialogProps) {
  const [rows, setRows] = useState<Row[]>(() => [createRow()])
  const [officeCode, setOfficeCode] = useState('')
  const [investmentProfessionalId, setInvestmentProfessionalId] = useState('')

  const officeOptions = [...new Set(teamMembers.map((m) => m.officeCode))]
    .sort()
    .map((code) => ({ value: code, label: `Office ${code}` }))
  const advisorOptions = teamMembers.map((m) => ({ value: m.id, label: m.name }))

  const handleReset = () => {
    setRows([createRow()])
    setOfficeCode('')
    setInvestmentProfessionalId('')
  }

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

  const buildSelections = (): Selection[] => {
    const grouped = new Map<RegistrationType, number>()

    for (const row of validRows) {
      const type = row.registrationType as RegistrationType
      grouped.set(type, (grouped.get(type) ?? 0) + row.quantity)
    }

    return Array.from(grouped.entries()).map(([type, count]) => {
      const label = registrationTypeLabels[type]
      return {
        registrationType: type,
        label,
        count,
        officeCode,
        investmentProfessionalId,
      }
    })
  }

  const handleConfirm = () => {
    const selections = buildSelections()
    if (selections.length === 0) return
    onConfirm(selections)
    handleReset()
    onOpenChange(false)
  }

  const canSubmit =
    officeCode !== '' &&
    investmentProfessionalId !== '' &&
    rows.some((r) => r.registrationType !== '' && r.quantity >= 1)

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-[min(560px,calc(100vw-1rem))] max-w-[min(560px,calc(100vw-1rem))] flex-col gap-0 p-0 sm:max-w-[min(560px,calc(100vw-1rem))]"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>Add accounts</SheetTitle>
          <SheetDescription>
            Choose registration types for accounts to open (individual, joint, retirement, trust, entity, and other
            custodian offerings). Each row is one or more parallel account-opening workflows—use quantity when you need
            the same registration type more than once.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>
                  Office <span className="text-destructive">*</span>
                </Label>
                <Combobox
                  options={officeOptions}
                  value={officeCode}
                  onValueChange={setOfficeCode}
                  placeholder="Search office..."
                  emptyMessage="No offices found."
                  dropdownClassName="max-h-40"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Advisor <span className="text-destructive">*</span>
                </Label>
                <Combobox
                  options={advisorOptions}
                  value={investmentProfessionalId}
                  onValueChange={setInvestmentProfessionalId}
                  placeholder="Search advisor..."
                  emptyMessage="No advisors found."
                  dropdownClassName="max-h-40"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-visible">
            <div className="grid grid-cols-[1fr_90px_40px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Registration type
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Qty</span>
              <span />
            </div>

            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_90px_40px] gap-3 items-center px-4 py-3 border-b border-border last:border-b-0"
              >
                <div className="space-y-1.5 min-w-0">
                  <Label className="sr-only">Registration type</Label>
                  <Select
                    value={row.registrationType || undefined}
                    onValueChange={(v) => updateRow(row.id, { registrationType: v as RegistrationType })}
                  >
                    <SelectTrigger className="h-9 w-full text-left [&>span]:line-clamp-2 [&>span]:text-left">
                      <SelectValue placeholder="Select registration type…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(24rem,70vh)] w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)] min-w-0">
                      {REGISTRATION_TYPE_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="whitespace-normal break-words text-left py-2"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Remove row"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add another registration type
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Quantities above 1 create numbered copies of the same registration type so each can be completed on its own.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {totalAccounts === 1 ? 'Add 1 account' : `Add ${totalAccounts} accounts`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
