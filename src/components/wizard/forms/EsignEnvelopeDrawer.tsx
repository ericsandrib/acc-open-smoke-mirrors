import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { flattenPdfForPreview } from '@/utils/flattenPdfForPreview'
import { cn } from '@/lib/utils'
import {
  Building2,
  CalendarDays,
  Check,
  CheckSquare,
  CircleDot,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  FunctionSquare,
  Hash,
  Mail,
  MapPin,
  Paperclip,
  PenLine,
  PenTool,
  Phone,
  Search,
  Settings,
  Copy,
  Trash2,
  Type,
  Upload,
  User,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

/** Visual field chip on the PDF preview (in-session only). */
interface PlacedPdfField {
  id: string
  /** Text shown on the document chip (e.g. Full Name for palette "Name"). */
  label: string
  paletteLabel: string
  signerId: string
  /** Position as % inside the preview container (top-left of chip). */
  xPct: number
  yPct: number
}

function signerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

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
  const [viewerFileId, setViewerFileId] = useState<string | null>(null)
  const [selectedSignerId, setSelectedSignerId] = useState<string>('')
  const [zoomPct, setZoomPct] = useState(100)
  const [activeFieldGroup, setActiveFieldGroup] = useState<'standard' | 'custom' | 'data_verification'>(
    'standard',
  )
  const [placedFieldsByFile, setPlacedFieldsByFile] = useState<Record<string, PlacedPdfField[]>>({})
  /** Placed field whose floating options bar is visible. */
  const [activeFieldOptionsId, setActiveFieldOptionsId] = useState<string | null>(null)
  const [draggingPaletteField, setDraggingPaletteField] = useState<string | null>(null)
  const pdfCanvasRef = useRef<HTMLDivElement | null>(null)
  const pdfScrollRef = useRef<HTMLDivElement | null>(null)

  const dragSessionRef = useRef<{
    fieldId: string
    fileId: string
    startClientX: number
    startClientY: number
    startXPct: number
    startYPct: number
    canvasRect: DOMRect
    moved: boolean
  } | null>(null)
  const suppressClickFieldIdRef = useRef<string | null>(null)
  const placedFieldsByFileRef = useRef(placedFieldsByFile)
  placedFieldsByFileRef.current = placedFieldsByFile

  const grouped = groupFormSelectionsByAccountChild(local.formSelections)

  const toggleOptional = (id: string, checked: boolean) => {
    setLocal((prev) => ({
      ...prev,
      optionalFormIdsIncluded: checked
        ? [...new Set([...prev.optionalFormIdsIncluded, id])]
        : prev.optionalFormIdsIncluded.filter((x) => x !== id),
    }))
  }

  const addUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const id = `up-${Date.now()}`
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      let previewUrl: string
      if (isPdf) {
        try {
          const flatBlob = await flattenPdfForPreview(file)
          previewUrl = URL.createObjectURL(flatBlob)
        } catch {
          previewUrl = URL.createObjectURL(file)
        }
      } else {
        previewUrl = URL.createObjectURL(file)
      }
      setLocal((prev) => ({
        ...prev,
        uploadedFiles: [
          ...prev.uploadedFiles,
          {
            id,
            fileName: file.name,
            previewUrl,
            mimeType: file.type || undefined,
            manualFieldMapping: isPdf,
          },
        ],
      }))
      if (isPdf) {
        setViewerFileId(id)
        if (!selectedSignerId && local.signers[0]?.id) setSelectedSignerId(local.signers[0].id)
      }
    }
    input.click()
  }

  const openViewer = (fileId: string) => {
    setViewerFileId(fileId)
    if (!selectedSignerId && local.signers[0]?.id) setSelectedSignerId(local.signers[0].id)
    setLocal((prev) => ({
        ...prev,
        uploadedFiles: [
        ...prev.uploadedFiles.map((f) =>
          f.id === fileId ? { ...f, manualFieldMapping: true } : f,
        ),
      ],
    }))
  }

  const removeUpload = (fileId: string) => {
    const toRemove = local.uploadedFiles.find((f) => f.id === fileId)
    if (toRemove?.previewUrl) URL.revokeObjectURL(toRemove.previewUrl)
    setLocal((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((f) => f.id !== fileId),
    }))
    setPlacedFieldsByFile((prev) => {
      const next = { ...prev }
      delete next[fileId]
      return next
    })
    if (viewerFileId === fileId) {
      setViewerFileId(null)
      setActiveFieldOptionsId(null)
    }
  }

  const handleSave = () => {
    const trimmed = local.name.trim()
    const resolvedName = trimmed || deriveDefaultEnvelopeName(local)
    onSave({ ...local, name: resolvedName })
  }

  const previewDefaultName =
    !local.name.trim() ? deriveDefaultEnvelopeName(local) : null
  const pdfUploads = local.uploadedFiles.filter(
    (f) => f.mimeType === 'application/pdf' || f.fileName.toLowerCase().endsWith('.pdf'),
  )
  const viewerFile = useMemo(
    () => local.uploadedFiles.find((f) => f.id === viewerFileId),
    [local.uploadedFiles, viewerFileId],
  )
  const standardFieldSections = [
    {
      title: 'Signature',
      fields: [
        { label: 'Signature', icon: PenLine },
        { label: 'Initial', icon: PenLine },
        { label: 'Date Signed', icon: CalendarDays },
      ],
    },
    {
      title: 'Contact Information',
      fields: [
        { label: 'Name', icon: User },
        { label: 'Email', icon: Mail },
        { label: 'Phone', icon: Phone },
        { label: 'Address', icon: MapPin },
        { label: 'Company', icon: Building2 },
        { label: 'Title', icon: FileText },
      ],
    },
    {
      title: 'Inputs',
      fields: [
        { label: 'Text', icon: Type },
        { label: 'Number', icon: Hash },
        { label: 'Checkbox', icon: CheckSquare },
        { label: 'Dropdown', icon: FileText },
        { label: 'Radio', icon: CircleDot },
      ],
    },
    {
      title: 'Actions',
      fields: [
        { label: 'Approve', icon: Check },
        { label: 'Decline', icon: X },
      ],
    },
    {
      title: 'Other',
      fields: [
        { label: 'Note', icon: FileText },
        { label: 'Formula', icon: FunctionSquare },
        { label: 'Attachment', icon: Paperclip },
        { label: 'Payment', icon: CreditCard },
        { label: 'Drawing', icon: PenTool },
      ],
    },
  ]
  const customFields = ['Account Number', 'Registration Type', 'Advisor Notes']
  const dataVerificationFields = ['ID Check', 'Knowledge-based Auth', 'SMS Verification']
  const mappedCount = viewerFile ? (placedFieldsByFile[viewerFile.id] ?? []).length : 0

  const addPlacedFieldFromPalette = (paletteLabel: string) => {
    if (!viewerFile) return
    const displayLabel = paletteLabel === 'Name' ? 'Full Name' : paletteLabel
    const fileId = viewerFile.id
    const signerId = selectedSignerId || local.signers[0]?.id || ''
    const id = `fld-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setPlacedFieldsByFile((prev) => {
      const existing = prev[fileId] ?? []
      const idx = existing.length
      const newField: PlacedPdfField = {
        id,
        label: displayLabel,
        paletteLabel,
        signerId,
        xPct: 36 + (idx % 2) * 14,
        yPct: 16 + Math.floor(idx / 2) * 12,
      }
      return { ...prev, [fileId]: [...existing, newField] }
    })
    setActiveFieldOptionsId(id)
  }

  const dropPlacedFieldFromPalette = (paletteLabel: string, clientX: number, clientY: number, rect: DOMRect) => {
    if (!viewerFile) return
    const displayLabel = paletteLabel === 'Name' ? 'Full Name' : paletteLabel
    const fileId = viewerFile.id
    const signerId = selectedSignerId || local.signers[0]?.id || ''
    const id = `fld-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const xPct = Math.max(1, Math.min(92, ((clientX - rect.left) / rect.width) * 100))
    const yPct = Math.max(1, Math.min(92, ((clientY - rect.top) / rect.height) * 100))
    setPlacedFieldsByFile((prev) => ({
      ...prev,
      [fileId]: [
        ...(prev[fileId] ?? []),
        { id, label: displayLabel, paletteLabel, signerId, xPct, yPct },
      ],
    }))
    setActiveFieldOptionsId(id)
  }

  const updatePlacedFieldSigner = (fieldId: string, signerId: string) => {
    if (!viewerFile) return
    const fileId = viewerFile.id
    setPlacedFieldsByFile((prev) => ({
      ...prev,
      [fileId]: (prev[fileId] ?? []).map((f) => (f.id === fieldId ? { ...f, signerId } : f)),
    }))
  }

  const duplicatePlacedField = (fieldId: string) => {
    if (!viewerFile) return
    const fileId = viewerFile.id
    const id = `fld-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setPlacedFieldsByFile((prev) => {
      const list = prev[fileId] ?? []
      const field = list.find((f) => f.id === fieldId)
      if (!field) return prev
      const copy: PlacedPdfField = {
        ...field,
        id,
        yPct: Math.min(88, field.yPct + 8),
      }
      return { ...prev, [fileId]: [...list, copy] }
    })
    setActiveFieldOptionsId(id)
  }

  const deletePlacedField = (fieldId: string) => {
    if (!viewerFile) return
    const fileId = viewerFile.id
    setPlacedFieldsByFile((prev) => ({
      ...prev,
      [fileId]: (prev[fileId] ?? []).filter((f) => f.id !== fieldId),
    }))
    setActiveFieldOptionsId((cur) => (cur === fieldId ? null : cur))
  }

  const startFieldDrag = (fieldId: string, e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!viewerFile) return
    const fileId = viewerFile.id
    const field = (placedFieldsByFileRef.current[fileId] ?? []).find((f) => f.id === fieldId)
    if (!field) return
    const canvasRect = pdfCanvasRef.current?.getBoundingClientRect()
    if (!canvasRect || canvasRect.width <= 1 || canvasRect.height <= 1) return

    dragSessionRef.current = {
      fieldId,
      fileId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXPct: field.xPct,
      startYPct: field.yPct,
      canvasRect,
      moved: false,
    }

    const onMove = (evt: PointerEvent) => {
      const session = dragSessionRef.current
      if (!session) return
      const dxPx = evt.clientX - session.startClientX
      const dyPx = evt.clientY - session.startClientY
      if (Math.abs(dxPx) > 2 || Math.abs(dyPx) > 2) session.moved = true

      const nextXPct = Math.max(1, Math.min(92, session.startXPct + (dxPx / session.canvasRect.width) * 100))
      const nextYPct = Math.max(1, Math.min(92, session.startYPct + (dyPx / session.canvasRect.height) * 100))

      setPlacedFieldsByFile((prev) => ({
        ...prev,
        [session.fileId]: (prev[session.fileId] ?? []).map((f) =>
          f.id === session.fieldId ? { ...f, xPct: nextXPct, yPct: nextYPct } : f,
        ),
      }))
    }

    const onUp = () => {
      const session = dragSessionRef.current
      if (session?.moved) suppressClickFieldIdRef.current = session.fieldId
      dragSessionRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const handlePlacedFieldClick = (fieldId: string) => {
    if (suppressClickFieldIdRef.current === fieldId) {
      suppressClickFieldIdRef.current = null
      return
    }
    setActiveFieldOptionsId(fieldId)
  }

  useEffect(() => {
    if (!activeFieldOptionsId) return
    const onGlobalPointerDown = (evt: PointerEvent) => {
      const target = evt.target as HTMLElement | null
      if (!target) return
      if (target.closest('[data-placed-field-box]') || target.closest('[data-field-toolbar]')) return
      setActiveFieldOptionsId(null)
    }
    window.addEventListener('pointerdown', onGlobalPointerDown, true)
    return () => window.removeEventListener('pointerdown', onGlobalPointerDown, true)
  }, [activeFieldOptionsId])

  /** PDF is in an iframe — drops on the document hit the iframe, not this React tree, unless we capture them. */
  const handlePaletteDragOverPdf = (e: ReactDragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handlePaletteDropOnPdf = (e: ReactDragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const canvasEl = pdfCanvasRef.current
    setDraggingPaletteField(null)
    if (!canvasEl || !viewerFile) return
    const rect = canvasEl.getBoundingClientRect()
    const droppedLabel =
      e.dataTransfer.getData('text/field-label') ||
      e.dataTransfer.getData('text/plain') ||
      e.dataTransfer.getData('application/x-field-label')
    if (droppedLabel) dropPlacedFieldFromPalette(droppedLabel, e.clientX, e.clientY, rect)
  }

  const accountLabelById = new Map(
    Array.from(grouped.entries()).map(([accountChildId, rows]) => {
      const head = rows[0]
      return [accountChildId, head?.accountOpeningName ?? head?.accountNumberLabel ?? 'Account']
    }),
  )

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
            <p className="text-xs text-muted-foreground">
              Signers are pulled from account owners and deduplicated across accounts.
            </p>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left font-medium px-3 py-2 text-xs text-muted-foreground">Name</th>
                    <th className="text-left font-medium px-3 py-2 text-xs text-muted-foreground">Email</th>
                    <th className="text-left font-medium px-3 py-2 text-xs text-muted-foreground">Signs forms for</th>
                  </tr>
                </thead>
                <tbody>
                  {local.signers.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 align-top text-xs text-foreground">{s.name || 'Account owner'}</td>
                      <td className="px-3 py-2 align-top text-xs text-foreground">{s.email || 'No email on file'}</td>
                      <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                        {(s.accountChildIds ?? [])
                          .map((id) => accountLabelById.get(id) ?? 'Account')
                          .join(', ') || 'No account owner assignments'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Additional files for this envelope</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload PDFs or images to include in the envelope.
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
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeUpload(f.id)}>
                      Remove
                    </Button>
                    {(f.mimeType === 'application/pdf' || f.fileName.toLowerCase().endsWith('.pdf')) && (
                      <Button type="button" variant="outline" size="sm" onClick={() => openViewer(f.id)}>
                        Map fields/signatures
                      </Button>
                    )}
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

      <Dialog
        open={Boolean(viewerFileId)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setViewerFileId(null)
            setActiveFieldOptionsId(null)
          }
        }}
      >
        <DialogContent className="flex max-h-[92vh] max-w-[96vw] flex-col gap-0 overflow-hidden sm:max-h-[92vh]">
          <DialogHeader className="shrink-0 space-y-1.5 pb-4">
            <DialogTitle>Manual field and signature mapping</DialogTitle>
            <DialogDescription>
              Review the uploaded PDF and map fields/signature tabs where needed before sending for e-sign.
            </DialogDescription>
          </DialogHeader>
          {viewerFile?.previewUrl ? (
            <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[260px_1fr_220px] lg:items-stretch lg:[grid-template-rows:minmax(0,1fr)]">
              <aside className="flex min-h-0 max-h-full flex-col overflow-hidden rounded-md border border-border bg-card">
                <div className="shrink-0 space-y-2 border-b border-border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fields</p>
                  <Select value={selectedSignerId} onValueChange={setSelectedSignerId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select signer" />
                    </SelectTrigger>
                    <SelectContent>
                      {local.signers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name || 'Account owner'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={activeFieldGroup}
                    onValueChange={(v) =>
                      setActiveFieldGroup(v as 'standard' | 'custom' | 'data_verification')
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard fields</SelectItem>
                      <SelectItem value="custom">Custom fields</SelectItem>
                      <SelectItem value="data_verification">Data verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
                  {activeFieldGroup === 'standard' ? (
                    <div className="space-y-3">
                      {standardFieldSections.map((section) => (
                        <div key={section.title}>
                          <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">{section.title}</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {section.fields.map(({ label, icon: Icon }) => (
                              <Button
                                key={`${section.title}-${label}`}
                                type="button"
                                draggable
                                variant="outline"
                                size="sm"
                                className="h-7 min-w-0 px-1.5 text-[11px] justify-start"
                                onClick={() => addPlacedFieldFromPalette(label)}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', label)
                                  e.dataTransfer.setData('text/field-label', label)
                                  e.dataTransfer.effectAllowed = 'copy'
                                  setDraggingPaletteField(label)
                                }}
                                onDragEnd={() =>
                                  requestAnimationFrame(() => setDraggingPaletteField(null))
                                }
                              >
                                <Icon className="mr-1 h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{label}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {(activeFieldGroup === 'custom' ? customFields : dataVerificationFields).map((field) => (
                        <Button
                          key={field}
                          type="button"
                          draggable
                          variant="outline"
                          size="sm"
                          className="h-7 min-w-0 px-1.5 text-[11px] justify-start"
                          onClick={() => addPlacedFieldFromPalette(field)}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', field)
                            e.dataTransfer.setData('text/field-label', field)
                            e.dataTransfer.effectAllowed = 'copy'
                            setDraggingPaletteField(field)
                          }}
                          onDragEnd={() =>
                            requestAnimationFrame(() => setDraggingPaletteField(null))
                          }
                        >
                          <span className="truncate">{field}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </aside>

              <div className="flex min-h-0 flex-col gap-2">
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoomPct((z) => Math.max(50, z - 10))}>
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <span className="tabular-nums w-12 text-center">{zoomPct}%</span>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoomPct((z) => Math.min(200, z + 10))}>
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setZoomPct(100)}>
                      Reset
                    </Button>
                  </div>
                  <div className="text-muted-foreground">{mappedCount} mapped field{mappedCount === 1 ? '' : 's'}</div>
                </div>
                <div
                  ref={pdfScrollRef}
                  className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-md border border-border bg-muted/20 p-2"
                >
                  <div
                    ref={pdfCanvasRef}
                    data-pdf-canvas
                    className={cn(
                      'relative z-0 inline-block min-w-full origin-top isolate',
                      draggingPaletteField ? 'ring-2 ring-dashed ring-primary/60' : '',
                    )}
                    style={{ transform: `scale(${zoomPct / 100})`, transformOrigin: 'top center' }}
                    onDragOver={handlePaletteDragOverPdf}
                    onDrop={handlePaletteDropOnPdf}
                  >
                    <iframe
                      title={viewerFile.fileName}
                      src={viewerFile.previewUrl}
                      className="relative z-0 block h-[min(75vh,56rem)] w-full min-h-[24rem] bg-white"
                    />
                    {draggingPaletteField ? (
                      <div
                        className="absolute inset-0 z-[6] bg-transparent"
                        aria-hidden
                        onDragOver={handlePaletteDragOverPdf}
                        onDrop={handlePaletteDropOnPdf}
                      />
                    ) : null}
                    {activeFieldOptionsId ? (
                      <div
                        className="pointer-events-auto absolute inset-0 z-[90] cursor-default"
                        aria-hidden
                        onPointerDown={() => setActiveFieldOptionsId(null)}
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 z-[100] [transform:translateZ(0)]">
                      {(placedFieldsByFile[viewerFile.id] ?? []).map((field) => {
                        const signer = local.signers.find((s) => s.id === field.signerId)
                        const signerName = signer?.name || 'Signer'
                        const initials = signerInitials(signerName)
                        const isOptionsOpen = activeFieldOptionsId === field.id
                        return (
                          <div
                            key={field.id}
                            data-placed-field-root
                            className="pointer-events-auto absolute inline-flex max-w-[min(96vw,28rem)] flex-col items-start gap-1 overflow-visible"
                            style={{ left: `${field.xPct}%`, top: `${field.yPct}%` }}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              data-placed-field-box
                              className={cn(
                                'w-max max-w-[14rem] rounded border-2 bg-sky-100 px-2 py-1.5 text-left text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-primary/40 transition-colors dark:bg-sky-950/90 dark:text-sky-50',
                                isOptionsOpen
                                  ? 'border-primary ring-2 ring-primary/40'
                                  : 'border-primary hover:bg-sky-200/90 dark:hover:bg-sky-900',
                              )}
                              onPointerDown={(e) => startFieldDrag(field.id, e)}
                              onClick={() => handlePlacedFieldClick(field.id)}
                            >
                              {field.label}
                            </button>
                            {isOptionsOpen ? (
                              <div
                                data-field-toolbar
                                className="pointer-events-auto mt-0 flex w-max max-w-none shrink-0 flex-nowrap items-center gap-0.5 rounded-md border border-border bg-card py-0.5 pl-1 pr-1.5 shadow-md"
                                onPointerDown={(e) => e.stopPropagation()}
                              >
                                <Select
                                  value={field.signerId || local.signers[0]?.id}
                                  onValueChange={(v) => updatePlacedFieldSigner(field.id, v)}
                                >
                                  <SelectTrigger
                                    className={cn(
                                      'h-8 min-h-8 min-w-[10rem] max-w-[11rem] shrink-0 gap-1.5 border-0 bg-muted/50 py-0 pl-2 pr-1 text-[10px] shadow-none focus:ring-0',
                                      '[&>span]:line-clamp-1 [&>span]:flex [&>span]:min-h-0 [&>span]:min-w-0 [&>span]:flex-1 [&>span]:items-center [&>span]:gap-1.5 [&>span]:overflow-hidden',
                                      '[&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0 [&>svg]:opacity-70',
                                    )}
                                    onPointerDown={(e) => e.stopPropagation()}
                                  >
                                    <span className="flex min-h-0 min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-hidden">
                                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-semibold leading-none text-primary">
                                        {initials}
                                      </span>
                                      <span className="min-w-0 flex-1 truncate text-left text-[10px] font-medium leading-tight text-foreground">
                                        {signerName || 'Signer'}
                                      </span>
                                    </span>
                                  </SelectTrigger>
                                  <SelectContent className="z-[10050]">
                                    {local.signers.map((s) => (
                                      <SelectItem key={s.id} value={s.id} className="text-xs">
                                        {s.name || 'Account owner'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="mx-0.5 h-4 w-px shrink-0 bg-border" />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  aria-label="Duplicate field"
                                  onClick={() => duplicatePlacedField(field.id)}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                  aria-label="Remove field"
                                  onClick={() => deletePlacedField(field.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  aria-label="Field settings"
                                >
                                  <Settings className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
                  Add fields from the left panel. Name appears as <span className="text-foreground">Full Name</span> on the
                  document. Click anywhere on the PDF (outside the field and its options bar) to hide the options bar.
                </div>
              </div>

              <aside className="flex min-h-0 max-h-full flex-col overflow-hidden rounded-md border border-border bg-card">
                <div className="flex shrink-0 items-center justify-between border-b border-border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documents</p>
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain p-3">
                  {pdfUploads.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`w-full rounded border px-2 py-1.5 text-left text-xs transition-colors ${
                        f.id === viewerFile.id
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border hover:bg-muted/40 text-muted-foreground'
                      }`}
                      onClick={() => {
                        setViewerFileId(f.id)
                        setActiveFieldOptionsId(null)
                      }}
                    >
                      <p className="truncate">{f.fileName}</p>
                      <p className="text-[10px] mt-0.5">
                        {(placedFieldsByFile[f.id] ?? []).length} mapped field
                        {(placedFieldsByFile[f.id] ?? []).length === 1 ? '' : 's'}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="shrink-0 border-t border-border p-3">
                  <a
                    href="http://support.docusign.com/s/document-item?language=en_US&rsc_301&bundleId=ulp1643236876813&topicId=odn1578456409392.html&_LANG=enus"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    DocuSign field placement reference
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </aside>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              PDF preview is not available for this file in the current session.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
