import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { AccountType } from '@/types/workflow'
import type { RegistrationType } from '@/utils/registrationDocuments'
import { registrationTypeLabels } from '@/utils/registrationDocuments'
import { getAccountProductTypeForRegistration } from '@/utils/accountTypeFromRegistration'

const accountProductLabels: Record<AccountType, string> = {
  brokerage: 'Brokerage',
  ira: 'Traditional IRA',
  roth_ira: 'Roth IRA',
  '401k': '401(k)',
  trust: 'Trust',
  checking: 'Checking',
  savings: 'Savings',
}

export function ChildActionDetailSidebar() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()

  if (!ctx) return null

  const { child, subTaskId, config, subTaskIndex, totalSubTasks } = ctx

  const detailsData = state.taskData[`${child.id}-account-owners`] as Record<string, unknown> | undefined
  const legacyAccountType = detailsData?.accountType as AccountType | undefined
  const childMeta = state.taskData[child.id] as Record<string, unknown> | undefined
  const registrationType = childMeta?.registrationType as RegistrationType | undefined
  const productOverride = childMeta?.accountProductType as AccountType | undefined
  const resolvedProduct =
    productOverride ??
    (registrationType ? getAccountProductTypeForRegistration(registrationType) : undefined) ??
    legacyAccountType
  const productLabel = resolvedProduct ? accountProductLabels[resolvedProduct] : null
  const registrationLabel = registrationType ? registrationTypeLabels[registrationType] : null

  const ownerSlots =
    (detailsData?.owners as { partyId?: string; type: string }[] | undefined) ?? []
  const ownerIds = ownerSlots.filter((o) => o.type === 'existing' && o.partyId).map((o) => o.partyId!)
  const owners = state.relatedParties.filter((p) => ownerIds.includes(p.id))

  return (
    <div className="text-sm h-full">
      <Tabs defaultValue="details" className="h-full flex flex-col">
        <TabsList variant="border" className="w-full border-b border-border px-2 shrink-0">
          <TabsTrigger value="details" className="flex-1 text-xs">Details</TabsTrigger>
          <TabsTrigger value="context" className="flex-1 text-xs">Context</TabsTrigger>
          <TabsTrigger value="relationship" className="flex-1 text-xs">Owners</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="flex-1 overflow-y-auto p-4 mt-0">
          <div className="space-y-3">
            <div>
              <span className="text-muted-foreground">Account</span>
              <p className="font-medium text-foreground">{child.name}</p>
            </div>
            {productLabel && (
              <div>
                <span className="text-muted-foreground">Account type</span>
                <p className="font-medium text-foreground">{productLabel}</p>
              </div>
            )}
            {registrationLabel && (
              <div>
                <span className="text-muted-foreground">Registration</span>
                <p className="font-medium text-foreground">{registrationLabel}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Status</span>
              <p className="font-medium text-foreground capitalize">
                {child.status.replace('_', ' ')}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Progress</span>
              <p className="font-medium text-foreground">
                Step {subTaskIndex + 1} of {totalSubTasks}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="context" className="flex-1 overflow-y-auto p-4 mt-0">
          <div className="space-y-3">
            <div>
              <span className="text-muted-foreground">Child Action</span>
              <p className="font-medium text-foreground">{config.displayLabel}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Current Task</span>
              <p className="font-medium text-foreground">{ctx.currentSubTask.title}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Task ID</span>
              <p className="font-mono text-xs text-muted-foreground break-all">{subTaskId}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="relationship" className="flex-1 overflow-y-auto p-4 mt-0">
          <div className="space-y-3">
            {owners.length > 0 ? (
              owners.map((owner) => (
                <div key={owner.id} className="rounded-md border border-border p-3">
                  <p className="font-medium text-foreground">{owner.name}</p>
                  {owner.role && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-1">
                      {owner.role}
                    </Badge>
                  )}
                  {owner.kycStatus && (
                    <p className="text-xs mt-1">
                      KYC:{' '}
                      <span className={
                        owner.kycStatus === 'verified'
                          ? 'text-green-600'
                          : owner.kycStatus === 'pending'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }>
                        {owner.kycStatus === 'verified' ? 'Approved' : owner.kycStatus === 'needs_kyc' ? 'Not Started' : 'Pending'}
                      </span>
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No owners assigned yet. Add them in Account &amp; owners.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
