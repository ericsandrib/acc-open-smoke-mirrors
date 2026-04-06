import { useWorkflow, useChildActionContext } from '@/stores/workflowStore'
import { Badge } from '@/components/ui/badge'
import { computeSmartDocuments } from '@/utils/smartDocuments'
import type { LucideIcon } from 'lucide-react'
import { Sparkles, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

const bucketLabel: Record<string, string> = {
  account: 'Account',
  owner: 'Owner',
  funding: 'Funding / asset movement',
  feature: 'Feature',
}

type DocRow = { id: string; label: string; why: string; bucket: string }

function SmartDocumentsSection({
  title,
  icon: Icon,
  items,
  emptyHint,
}: {
  title: string
  icon: LucideIcon
  items: DocRow[]
  emptyHint: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground pl-5">{emptyHint}</p>
      ) : (
        <ul className="space-y-2 pl-0.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-border bg-background/80 px-2.5 py-2 text-xs leading-snug"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-foreground">{item.label}</span>
                <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
                  {bucketLabel[item.bucket] ?? item.bucket}
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{item.why}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function SmartDocumentsPanel() {
  const { state } = useWorkflow()
  const ctx = useChildActionContext()

  if (
    !ctx ||
    (ctx.child.childType !== 'account-opening' &&
      ctx.child.childType !== 'funding-line' &&
      ctx.child.childType !== 'feature-service-line')
  )
    return null

  const sd = computeSmartDocuments(state, ctx.child.id)
  const isFundingLine = ctx.child.childType === 'funding-line'
  const isFeatureLine = ctx.child.childType === 'feature-service-line'

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar-background">
      <div className="border-b border-border px-3 py-3 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">
          {isFundingLine
            ? 'Documents (this funding / asset movement)'
            : isFeatureLine
              ? 'Documents (this feature / service)'
              : 'Documents (this account)'}
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {isFundingLine
            ? 'Requirements driven by this funding or asset movement workflow. Refresh as you save movement type and bank details.'
            : isFeatureLine
              ? 'Requirements driven by this account feature or service workflow line.'
              : 'Rule-driven requirements for the account you are editing—updates on every step. Consolidated eSign for all accounts is prepared on the Open Accounts task, not here.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-[10px] gap-1">
            <AlertCircle className="h-3 w-3" />
            Required now: {sd.counts.requiredNow}
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1">
            Missing: {sd.counts.missing}
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            Satisfied: {sd.counts.satisfied}
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1">
            <Clock className="h-3 w-3" />
            May be later: {sd.counts.mayBeRequiredLater}
          </Badge>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-5 p-3 pb-6">
          <SmartDocumentsSection
            title="Required now"
            icon={AlertCircle}
            items={sd.requiredNow}
            emptyHint={
              isFundingLine
                ? 'Nothing required yet—pick a movement type to trigger rules.'
                : isFeatureLine
                  ? 'Nothing required yet—pick a feature or service type to trigger rules.'
                  : 'Nothing required yet—add registration, owners, funding lines, or feature workflows.'
            }
          />
          <SmartDocumentsSection
            title="May be required later"
            icon={Clock}
            items={sd.mayBeRequiredLater}
            emptyHint="No contingent items—rules are fully determined for current selections."
          />
          <SmartDocumentsSection
            title="Satisfied"
            icon={CheckCircle2}
            items={sd.satisfied}
            emptyHint="No documents satisfied yet."
          />
          <SmartDocumentsSection
            title="Triggered by recent changes"
            icon={Sparkles}
            items={sd.triggeredByRecentChanges}
            emptyHint="Edits haven’t added new document triggers."
          />
        </div>
      </div>

      <div className="shrink-0 border-t border-border px-3 py-2.5 text-[11px] text-muted-foreground">
        <p className="font-medium text-foreground truncate">{ctx.child.name}</p>
        <p>
          Step {ctx.subTaskIndex + 1} of {ctx.totalSubTasks}: {ctx.currentSubTask.title}
        </p>
      </div>
    </div>
  )
}
