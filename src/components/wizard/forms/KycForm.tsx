import { useState } from 'react'
import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle2, ChevronRight, ShieldAlert, Clock } from 'lucide-react'

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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBatchConfirm, setShowBatchConfirm] = useState(false)

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
      )}

      {children.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pending Verification
          </h3>
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() =>
                dispatch({ type: 'ENTER_CHILD_ACTION', childId: child.id })
              }
              className="w-full flex items-center justify-between rounded-lg border border-border p-3 text-left cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                  <Clock className="h-4 w-4" />
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
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Requires Verification
            </h3>
            {needsKycMembers.length > 1 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {selectedIds.size === needsKycMembers.length
                  ? 'Deselect all'
                  : 'Select all'}
              </button>
            )}
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
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
    </div>
  )
}
