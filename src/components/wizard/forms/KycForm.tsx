import { useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle2, ShieldAlert, ArrowLeft, ChevronRight, Info } from 'lucide-react'

export function KycForm() {
  const { state, dispatch } = useWorkflow()
  const kycTask = state.tasks.find((t) => t.formKey === 'kyc')
  const children = kycTask?.children ?? []

  const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member' && !p.isHidden)
  const verifiedMembers = householdMembers.filter((m) => m.kycStatus === 'verified')
  const needsKycMembers = householdMembers.filter((m) => m.kycStatus !== 'verified')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(needsKycMembers.map((m) => m.id))
  )
  const [showConfirmation, setShowConfirmation] = useState(false)

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedMembers = needsKycMembers.filter((m) => selectedIds.has(m.id))

  const handleConfirm = () => {
    for (const member of selectedMembers) {
      dispatch({
        type: 'SPAWN_KYC_CHILD',
        parentTaskId: kycTask!.id,
        childName: member.name,
      })
    }
    setShowConfirmation(false)
  }

  const hasChildren = children.length > 0
  const allVerified = needsKycMembers.length === 0

  // Phase 2: Post-spawn status dashboard
  if (hasChildren) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Handed off to compliance
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                The compliance team will review and complete KYC for the members listed below.
                There's nothing more you need to do on this step — continue to the next task whenever you're ready.
              </p>
            </div>
          </div>
        </div>

        {verifiedMembers.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Previously Verified
            </h3>
            {verifiedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">{member.name}</span>
                    {member.relationship && (
                      <span className="ml-2 text-xs text-muted-foreground/70">{member.relationship}</span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs text-green-700 bg-green-100">
                  Verified
                </Badge>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pending Verification
          </h3>
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TASK', taskId: `${child.id}-info` })}
              className="w-full flex items-center justify-between rounded-lg border border-border p-3 text-left cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {child.name[0]}
                </div>
                <span className="text-sm font-medium">{child.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize text-xs">
                  {child.status.replace('_', ' ')}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Phase 1, Confirmation view
  if (showConfirmation) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 dark:border-amber-700 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100">
                Confirm Identity Verification
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                You are about to initiate identity verification (KYC) for the following
                individuals. This will trigger a background check through our verification
                provider. <strong>This action cannot be undone.</strong>
              </p>
              <ul className="space-y-1 pl-1">
                {selectedMembers.map((member) => (
                  <li key={member.id} className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                    {member.name}
                    {member.relationship && (
                      <span className="text-amber-700/70 dark:text-amber-300/70">({member.relationship})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowConfirmation(false)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Go Back
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Confirm & Run KYC
          </Button>
        </div>
      </div>
    )
  }

  // Phase 1: Review & Select
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review household members and select who requires identity verification.
      </p>

      {verifiedMembers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Already Verified
          </h3>
          {verifiedMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">{member.name}</span>
                  {member.relationship && (
                    <span className="ml-2 text-xs text-muted-foreground/70">{member.relationship}</span>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs text-green-700 bg-green-100">
                Verified
              </Badge>
            </div>
          ))}
        </div>
      )}

      {allVerified ? (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-600" />
          <p className="text-sm font-medium">All household members have been previously verified.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No KYC action is required for this household. You may proceed to the next step.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Requires Verification
            </h3>
            {needsKycMembers.map((member) => (
              <label
                key={member.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedIds.has(member.id)}
                    onCheckedChange={() => toggleMember(member.id)}
                  />
                  <div>
                    <span className="text-sm font-medium">{member.name}</span>
                    {member.relationship && (
                      <span className="ml-2 text-xs text-muted-foreground">{member.relationship}</span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <Button
            onClick={() => setShowConfirmation(true)}
            disabled={selectedMembers.length === 0}
          >
            Initiate KYC for {selectedMembers.length} {selectedMembers.length === 1 ? 'Member' : 'Members'}
          </Button>
        </>
      )}
    </div>
  )
}
