import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Clock, MoreHorizontal, ThumbsUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useWorkflow } from '@/stores/workflowStore'
import { useServicing } from '@/stores/servicingStore'
import { relationships } from '@/data/relationships'

interface ComposeDialogProps {
  onClose: () => void
}

const JOURNEY_COMPOSE_DRAFT_KEY = 'journey-compose-draft'

const actionTypes = [
  { value: 'client-onboarding', label: 'Client Onboarding', enabled: true },
  { value: 'portfolio-rebalancing', label: 'Portfolio Rebalancing', enabled: false },
  { value: 'account-transfer', label: 'Account Transfer', enabled: false },
  { value: 'trust-administration', label: 'Trust Administration', enabled: false },
  { value: 'estate-planning', label: 'Estate Planning Review', enabled: false },
  { value: 'tax-loss-harvesting', label: 'Tax Loss Harvesting', enabled: false },
  { value: 'beneficiary-update', label: 'Beneficiary Update', enabled: false },
]

function RequiredMark() {
  return <span className="text-destructive ml-0.5" aria-hidden>*</span>
}

type ComposeDraftFields = {
  journeyName: string
  actionType: string
  relationshipId: string
  openAnnuityAccount: 'yes' | 'no' | ''
  createMore: boolean
}

function loadComposeDraft(): ComposeDraftFields {
  const empty: ComposeDraftFields = {
    journeyName: '',
    actionType: '',
    relationshipId: '',
    openAnnuityAccount: '',
    createMore: false,
  }
  try {
    const raw = sessionStorage.getItem(JOURNEY_COMPOSE_DRAFT_KEY)
    if (!raw) return empty
    const d = JSON.parse(raw) as Record<string, unknown>
    return {
      journeyName: typeof d.journeyName === 'string' ? d.journeyName : '',
      actionType: typeof d.actionType === 'string' ? d.actionType : '',
      relationshipId: typeof d.relationshipId === 'string' ? d.relationshipId : '',
      openAnnuityAccount:
        d.openAnnuityAccount === 'yes' || d.openAnnuityAccount === 'no' || d.openAnnuityAccount === ''
          ? d.openAnnuityAccount
          : '',
      createMore: typeof d.createMore === 'boolean' ? d.createMore : false,
    }
  } catch {
    return empty
  }
}

export function ComposeDialog({ onClose }: ComposeDialogProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const draftInitial = useMemo(() => loadComposeDraft(), [])
  const [journeyName, setJourneyName] = useState(draftInitial.journeyName)
  const [actionType, setActionType] = useState(draftInitial.actionType)
  const [relationshipId, setRelationshipId] = useState(draftInitial.relationshipId)
  // Annuity question removed from the UX so advisors aren't forced to commit
  // before they need to. The INITIALIZE_FROM_RELATIONSHIP dispatch always
  // sends openAnnuityAccount: false; advisors can add an annuity registration
  // later from inside Open Accounts.
  const [createMore, setCreateMore] = useState(draftInitial.createMore)

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const { dispatch } = useWorkflow()
  const { currentLiveJourney, saveCurrentJourney } = useServicing()
  const location = useLocation()
  const navigate = useNavigate()

  const actionTypeOptions = useMemo(
    () =>
      actionTypes.map((action) => ({
        value: action.value,
        label: action.enabled ? action.label : `${action.label} (Coming soon)`,
      })),
    [],
  )
  const actionTypeByValue = useMemo(
    () => new Map(actionTypes.map((action) => [action.value, action])),
    [],
  )

  const canSubmit = actionType === 'client-onboarding' && relationshipId !== ''

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
      journeyName,
      actionType,
      relationshipId,
      // Annuity question removed; persist '' so legacy drafts are still
      // readable by `loadComposeDraft`.
      openAnnuityAccount: '' as const,
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

  function handleStart() {
    const relationship = relationships.find((r) => r.id === relationshipId)
    if (!relationship) return

    if (currentLiveJourney) {
      saveCurrentJourney(currentLiveJourney)
    }

    const name = journeyName || 'Client Onboarding'
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
        openAnnuityAccount: false,
      },
    })
    toast.success(`Journey "${name}" created for ${relationship.name}`)

    if (createMore) {
      setJourneyName('')
      setActionType('')
      setRelationshipId('')
      setCreateMore(false)
      toast.message('Add another journey, or close when you are done.')
      return
    }

    const inServicingView = location.pathname.startsWith('/onboarding') || location.pathname.startsWith('/servicing')
    navigate(
      inServicingView ? `/servicing/${newJourneyId}` : '/wizard',
      inServicingView ? undefined : { state: { collapseMainNav: true } },
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 transition-opacity duration-250"
        style={{ backgroundColor: visible ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)' }}
        onClick={handleClose}
      />

      {/* Slide-out panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-[520px] max-w-[calc(100vw-1rem)] flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">New journey</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select the relationship and action type, then complete any settings that appear for that action before you
              start.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body — stacked sections */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-2xl space-y-8">
            {/* Journey details */}
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Journey details</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Label this journey, choose the action, and select the client relationship.
                </p>
              </div>
              <div className="space-y-4 rounded-xl border border-border bg-background/80 p-4 shadow-sm sm:p-5">
                <div className="space-y-2">
                  <Label htmlFor="journey-name">Journey name</Label>
                  <Input
                    id="journey-name"
                    value={journeyName}
                    onChange={(e) => setJourneyName(e.target.value)}
                    placeholder="e.g. Smith Family Onboarding"
                    maxLength={80}
                  />
                  <p className="text-[11px] text-muted-foreground">Optional — defaults to &ldquo;Client Onboarding&rdquo; if empty.</p>
                </div>

                <div className="space-y-2">
                  <Label>
                    Action type
                    <RequiredMark />
                  </Label>
                  <Combobox
                    options={actionTypeOptions}
                    value={actionType}
                    onValueChange={(next) => {
                      const action = actionTypeByValue.get(next)
                      if (!action?.enabled) {
                        toast.message('This action type is coming soon.')
                        return
                      }
                      setActionType(next)
                    }}
                    placeholder="Search action type..."
                    emptyMessage="No action types found."
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Relationship
                    <RequiredMark />
                  </Label>
                  <Combobox
                    options={relationships.map((r) => ({ value: r.id, label: r.name }))}
                    value={relationshipId}
                    onValueChange={setRelationshipId}
                    placeholder="Search relationship..."
                    emptyMessage="No relationships found."
                  />
                </div>
              </div>
            </section>

            {actionType === '' && (
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Action settings</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Fields here depend on the action type.
                  </p>
                </div>
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  Select an action type to see which settings apply.
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer — Cancel + More options (icon menu) + Start */}
        <div className="shrink-0 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6} className="z-[120] w-48">
                  <DropdownMenuItem onSelect={() => handleSnooze()}>
                    <Clock className="mr-2 h-4 w-4 opacity-70" />
                    Snooze
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleRecommend()}>
                    <ThumbsUp className="mr-2 h-4 w-4 opacity-70" />
                    Recommend
                  </DropdownMenuItem>
                  <div className="my-1 h-px bg-border" role="separator" />
                  <DropdownMenuItem onSelect={() => handleSaveDraft()}>Save draft</DropdownMenuItem>
                  <div className="my-1 h-px bg-border" role="separator" />
                  <DropdownMenuItem
                    disabled={createMore}
                    onSelect={() => {
                      setCreateMore(true)
                      toast.message('After you start, this form will stay open for another journey.')
                    }}
                  >
                    Create more
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button type="button" onClick={handleStart} disabled={!canSubmit}>
                Start
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
