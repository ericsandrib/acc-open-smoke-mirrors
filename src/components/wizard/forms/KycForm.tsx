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
  const kycTask = state.tasks.find((t) => t.formKey === 'kyc')
  const children = kycTask?.children ?? []

  const allHouseholdMembers = state.relatedParties.filter(
    (p) => p.type === 'household_member' && !p.isHidden,
  )
  const householdMembers = allHouseholdMembers.filter((m) => !m.kycDirectAdd)
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [timelineChild, setTimelineChild] = useState<ChildTask | null>(null)
  const pendingKycPartyId = useRef<string | null>(null)

  useEffect(() => {
    if (!pendingKycPartyId.current || !kycTask) return
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
      parentTaskId: kycTask.id,
      childName: party.name,
      childType: 'kyc',
    })
  }, [state.relatedParties, kycTask, dispatch])

  const handleContactAdded = useCallback((partyId: string) => {
    pendingKycPartyId.current = partyId
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
                                parentTaskId: kycTask!.id,
                                childName: member.name,
                                childType: 'kyc',
                              })
                            }
                          >
                            <Play className="h-3 w-3" />
                            Start KYC
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
          Contacts for Verification
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
                    onDelete={() => dispatch({ type: 'REMOVE_CHILD', parentTaskId: kycTask!.id, childId: child.id })}
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
                No contacts to verify yet. Use "Start KYC" above or add a new contact.
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
        description="Search for an existing person or entity, or create a new contact to add for KYC/KYB verification."
      />

      <ChildActionTimelineSheet
        open={!!timelineChild}
        onOpenChange={(o) => { if (!o) setTimelineChild(null) }}
        child={timelineChild}
      />
    </div>
  )
}
