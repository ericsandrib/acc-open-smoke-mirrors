import { useState, useEffect, useRef } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle2, ShieldAlert, ShieldCheck, Clock, UserPlus } from 'lucide-react'
import { AddHouseholdMemberSheet } from './AddPartySheet'
import { ChildActionKebabMenu } from '@/components/wizard/ChildActionKebabMenu'
import { ChildActionTimelineSheet } from '@/components/wizard/ChildActionTimelineSheet'
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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(needsKycMembers.map((m) => m.id)),
  )
  const prevMemberIdsRef = useRef<Set<string>>(new Set(needsKycMembers.map((m) => m.id)))

  useEffect(() => {
    const currentIds = new Set(needsKycMembers.map((m) => m.id))
    const newIds = [...currentIds].filter((id) => !prevMemberIdsRef.current.has(id))
    if (newIds.length > 0) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const id of newIds) next.add(id)
        return next
      })
    }
    prevMemberIdsRef.current = currentIds
  }, [needsKycMembers])

  const [showBatchConfirm, setShowBatchConfirm] = useState(false)
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [timelineChild, setTimelineChild] = useState<ChildTask | null>(null)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === needsKycMembers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(needsKycMembers.map((m) => m.id)))
    }
  }

  const selectedMembers = needsKycMembers.filter((m) => selectedIds.has(m.id))

  const handleBatchKyc = () => {
    if (!kycTask || selectedIds.size === 0) return
    for (const id of selectedIds) {
      const member = needsKycMembers.find((m) => m.id === id)
      if (!member) continue
      dispatch({
        type: 'SPAWN_CHILD',
        parentTaskId: kycTask.id,
        childName: member.name,
        childType: 'kyc',
      })
    }
    setSelectedIds(new Set())
    setShowBatchConfirm(false)
  }

  const allDone = needsKycMembers.length === 0 && children.length === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="outline" onClick={() => setAddSheetOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Individuals
        </Button>
      </div>

      {verifiedMembers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            Previously Verified
          </h3>
          {verifiedMembers.map((member) => {
            const matchingChild = children.find((c) => c.name === member.name)
            return (
              <div
                key={member.id}
                className="group flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (matchingChild) {
                      dispatch({ type: 'ENTER_CHILD_ACTION', childId: matchingChild.id })
                    } else {
                      dispatch({
                        type: 'SPAWN_AND_ENTER_CHILD',
                        parentTaskId: kycTask!.id,
                        childName: member.name,
                        childType: 'kyc',
                      })
                    }
                  }}
                  className="flex-1 flex items-center gap-3 text-left cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fill-success-tertiary text-text-success-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {member.name}
                    </span>
                    {member.relationship && (
                      <span className="ml-2 text-xs text-muted-foreground/70">
                        {member.relationship}
                      </span>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-xs text-text-success-primary bg-fill-success-tertiary group-hover:hidden"
                  >
                    Verified
                  </Badge>
                  <div className="hidden group-hover:block">
                    <ChildActionKebabMenu
                      onViewDetails={() =>
                        setTimelineChild(
                          matchingChild ?? {
                            id: member.id,
                            name: member.name,
                            status: 'complete',
                            formKey: 'kyc',
                            childType: 'kyc',
                          },
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {children.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            Pending Verification
          </h3>
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40 px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Compliance Verification In Progress
                </p>
                <p className="text-xs text-blue-800/80 dark:text-blue-200/70">
                  Identity verification has been initiated for {children.length}{' '}
                  {children.length === 1 ? 'individual' : 'individuals'}. Submitted
                  information is locked and has been forwarded to the verification
                  provider. Status updates will appear below as each review completes.
                </p>
              </div>
            </div>
          </div>
          {children.map((child) => (
            <div
              key={child.id}
              className="group w-full flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
            >
              <button
                onClick={() =>
                  dispatch({ type: 'ENTER_CHILD_ACTION', childId: child.id })
                }
                className="flex-1 flex items-center gap-3 text-left cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{child.name}</span>
              </button>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize text-xs group-hover:hidden">
                  {child.status.replace('_', ' ')}
                </Badge>
                <div className="hidden group-hover:block">
                  <ChildActionKebabMenu
                    onViewDetails={() => setTimelineChild(child)}
                    onDelete={() => dispatch({ type: 'REMOVE_CHILD', parentTaskId: kycTask!.id, childId: child.id })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {allDone ? (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-text-success-primary" />
          <p className="text-sm font-medium">
            All household members have been previously verified.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            No KYC action is required for this household. You may proceed to the next step.
          </p>
        </div>
      ) : needsKycMembers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {needsKycMembers.length > 1 && (
              <Checkbox
                checked={selectedIds.size === needsKycMembers.length}
                onCheckedChange={toggleSelectAll}
              />
            )}
            <h3 className="text-sm font-semibold">
              Requires Verification
            </h3>
          </div>
          {needsKycMembers.map((member) => {
            const isSelected = selectedIds.has(member.id)
            return (
              <div key={member.id} className="flex items-center gap-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelect(member.id)}
                />
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
                  className="flex-1 flex items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{member.name}</span>
                    {member.relationship && (
                      <span className="text-xs text-muted-foreground">
                        {member.relationship}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] text-text-warning-primary bg-fill-warning-tertiary shrink-0"
                    >
                      Needs verification
                    </Badge>
                  </div>
                </button>
              </div>
            )
          })}
          <Button
            className={`w-full ${selectedIds.size > 0 ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
            variant={selectedIds.size === 0 ? 'secondary' : 'default'}
            disabled={selectedIds.size === 0}
            onClick={() => setShowBatchConfirm(true)}
          >
            <ShieldAlert className="h-4 w-4 mr-2" />
            {selectedIds.size > 0
              ? `Initiate KYC for ${selectedIds.size} individual${selectedIds.size !== 1 ? 's' : ''}`
              : 'Select individuals to initiate KYC'}
          </Button>
        </div>
      )}

      {showBatchConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowBatchConfirm(false)}
          />
          <div className="relative z-10 bg-background rounded-lg border border-border shadow-lg max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-muted p-2 shrink-0">
                <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold">
                  Confirm Identity Verification
                </h3>
                <p className="text-sm text-muted-foreground">
                  You are about to initiate KYC verification for{' '}
                  {selectedMembers.length} individual
                  {selectedMembers.length !== 1 ? 's' : ''}:
                </p>
                <ul className="text-sm space-y-1">
                  {selectedMembers.map((m) => (
                    <li key={m.id} className="font-medium">
                      {m.name}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground">
                  This will trigger background checks through our verification
                  provider. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowBatchConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleBatchKyc}
              >
                Yes, Initiate KYC
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddHouseholdMemberSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        title="Add individual for verification"
        description="Search for an existing person or create a new individual to add for KYC verification."
      />

      <ChildActionTimelineSheet
        open={!!timelineChild}
        onOpenChange={(o) => { if (!o) setTimelineChild(null) }}
        child={timelineChild}
      />
    </div>
  )
}
