import { useState, useCallback, useRef, useEffect } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ShieldCheck, Clock, UserPlus, AlertTriangle, Play } from 'lucide-react'
import { AddHouseholdMemberSheet } from './AddPartySheet'
import { ChildActionKebabMenu } from '@/components/wizard/ChildActionKebabMenu'
import { ChildActionTimelineSheet } from '@/components/wizard/ChildActionTimelineSheet'
import { childStatusConfig, deriveChildDisplayStatus } from '@/utils/childStatusDisplay'
import type { ChildTask } from '@/types/workflow'

export function KycForm() {
  const { state, dispatch } = useWorkflow()
  /** Default onboarding has no standalone KYC task — spawn/list under Open Accounts like `OpenAccountsForm`. */
  const openAccountsTask = state.tasks.find((t) => t.formKey === 'open-accounts')
  const kycParentTask = state.tasks.find((t) => t.formKey === 'kyc') ?? openAccountsTask
  const children = kycParentTask?.children?.filter((c) => c.childType === 'kyc') ?? []

  const allHouseholdMembers = state.relatedParties.filter(
    (p) =>
      !p.isHidden &&
      (p.type === 'household_member' || p.type === 'related_organization'),
  )
  const householdMembers = allHouseholdMembers.filter((m) => !m.kycDirectAdd)
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [timelineChild, setTimelineChild] = useState<ChildTask | null>(null)
  const pendingKycPartyId = useRef<string | null>(null)
  /** Bumps when add-contact completes so the effect runs even if `relatedParties` is unchanged (e.g. existing org by clientId). */
  const [kycAddContactBump, setKycAddContactBump] = useState(0)

  useEffect(() => {
    if (!pendingKycPartyId.current || !kycParentTask) return
    const partyId = pendingKycPartyId.current
    const party = state.relatedParties.find((p) => p.id === partyId)
    if (!party) return
    pendingKycPartyId.current = null
    dispatch({
      type: 'UPDATE_RELATED_PARTY',
      partyId,
      updates: { kycDirectAdd: true },
    })
    dispatch({
      type: 'SPAWN_CHILD',
      parentTaskId: kycParentTask.id,
      childName:
        party.name?.trim() ||
        party.organizationName?.trim() ||
        (party.type === 'related_organization' ? 'Legal entity' : 'Contact'),
      childType: 'kyc',
      metadata: {
        kycSubjectPartyId: party.id,
        kycSubjectType: party.type === 'related_organization' ? 'entity' : 'individual',
      },
    })
  }, [state.relatedParties, kycParentTask, dispatch, kycAddContactBump])

  /**
   * Auto-spawn Draft KYC child tasks for every adult household member as soon
   * as the KYC parent task exists. Saves the advisor 3-4 clicks per person
   * (Add → Search → Select → Submit) — they can go straight to "Review &
   * Submit" on a row that's already in Draft.
   *
   * Adult heuristic: role !== 'Dependent'. Dependents (e.g. Robert Smith) are
   * skipped so they don't generate a noisy KYC draft they don't need.
   *
   * Already-spawned members are tagged with `kycDirectAdd=true`, which is the
   * same flag the manual Add-contact path sets — so this effect is idempotent
   * across renders and re-mounts.
   */
  useEffect(() => {
    if (!kycParentTask) return
    const candidates = state.relatedParties.filter(
      (p) =>
        !p.isHidden &&
        p.type === 'household_member' &&
        !p.kycDirectAdd &&
        p.role !== 'Dependent',
    )
    if (candidates.length === 0) return
    const existingNames = new Set(children.map((c) => c.name))
    candidates.forEach((party) => {
      if (existingNames.has(party.name)) return
      dispatch({
        type: 'UPDATE_RELATED_PARTY',
        partyId: party.id,
        updates: { kycDirectAdd: true },
      })
      dispatch({
        type: 'SPAWN_CHILD',
        parentTaskId: kycParentTask.id,
        childName: party.name,
        childType: 'kyc',
        metadata: {
          kycSubjectPartyId: party.id,
          kycSubjectType: 'individual',
        },
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kycParentTask?.id, state.relatedParties, dispatch])

  const handleContactAdded = useCallback((partyId: string) => {
    pendingKycPartyId.current = partyId
    setKycAddContactBump((b) => b + 1)
  }, [])

  return (
    <div className="space-y-6">
      {householdMembers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-semibold">KYC Statuses</h3>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Member Name</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Relationship</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-2.5">KYC Status</th>
                </tr>
              </thead>
              <tbody>
                {householdMembers.map((member, idx) => {
                  const matchingChild = children.find((c) => c.name === member.name)
                  const isVerified = member.kycStatus === 'verified' || matchingChild?.status === 'complete'
                  const isPending = !isVerified && (member.kycStatus === 'pending' || matchingChild?.status === 'awaiting_review')
                  const hasChild = !!matchingChild
                  const isNotStarted = !hasChild && !isVerified && !isPending

                  const relationship = member.type === 'related_organization'
                    ? (member.entityType ?? 'Entity')
                    : member.isPrimary ? 'Primary'
                    : member.relationship ?? member.role ?? '—'

                  return (
                    <tr key={member.id} className={cn('border-b border-border last:border-b-0', idx % 2 === 1 && 'bg-muted/20')}>
                      <td className="px-4 py-3 font-medium">{member.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{relationship}</td>
                      <td className="px-4 py-3">
                        {isNotStarted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={() =>
                              dispatch({
                                type: 'SPAWN_CHILD',
                                parentTaskId: kycParentTask!.id,
                                childName: member.name,
                                childType: 'kyc',
                                metadata: {
                                  kycSubjectPartyId: member.id,
                                  kycSubjectType: member.type === 'related_organization' ? 'entity' : 'individual',
                                },
                              })
                            }
                          >
                            <Play className="h-3 w-3" />
                            Start KYC initiation
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {isVerified ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                <span className="text-sm text-emerald-600">Completed</span>
                              </>
                            ) : isPending ? (
                              <>
                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                                <span className="text-sm text-amber-500">Pending Review</span>
                              </>
                            ) : hasChild ? (() => {
                              const displayStatus = deriveChildDisplayStatus(matchingChild!.status)
                              const cfg = childStatusConfig[displayStatus]
                              return (
                                <>
                                  <Clock className="h-4 w-4 shrink-0 text-yellow-600" />
                                  <span className={cn('text-sm', cfg.className)}>{cfg.label}</span>
                                </>
                              )
                            })() : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-base font-semibold">
          KYC Verification
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage contacts who need identity verification (KYC/KYB). Click on a contact to begin or continue their review.
        </p>

        <div className="rounded-lg border border-border p-1">
          {children.map((child) => (
            <div
              key={child.id}
              className="group w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <button
                onClick={() =>
                  dispatch({ type: 'ENTER_CHILD_ACTION', childId: child.id })
                }
                className="flex-1 flex items-center gap-3 text-left cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{child.name}</span>
              </button>
              <div className="flex items-center gap-2">
                {(() => {
                  const displayStatus = deriveChildDisplayStatus(child.status)
                  const cfg = childStatusConfig[displayStatus]
                  return (
                    <Badge
                      variant="outline"
                      className={cn('text-xs group-hover:hidden', cfg.className)}
                    >
                      {cfg.label}
                    </Badge>
                  )
                })()}
                <div className="hidden group-hover:block">
                  <ChildActionKebabMenu
                    onViewDetails={() => setTimelineChild(child)}
                    onDelete={() =>
                      dispatch({ type: 'REMOVE_CHILD', parentTaskId: kycParentTask!.id, childId: child.id })
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {children.length === 0 && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <ShieldCheck className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No contacts to verify yet. Use &ldquo;Start KYC initiation&rdquo; above or add a new contact.
              </p>
              <Button className="mt-4" onClick={() => setAddSheetOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add contact
              </Button>
            </div>
          )}

          {children.length > 0 && (
            <Button variant="ghost" className="w-full" onClick={() => setAddSheetOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add contact
            </Button>
          )}
        </div>
      </div>

      <AddHouseholdMemberSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        onPartyAdded={handleContactAdded}
        title="Add contact for verification"
        description="Search for an existing individual or legal entity, or create a new record. The form matches the type you select."
        includeLegalEntityCreate
      />

      <ChildActionTimelineSheet
        open={!!timelineChild}
        onOpenChange={(o) => { if (!o) setTimelineChild(null) }}
        child={timelineChild}
      />
    </div>
  )
}
