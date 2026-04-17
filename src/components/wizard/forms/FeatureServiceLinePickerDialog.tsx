import { useState } from 'react'
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
import type { FeatureServiceLineRowInput } from '@/utils/spawnFeatureServiceLineChildren'
import { ACCOUNT_FEATURE_SERVICE_SPAWN_OPTIONS } from '@/data/accountFeatureServiceOptions'

const QUANTITY_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

interface Row {
  id: string
  featureServiceType: string
  quantity: number
}

function createRow(): Row {
  return {
    id: `fs-row-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    featureServiceType: '',
    quantity: 1,
  }
}

interface FeatureServiceLinePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (rows: FeatureServiceLineRowInput[]) => void
}

export function FeatureServiceLinePickerDialog({
  open,
  onOpenChange,
  onConfirm,
}: FeatureServiceLinePickerDialogProps) {
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

  const totalLines = rows
    .filter((r) => r.featureServiceType !== '')
    .reduce((sum, r) => sum + r.quantity, 0)

  const handleConfirm = () => {
    const payload: FeatureServiceLineRowInput[] = rows
      .filter((r) => r.featureServiceType !== '')
      .map((r) => ({
        featureServiceType: r.featureServiceType,
        quantity: Math.min(10, Math.max(1, r.quantity)),
      }))
    if (payload.length === 0) return
    onConfirm(payload)
    handleReset()
    onOpenChange(false)
  }

  const canSubmit = rows.some((r) => r.featureServiceType !== '' && r.quantity >= 1)

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-[560px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle>Add account features & services</SheetTitle>
          <SheetDescription>
            Administrative, setup, or lifecycle workflows—not money or asset movements (those live under Funding &
            asset movement). Each row is one or more parallel workflows; use quantity when you need the same type more
            than once.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="rounded-lg border border-border overflow-visible">
            <div className="grid grid-cols-[1fr_90px_40px] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Feature / service
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
                  <Label className="sr-only">Feature or service type</Label>
                  <Select
                    value={row.featureServiceType || undefined}
                    onValueChange={(v) => updateRow(row.id, { featureServiceType: v })}
                  >
                    <SelectTrigger className="h-9 w-full text-left [&>span]:line-clamp-2 [&>span]:text-left">
                      <SelectValue placeholder="Select type…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(24rem,70vh)]">
                      {ACCOUNT_FEATURE_SERVICE_SPAWN_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-left py-2">
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
              Add another workflow
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Quantities above 1 create numbered copies of the same type so each can be completed on its own.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {totalLines === 1 ? 'Add 1 workflow' : `Add ${totalLines} workflows`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
