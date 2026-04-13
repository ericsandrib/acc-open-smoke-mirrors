import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WetSignedFirmUpload } from '@/utils/wetSignedFirmUploads'
import { newWetSignedFirmUploadRow } from '@/utils/wetSignedFirmUploads'
import { Paperclip, Plus, Trash2, Upload, X } from 'lucide-react'

export interface WetSignedAccountOption {
  childId: string
  label: string
  accountNumber?: string
}

interface WetSignedFirmUploadsGroupProps {
  documentTypes: Array<{ id: string; label: string }>
  accountOptions: WetSignedAccountOption[]
  uploads: WetSignedFirmUpload[]
  onChange: (next: WetSignedFirmUpload[]) => void
  /** Prefills new rows (e.g. current account-opening child). */
  defaultAccountChildId?: string
}

export function WetSignedFirmUploadsGroup({
  documentTypes,
  accountOptions,
  uploads,
  onChange,
  defaultAccountChildId,
}: WetSignedFirmUploadsGroupProps) {
  const syncAccountNumberFromChild = (childId: string | undefined) => {
    if (!childId) return undefined
    return accountOptions.find((a) => a.childId === childId)?.accountNumber
  }

  const updateRow = (id: string, patch: Partial<WetSignedFirmUpload>) => {
    onChange(
      uploads.map((u) => {
        if (u.id !== id) return u
        let next = { ...u, ...patch }
        if (patch.accountChildId !== undefined) {
          next = {
            ...next,
            accountNumber: syncAccountNumberFromChild(patch.accountChildId) ?? next.accountNumber,
          }
        }
        return next
      }),
    )
  }

  const removeRow = (id: string) => {
    onChange(uploads.filter((u) => u.id !== id))
  }

  const addRow = () => {
    const acct = defaultAccountChildId
    onChange([
      ...uploads,
      newWetSignedFirmUploadRow({
        documentTypeId: documentTypes[0]?.id ?? '',
        accountChildId: acct,
        accountNumber: syncAccountNumberFromChild(acct),
      }),
    ])
  }

  const pickFile = (rowId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) updateRow(rowId, { fileName: file.name })
    }
    input.click()
  }

  if (documentTypes.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No firm/custodian form types are available to tag yet for this context.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground leading-snug">
        Add one row per wet-signed scan. Choose the form type and account (if applicable), then upload the file. Notes are
        optional—for example envelope ID or custodian reference.
      </p>

      {uploads.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">No wet-signed uploads yet.</p>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addRow}>
            <Plus className="h-3.5 w-3.5" />
            Add wet-signed upload
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left font-medium text-muted-foreground px-3 py-2 text-xs w-[22%] min-w-0">
                  Document type
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2 text-xs w-[20%] min-w-0">
                  Account
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2 text-xs w-[18%] min-w-0">
                  Account #
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2 text-xs min-w-0">Notes</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2 text-xs w-[14%] min-w-0">File</th>
                <th className="w-10 px-1" />
              </tr>
            </thead>
            <tbody>
              {uploads.map((row, idx) => (
                <tr key={row.id} className={idx < uploads.length - 1 ? 'border-b border-border' : ''}>
                  <td className="px-3 py-2 align-top min-w-0">
                    <Select
                      value={row.documentTypeId || '__none__'}
                      onValueChange={(v) => updateRow(row.id, { documentTypeId: v === '__none__' ? '' : v })}
                    >
                      <SelectTrigger className="h-8 text-xs w-full min-w-0">
                        <SelectValue placeholder="Select type…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        {documentTypes.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 align-top min-w-0">
                    <Select
                      value={row.accountChildId ?? '__none__'}
                      onValueChange={(v) =>
                        updateRow(row.id, { accountChildId: v === '__none__' ? undefined : v })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs w-full min-w-0">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Not specified</SelectItem>
                        {accountOptions.map((a) => (
                          <SelectItem key={a.childId} value={a.childId}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 align-top min-w-0">
                    <Input
                      className="h-8 text-xs"
                      placeholder="e.g. custodian #"
                      value={row.accountNumber ?? ''}
                      onChange={(e) => updateRow(row.id, { accountNumber: e.target.value })}
                      aria-label="Account number"
                    />
                  </td>
                  <td className="px-3 py-2 align-top min-w-0">
                    <Input
                      className="h-8 text-xs"
                      placeholder="Optional"
                      value={row.notes ?? ''}
                      onChange={(e) => updateRow(row.id, { notes: e.target.value })}
                      aria-label="Notes"
                    />
                  </td>
                  <td className="px-3 py-2 align-top min-w-0">
                    {row.fileName ? (
                      <div className="flex items-center gap-1 min-w-0">
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs truncate min-w-0" title={row.fileName}>
                          {row.fileName}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1 shrink-0"
                          onClick={() => pickFile(row.id)}
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive p-1 shrink-0"
                          aria-label="Clear file"
                          onClick={() => updateRow(row.id, { fileName: '' })}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1"
                        onClick={() => pickFile(row.id)}
                      >
                        <Upload className="h-3 w-3" />
                        Upload
                      </Button>
                    )}
                  </td>
                  <td className="px-1 py-2 align-top">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded-md"
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border bg-muted/20 px-3 py-2">
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={addRow}>
              <Plus className="h-3.5 w-3.5" />
              Add wet-signed upload
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
