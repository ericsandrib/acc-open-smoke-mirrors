import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TEMPLATE_OPTIONS,
  OPTIONAL_ESIGN_FORM_CATALOG,
  PAPERWORK_DELIVERY_OPTIONS,
} from '@/data/esignEnvelopeOptions'
import type { EsignEnvelope } from '@/types/esignEnvelope'
import { groupFormSelectionsByAccountChild } from '@/utils/buildEsignEnvelopeFormRows'
import { deriveDefaultEnvelopeName } from '@/utils/deriveEnvelopeDisplayName'
import { downloadEnvelopeManifest } from '@/utils/downloadEsignEnvelopeManifest'
import { Download, Plus, Trash2, Upload } from 'lucide-react'

function cloneEnvelope(e: EsignEnvelope): EsignEnvelope {
  return {
    ...e,
    formSelections: e.formSelections.map((r) => ({ ...r })),
    signers: e.signers.map((s) => ({ ...s })),
    uploadedFiles: e.uploadedFiles.map((f) => ({ ...f })),
    optionalFormIdsIncluded: [...e.optionalFormIdsIncluded],
  }
}

interface EsignEnvelopeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  envelope: EsignEnvelope
  onSave: (envelope: EsignEnvelope) => void
  /** When true, primary button says "Create envelope". */
  isCreate?: boolean
}

export function EsignEnvelopeDrawer({
  open,
  onOpenChange,
  envelope,
  onSave,
  isCreate = false,
}: EsignEnvelopeDrawerProps) {
  const [local, setLocal] = useState(() => cloneEnvelope(envelope))

  const grouped = groupFormSelectionsByAccountChild(local.formSelections)

  const toggleOptional = (id: string, checked: boolean) => {
    setLocal((prev) => ({
      ...prev,
      optionalFormIdsIncluded: checked
        ? [...new Set([...prev.optionalFormIdsIncluded, id])]
        : prev.optionalFormIdsIncluded.filter((x) => x !== id),
    }))
  }

  const addSigner = () => {
    setLocal((prev) => ({
      ...prev,
      signers: [
        ...prev.signers,
        { id: `sig-${Date.now()}`, name: '', email: '' },
      ],
    }))
  }

  const updateSigner = (id: string, patch: Partial<{ name: string; email: string }>) => {
    setLocal((prev) => ({
      ...prev,
      signers: prev.signers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }))
  }

  const removeSigner = (id: string) => {
    setLocal((prev) => ({
      ...prev,
      signers: prev.signers.filter((s) => s.id !== id),
    }))
  }

  const addUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      setLocal((prev) => ({
        ...prev,
        uploadedFiles: [
          ...prev.uploadedFiles,
          {
            id: `up-${Date.now()}`,
            fileName: file.name,
            manualFieldMapping: false,
          },
        ],
      }))
    }
    input.click()
  }

  const toggleUploadMapping = (fileId: string, manualFieldMapping: boolean) => {
    setLocal((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.map((f) =>
        f.id === fileId ? { ...f, manualFieldMapping } : f,
      ),
    }))
  }

  const removeUpload = (fileId: string) => {
    setLocal((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((f) => f.id !== fileId),
    }))
  }

  const handleSave = () => {
    const trimmed = local.name.trim()
    const resolvedName = trimmed || deriveDefaultEnvelopeName(local)
    onSave({ ...local, name: resolvedName })
  }

  const previewDefaultName =
    !local.name.trim() ? deriveDefaultEnvelopeName(local) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full max-h-[100dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <SheetHeader className="space-y-1 border-b border-border px-6 py-4 text-left">
          <SheetTitle>{isCreate ? 'New signing envelope' : 'Edit signing envelope'}</SheetTitle>
          <SheetDescription>
            Configure delivery, firm/custodian forms by account, signers, and any extra uploads for this envelope.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="env-name">Envelope name</Label>
            <Input
              id="env-name"
              value={local.name}
              onChange={(e) => setLocal((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Smith household — new accounts"
            />
            {previewDefaultName ? (
              <p className="text-xs text-muted-foreground leading-snug">
                If left blank, this envelope will be saved as:{' '}
                <span className="font-medium text-foreground">{previewDefaultName}</span>
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>
              Paperwork delivery method <span className="text-destructive">*</span>
            </Label>
            <Select
              value={local.deliveryMethod}
              onValueChange={(v) =>
                setLocal((p) => ({ ...p, deliveryMethod: v as EsignEnvelope['deliveryMethod'] }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {PAPERWORK_DELIVERY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Template</Label>
            <p className="text-xs text-muted-foreground">Optional: select a template to use for this envelope.</p>
            <Select
              value={local.templateId ?? '_none'}
              onValueChange={(v) =>
                setLocal((p) => ({ ...p, templateId: v === '_none' ? undefined : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template (optional)" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Firm &amp; custodian forms</p>
              <p className="text-xs text-muted-foreground mt-1">
                Required forms are included automatically and cannot be removed. Optional forms can be added from the
                list below.
              </p>
            </div>

            {local.formSelections.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-md border border-dashed border-border p-4">
                No generated forms yet. Add accounts with registration types in Open Accounts to populate this list.
              </p>
            ) : (
              <div className="space-y-4">
                {Array.from(grouped.entries()).map(([accountChildId, rows]) => {
                  const head = rows[0]
                  return (
                  <div key={accountChildId} className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2 border-b border-border space-y-0.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Account
                      </p>
                      <p className="text-sm font-medium text-foreground leading-snug">{head?.accountOpeningName ?? 'Account'}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Account # <span className="text-foreground font-medium">{head?.accountNumberLabel ?? '—'}</span>
                      </p>
                    </div>
                    <ul className="divide-y divide-border">
                      {rows.map((row) => (
                        <li key={row.formId} className="flex items-start gap-3 px-3 py-2.5">
                          <Checkbox checked={row.included} disabled={row.required} className="mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-foreground">{row.label}</p>
                            {row.required ? (
                              <p className="text-[11px] text-muted-foreground">Required for this registration</p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  )
                })}
              </div>
            )}

            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Optional add-on forms</p>
              {OPTIONAL_ESIGN_FORM_CATALOG.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-start gap-3 cursor-pointer rounded-md p-2 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={local.optionalFormIdsIncluded.includes(opt.id)}
                    onCheckedChange={(c) => toggleOptional(opt.id, c === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Envelope signers</p>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium px-3 py-2 text-xs text-muted-foreground">Name</th>
                    <th className="text-left font-medium px-3 py-2 text-xs text-muted-foreground">Email</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {local.signers.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 align-top">
                        <Input
                          value={s.name}
                          onChange={(e) => updateSigner(s.id, { name: e.target.value })}
                          placeholder="Full name"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <Input
                          type="email"
                          value={s.email}
                          onChange={(e) => updateSigner(s.id, { email: e.target.value })}
                          placeholder="email@example.com"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="px-1 py-1 align-top">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeSigner(s.id)}
                          aria-label="Remove signer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addSigner}>
              <Plus className="h-3.5 w-3.5" />
              Add signer
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Additional files for this envelope</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload PDFs or images to include in the envelope. Enable manual mapping when you will place fields and
                signature tabs yourself in the e-sign provider.
              </p>
            </div>
            {local.uploadedFiles.length === 0 ? (
              <p className="text-xs text-muted-foreground">No extra files attached.</p>
            ) : (
              <ul className="space-y-2">
                {local.uploadedFiles.map((f) => (
                  <li
                    key={f.id}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span className="flex-1 min-w-0 truncate">{f.fileName}</span>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                      <Checkbox
                        checked={f.manualFieldMapping}
                        onCheckedChange={(c) => toggleUploadMapping(f.id, c === true)}
                      />
                      Manual field &amp; signature mapping
                    </label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeUpload(f.id)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addUpload}>
              <Upload className="h-3.5 w-3.5" />
              Upload file
            </Button>
          </div>
        </div>

        <SheetFooter className="flex flex-col gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            onClick={() =>
              downloadEnvelopeManifest({
                ...local,
                name: local.name.trim() || deriveDefaultEnvelopeName(local),
              })
            }
          >
            <Download className="h-4 w-4" />
            Download form list
          </Button>
          <div className="flex gap-2 justify-end w-full sm:w-auto">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              {isCreate ? 'Create envelope' : 'Save envelope'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
