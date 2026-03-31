import { useWorkflow } from '@/stores/workflowStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Trash2 } from 'lucide-react'

export function KycForm() {
  const { state, dispatch } = useWorkflow()
  const kycTask = state.tasks.find((t) => t.formKey === 'kyc')
  const children = kycTask?.children ?? []

  const householdMembers = state.relatedParties.filter((p) => p.type === 'household_member')

  const spawnedMemberIds = children.map((c) => {
    const member = householdMembers.find((m) => m.name === c.name)
    return member?.id
  })

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review household members and start KYC review for each person.
      </p>

      <div className="space-y-3">
        {householdMembers.map((member) => {
          const isSpawned = spawnedMemberIds.includes(member.id)
          const child = children.find((c) => c.name === member.name)

          return (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {member.name[0]}
                </div>
                <span className="text-sm font-medium">{member.name}</span>
              </div>
              {isSpawned && child ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize text-xs">
                    {child.status.replace('_', ' ')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      dispatch({
                        type: 'REMOVE_KYC_CHILD',
                        parentTaskId: kycTask!.id,
                        childId: child.id,
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    dispatch({
                      type: 'SPAWN_KYC_CHILD',
                      parentTaskId: kycTask!.id,
                      childName: member.name,
                    })
                  }
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Start KYC Review
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
