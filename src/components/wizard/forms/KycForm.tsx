import { useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ShieldCheck, Clock, UserPlus, User } from 'lucide-react'
import { AddHouseholdMemberSheet } from './AddPartySheet'
import { ChildActionKebabMenu } from '@/components/wizard/ChildActionKebabMenu'
import { ChildActionTimelineSheet } from '@/components/wizard/ChildActionTimelineSheet'
import { childStatusConfig, deriveChildDisplayStatus } from '@/utils/childStatusDisplay'
import type { ChildTask } from '@/types/workflow'

export function KycForm() {
  const { state, dispatch } = useWorkflow()
  const kycTask = state.tasks.find((t) => t.formKey === 'kyc')
  const children = kycTask?.children ?? []

  const householdMembers = state.relatedParties.filter(
    (p) => p.type === 'household_member' && !p.isHidden,
  )
  const verifiedMembers = householdMembers.filter((m) => m.kycStatus === 'verified')
  const spawnedNames = new Set(children.map((c) => c.name))
  const needsKycMembers = householdMembers.filter(
    (m) => m.kycStatus !== 'verified' && !spawnedNames.has(m.name),
  )

  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [timelineChild, setTimelineChild] = useState<ChildTask | null>(null)

  const allDone = needsKycMembers.length === 0 && children.length === 0

  return (
    <div className="space-y-6">
      {verifiedMembers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-semibold">
            Previously Verified
          </h3>
          <div className="space-y-1">
            {verifiedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fill-success-tertiary text-text-success-primary shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {member.name}
                  </span>
                  {member.relationship && (
                    <span className="text-xs text-muted-foreground/70">
                      {member.relationship}
                    </span>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs text-text-success-primary bg-fill-success-tertiary"
                >
                  Verified
                </Badge>
              </div>
            ))}
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

        {(children.length > 0 || needsKycMembers.length > 0) ? (
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

            {needsKycMembers.map((member) => (
              <div
                key={member.id}
                className="group flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: 'SPAWN_AND_ENTER_CHILD',
                      parentTaskId: kycTask!.id,
                      childName: member.name,
                      childType: 'kyc',
                    })
                  }
                  className="flex-1 flex items-center gap-3 text-left cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                    {member.name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{member.name}</span>
                  {member.relationship && (
                    <span className="text-xs text-muted-foreground">
                      {member.relationship}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className="text-[10px] text-text-warning-primary border-border-warning-primary group-hover:hidden"
                  >
                    Not started
                  </Badge>
                  <div className="hidden group-hover:block">
                    <ChildActionKebabMenu
                      onViewDetails={() =>
                        setTimelineChild({
                          id: member.id,
                          name: member.name,
                          status: 'not_started',
                          formKey: 'kyc',
                          childType: 'kyc',
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button variant="ghost" className="w-full" onClick={() => setAddSheetOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add contact
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border p-1">
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <ShieldCheck className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No Contacts Pending</p>
              <p className="mt-1 text-xs text-muted-foreground">
                All contacts have been verified. Add a contact if additional verification is needed.
              </p>
              <Button className="mt-4" onClick={() => setAddSheetOpen(true)}>
                Add Contact
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddHouseholdMemberSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
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
