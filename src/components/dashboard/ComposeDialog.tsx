import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  RemoveFormatting,
  Link as LinkIcon,
  List,
  ListOrdered,
  CalendarClock,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useWorkflow } from '@/stores/workflowStore'
import { useServicing } from '@/stores/servicingStore'
import { relationships } from '@/data/relationships'
import { useOpenAccountsVariantControls } from '@/components/wizard/openAccountsVariantContext'

interface ComposeDialogProps {
  onClose: () => void
}

const JOURNEY_COMPOSE_DRAFT_KEY = 'journey-compose-draft'

// Actions offered in the "Select an Action" picker. "Client Onboarding" is the
// only journey we are building right now — add more entries here as they come online.
const actionOptions = [
  { value: 'client-onboarding', label: 'Client Onboarding' },
]

const MAX_RELATIONSHIPS = 10
const MAX_NICKNAME = 50

function RequiredMark() {
  return <span className="text-destructive ml-0.5" aria-hidden>*</span>
}

// ---------------------------------------------------------------------------
// Context rich-text field — toolbar + contentEditable (matches agent portal)
// ---------------------------------------------------------------------------

function RichTextField({
  onChangeEmpty,
}: {
  onChangeEmpty: (empty: boolean) => void
}) {
  const editorRef = useRef<HTMLDivElement>(null)

  function exec(command: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    handleInput()
  }

  function handleInput() {
    const text = editorRef.current?.textContent ?? ''
    onChangeEmpty(text.trim().length === 0)
  }

  const tools: { icon: typeof Bold; label: string; run: () => void }[] = [
    { icon: Bold, label: 'Bold', run: () => exec('bold') },
    { icon: Italic, label: 'Italic', run: () => exec('italic') },
    { icon: Underline, label: 'Underline', run: () => exec('underline') },
    { icon: Strikethrough, label: 'Strikethrough', run: () => exec('strikeThrough') },
    { icon: RemoveFormatting, label: 'Clear formatting', run: () => exec('removeFormat') },
    {
      icon: LinkIcon,
      label: 'Insert link',
      run: () => {
        const url = window.prompt('Enter a URL')
        if (url) exec('createLink', url)
      },
    },
    { icon: List, label: 'Bullet list', run: () => exec('insertUnorderedList') },
    { icon: ListOrdered, label: 'Numbered list', run: () => exec('insertOrderedList') },
  ]

  return (
    <div className="rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0">
      <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5">
        {tools.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              t.run()
            }}
            aria-label={t.label}
            title={t.label}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground',
              i === 4 && 'mr-1',
            )}
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        onInput={handleInput}
        data-placeholder="Provide contextual details about this action."
        className="compose-context-editor min-h-[88px] w-full px-3 py-2 text-sm leading-relaxed text-foreground outline-none [&_a]:text-primary [&_a]:underline"
        suppressContentEditableWarning
      />
    </div>
  )
}

export function ComposeDialog({ onClose }: ComposeDialogProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Step state
  const [action, setAction] = useState('')
  const [relationshipIds, setRelationshipIds] = useState<string[]>([])
  const [relSelectValue, setRelSelectValue] = useState('')
  const [nickname, setNickname] = useState('')
  const [contextEmpty, setContextEmpty] = useState(true)
  const [createMore, setCreateMore] = useState(false)

  // Right-panel action configuration (preserved from prior flow)
  const [openMultipleAccounts, setOpenMultipleAccounts] = useState<'yes' | 'no' | ''>('')
  const [openAnnuityAccount, setOpenAnnuityAccount] = useState<'yes' | 'no' | ''>('')

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const { dispatch } = useWorkflow()
  const { variant: wizardOpenAccountsVariant } = useOpenAccountsVariantControls()
  const hideActionSettings = wizardOpenAccountsVariant === 'v6'
  const { currentLiveJourney, saveCurrentJourney } = useServicing()
  const location = useLocation()
  const navigate = useNavigate()

  const selectedActionLabel = useMemo(
    () => actionOptions.find((a) => a.value === action)?.label ?? '',
    [action],
  )

  // Relationship options minus the ones already added.
  const relationshipOptions = useMemo(
    () =>
      relationships
        .filter((r) => !relationshipIds.includes(r.id))
        .map((r) => ({ value: r.id, label: r.name })),
    [relationshipIds],
  )

  const selectedRelationships = useMemo(
    () => relationshipIds.map((id) => relationships.find((r) => r.id === id)).filter(Boolean),
    [relationshipIds],
  )

  const hasRelationship = relationshipIds.length > 0
  const canSubmit = action !== '' && hasRelationship && !contextEmpty

  function addRelationship(id: string) {
    if (!id) return
    setRelationshipIds((prev) => {
      if (prev.includes(id) || prev.length >= MAX_RELATIONSHIPS) return prev
      return [...prev, id]
    })
    setRelSelectValue('')
  }

  function removeRelationship(id: string) {
    setRelationshipIds((prev) => prev.filter((x) => x !== id))
  }

  function resetForm() {
    setAction('')
    setRelationshipIds([])
    setRelSelectValue('')
    setNickname('')
    setContextEmpty(true)
    setOpenMultipleAccounts('')
    setOpenAnnuityAccount('')
    setCreateMore(false)
  }

  function changeAction() {
    setAction('')
  }

  function handleSnooze() {
    toast.message('Snooze scheduled (demo)', {
      description: 'You would pick a date and time in a full workflow.',
    })
  }

  function handleRecommend() {
    toast.success('Recommendation recorded (demo)')
  }

  function handleSaveDraft() {
    const draft = {
      action,
      relationshipIds,
      nickname,
      openMultipleAccounts,
      openAnnuityAccount,
      createMore,
      savedAt: new Date().toISOString(),
    }
    try {
      sessionStorage.setItem(JOURNEY_COMPOSE_DRAFT_KEY, JSON.stringify(draft))
      toast.success('Draft saved')
    } catch {
      toast.error('Could not save draft')
    }
  }

  function handleCreateAction() {
    const relationship = relationships.find((r) => r.id === relationshipIds[0])
    if (!relationship) return

    if (currentLiveJourney) {
      saveCurrentJourney(currentLiveJourney)
    }

    const name = nickname || selectedActionLabel || 'Client Onboarding'
    const newJourneyId = `journey-${Date.now()}`

    dispatch({
      type: 'INITIALIZE_FROM_RELATIONSHIP',
      relatedParties: relationship.relatedParties,
      financialAccounts: relationship.financialAccounts,
      clientInfo: {
        firstName: relationship.primaryContact.firstName,
        lastName: relationship.primaryContact.lastName,
        email: relationship.primaryContact.email,
        phone: relationship.primaryContact.phone,
        dob: relationship.primaryContact.dob ?? '',
        clientType: relationship.primaryContact.clientType ?? '',
      },
      journeyName: name,
      journeyId: newJourneyId,
      assignedTo: undefined,
      journeyOnboardingConfig: {
        office: '',
        investmentProfessionalId: '',
        // Account-config questions were removed from this module (not in Guardian).
        // Preserve prior defaults: v6 opens multiple + annuity, otherwise neither.
        openMultipleAccounts: hideActionSettings,
        openAnnuityAccount: hideActionSettings,
      },
    })
    toast.success(`Journey "${name}" created for ${relationship.name}`)

    if (createMore) {
      resetForm()
      toast.message('Add another journey, or close when you are done.')
      return
    }

    navigate(`/servicing/${newJourneyId}`, { state: { collapseMainNav: true } })
  }

  // Kept for parity with prior flow.
  void location

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 transition-opacity duration-250"
        style={{ backgroundColor: visible ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)' }}
        onClick={handleClose}
      />

      {/* Full modal */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[1180px] flex-col bg-card shadow-2xl transition-transform duration-300 ease-out"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
        role="dialog"
        aria-label="Create a Journey"
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Create a Journey</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {action === '' ? (
          /* ---------------- Step 1: choose an action ---------------- */
          <div className="flex flex-1 flex-col items-center px-6 pt-20">
            <ActionJourneyIcon />
            <div className="mt-6 mb-2 flex flex-col gap-1 text-center">
              <p className="text-base font-medium text-foreground">
                Create a New Action or Journey
              </p>
              <p className="text-sm text-muted-foreground">
                Select or Search for a New Action from the List Below
              </p>
            </div>
            <div className="mt-4 w-full max-w-2xl">
              <Combobox
                options={actionOptions}
                value={action}
                onValueChange={setAction}
                placeholder="Select an Action"
                emptyMessage="No actions found."
              />
            </div>
          </div>
        ) : (
          /* ---------------- Step 2: action form ---------------- */
          <div className="flex flex-1 overflow-hidden">
            {/* Left column — form */}
            <div className="w-[400px] shrink-0 overflow-y-auto border-r border-border px-6 py-6">
              <div className="mb-6">
                <h3 className="text-base font-semibold text-foreground">{selectedActionLabel}</h3>
                <button
                  type="button"
                  onClick={changeAction}
                  className="mt-0.5 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Change journey
                </button>
              </div>

              {/* Search your Relationships */}
              <div className="space-y-2">
                <Label>
                  Search your Relationships...
                  <RequiredMark />
                </Label>
                <Combobox
                  options={relationshipOptions}
                  value={relSelectValue}
                  onValueChange={addRelationship}
                  placeholder="Search"
                  emptyMessage="No relationships found."
                  disabled={relationshipIds.length >= MAX_RELATIONSHIPS}
                />
                <p className="text-xs text-muted-foreground">Add up to 10 Relationships</p>
                {selectedRelationships.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedRelationships.map((r) => (
                      <span
                        key={r!.id}
                        className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs text-foreground"
                      >
                        {r!.name}
                        <button
                          type="button"
                          onClick={() => removeRelationship(r!.id)}
                          aria-label={`Remove ${r!.name}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Nickname */}
              <div className="mt-5 space-y-2">
                <Label htmlFor="action-nickname">Nickname</Label>
                <Input
                  id="action-nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, MAX_NICKNAME))}
                  placeholder="Action Nickname"
                  maxLength={MAX_NICKNAME}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {nickname.length}/{MAX_NICKNAME}
                </p>
              </div>

              {/* Context */}
              <div className="mt-3 space-y-2">
                <Label>
                  Context
                  <RequiredMark />
                </Label>
                <RichTextField onChangeEmpty={setContextEmpty} />
              </div>

              {/* Snooze + Recommend + Prefill with AI */}
              <div className="mt-6 flex flex-col items-start gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2 bg-muted text-foreground hover:bg-muted/80"
                  onClick={handleSnooze}
                >
                  <CalendarClock className="h-4 w-4 opacity-70" />
                  Snooze Until Later...
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2 bg-muted text-foreground hover:bg-muted/80"
                    onClick={handleRecommend}
                  >
                    <Sparkles className="h-4 w-4 opacity-70" />
                    Recommend
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled
                    className="gap-2 bg-muted text-foreground hover:bg-muted/80"
                  >
                    <Wand2 className="h-4 w-4 opacity-70" />
                    Prefill with AI
                  </Button>
                </div>
              </div>
            </div>

            {/* Right column — journey configuration (intentionally empty, matches Guardian) */}
            <div className="flex flex-1 flex-col px-6 py-6">
              <h3 className="text-base font-semibold text-foreground">Configure the Journey</h3>
            </div>
          </div>
        )}

        {/* Footer — only in the form step */}
        {action !== '' && (
          <div className="shrink-0 border-t border-border">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <div className="flex flex-wrap items-center justify-end gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Switch
                    checked={createMore}
                    onCheckedChange={setCreateMore}
                    aria-label="Create More"
                  />
                  Create More
                </label>
                <Button type="button" variant="outline" onClick={handleSaveDraft}>
                  Save as Draft...
                </Button>
                <Button type="button" onClick={handleCreateAction} disabled={!canSubmit}>
                  Create Journey
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Right-panel yes/no config toggle
// ---------------------------------------------------------------------------

function ConfigToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: 'yes' | 'no' | ''
  onChange: (v: 'yes' | 'no' | '') => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-4">
        {(['yes', 'no'] as const).map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 text-sm capitalize">
            <Checkbox
              checked={value === opt}
              onCheckedChange={(c) => onChange(c ? opt : '')}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Action/Journey empty-state icon (two overlapping cards)
// ---------------------------------------------------------------------------

function ActionJourneyIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden>
      <rect
        x="12"
        y="18"
        width="34"
        height="40"
        rx="5"
        transform="rotate(-8 12 18)"
        fill="#F3F4F6"
        stroke="#D1D5DB"
        strokeWidth="1.5"
      />
      <rect
        x="28"
        y="14"
        width="34"
        height="40"
        rx="5"
        transform="rotate(6 28 14)"
        fill="#F9FAFB"
        stroke="#D1D5DB"
        strokeWidth="1.5"
      />
      <g stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="40" cy="28" r="2.5" fill="#9CA3AF" />
        <circle cx="52" cy="40" r="2.5" fill="#9CA3AF" />
        <path d="M42 30l8 8" />
      </g>
    </svg>
  )
}
